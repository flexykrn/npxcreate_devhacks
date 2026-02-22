"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/lib/AppContext";
import { updateNode } from "@/lib/localDb";
import { ArrowLeft, Sparkles } from "lucide-react";

const STICKERS = ["⭐","🌈","❤️","🎯","💡","🔥","✅","📌","🎵","🦋","🌸","🏆","✨","🎨","🚀"];
const INK_COLORS = [
  { color: "#1a237e", label: "Blue" },
  { color: "#b71c1c", label: "Red" },
  { color: "#1b5e20", label: "Green" },
  { color: "#4a148c", label: "Purple" },
  { color: "#212121", label: "Black" },
];

const TOTAL_PAGES = 5;

type Sticker = { id: number; emoji: string; x: number; y: number };
type PageData = { title: string; text: string; stickers: Sticker[] };

const emptyPage = (): PageData => ({ title: "", text: "", stickers: [] });

export default function NotebookPage() {
  const router = useRouter();
  const { currentProject, currentNodeId, triggerRefresh } = useApp();
  const [pages, setPages] = useState<PageData[]>(Array.from({ length: TOTAL_PAGES }, emptyPage));
  const [currentPage, setCurrentPage] = useState(0);
  const [inkColor, setInkColor] = useState("#1a237e");
  const [stickerIndex, setStickerIndex] = useState(0);
  const [dateStr, setDateStr] = useState("");
  const [dragging, setDragging] = useState<{ id: number; ox: number; oy: number } | null>(null);
  const [nodeTitle, setNodeTitle] = useState("");
  const [isLoaded, setIsLoaded] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [enhanceError, setEnhanceError] = useState("");

  const pageInnerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const page = pages[currentPage];

  if (!currentProject || !currentNodeId) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#fdf8ff' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📓</div>
          <div style={{ fontSize: 18, color: '#6b7280' }}>Loading notebook...</div>
        </div>
      </div>
    )
  }

  useEffect(() => {
    if (currentProject && currentNodeId && !isLoaded) {
      const node = currentProject.nodes.find(n => n.id === currentNodeId);
      if (node) {
        setNodeTitle(node.title);
        try {
          if (node.content && node.content.trim()) {
            const parsedPages = JSON.parse(node.content);
            if (Array.isArray(parsedPages) && parsedPages.length > 0) {
              setPages(parsedPages);
            }
          }
        } catch (e) {
          console.error("Failed to parse node content:", e);
        }
        setIsLoaded(true);
      }
    }
  }, [currentProject, currentNodeId, isLoaded]);

  useEffect(() => {
    if (currentProject && currentNodeId && isLoaded) {
      const saveTimeout = setTimeout(() => {
        updateNode(currentProject.id, currentNodeId, {
          content: JSON.stringify(pages),
          updatedAt: new Date().toISOString(),
        });
        triggerRefresh();
      }, 500); // Debounce saves by 500ms

      return () => clearTimeout(saveTimeout);
    }
  }, [pages, currentProject, currentNodeId, isLoaded, triggerRefresh]);

  const updatePage = (partial: Partial<PageData>) => {
    setPages(prev => prev.map((p, i) => i === currentPage ? { ...p, ...partial } : p));
  };

  useEffect(() => {
    setDateStr(new Date().toLocaleDateString("en-US", {
      weekday: "short", month: "short", day: "numeric", year: "numeric",
    }));
  }, []);

  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.max(600, ta.scrollHeight) + "px";
  }, [page.text, currentPage]);

  useEffect(() => {
    setTimeout(() => textareaRef.current?.focus(), 50);
  }, [currentPage]);

  const wordCount = page.text.trim() ? page.text.trim().split(/\s+/).length : 0;

  const addSticker = () => {
    const emoji = STICKERS[stickerIndex % STICKERS.length];
    updatePage({
      stickers: [...page.stickers, {
        id: Date.now(),
        emoji,
        x: 80 + Math.random() * 400,
        y: 80 + Math.random() * 350,
      }]
    });
    setStickerIndex(i => i + 1);
  };

  const clearPage = () => {
    if (confirm("Clear this page?")) {
      updatePage({ text: "", stickers: [] });
    }
  };

  const enhancePage = async () => {
    if (!page.text.trim()) return;
    setIsEnhancing(true);
    setEnhanceError("");
    try {
      const res = await fetch("http://localhost:8080/api/v1/process-text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: page.text,
          session_id: currentProject?.id || "default",
        }),
      });
      if (!res.ok) throw new Error(`Backend error: ${res.status}`);
      const data = await res.json();
      // Extract enhanced text from response
      const enhanced =
        data?.enhanced_script ||
        data?.result?.enhanced_script ||
        data?.scenes?.map((s: { content?: string; text?: string }) => s.content || s.text || "").join("\n\n") ||
        data?.content ||
        "";
      if (enhanced) {
        updatePage({ text: enhanced });
      } else {
        setEnhanceError("AI returned empty response. Try again.");
      }
    } catch (err) {
      setEnhanceError("Could not reach AI backend. Is it running on port 8080?");
      console.error(err);
    } finally {
      setIsEnhancing(false);
    }
  };

  const onStickerMouseDown = (e: React.MouseEvent, id: number) => {
    e.preventDefault();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setDragging({ id, ox: e.clientX - rect.left, oy: e.clientY - rect.top });
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!dragging || !pageInnerRef.current) return;
    const pr = pageInnerRef.current.getBoundingClientRect();
    updatePage({
      stickers: page.stickers.map(s =>
        s.id === dragging.id
          ? { ...s, x: e.clientX - pr.left - dragging.ox, y: e.clientY - pr.top - dragging.oy }
          : s
      )
    });
  };

  const goToPage = (i: number) => {
    if (i >= 0 && i < TOTAL_PAGES) setCurrentPage(i);
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-start px-5 pt-24 pb-16"
      style={{
        background: "#e8e0d5",
        backgroundImage: `
          repeating-linear-gradient(45deg,  #d6cfc4 0px, #d6cfc4 1px, transparent 1px, transparent 12px),
          repeating-linear-gradient(-45deg, #d6cfc4 0px, #d6cfc4 1px, transparent 1px, transparent 12px)
        `,
        fontFamily: "Patrick Hand, cursive",
      }}
      onMouseMove={onMouseMove}
      onMouseUp={() => setDragging(null)}
    >
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Caveat:wght@400;600;700&family=Schoolbell&family=Patrick+Hand&display=swap');`}</style>

      {/* ── Back to Tree Button ── */}
      <div className="w-full max-w-215 mb-4">
        <button
          onClick={() => {
            if (currentProject) {
              router.push(`/project/${currentProject.id}/tree`)
            } else {
              router.push('/dashboard')
            }
          }}
          className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-gray-300 rounded-lg text-gray-700 hover:bg-blue-500 hover:text-white hover:border-blue-500 transition-all shadow-md"
          style={{ fontFamily: "Patrick Hand, cursive", fontSize: "1rem" }}
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Tree
        </button>
      </div>

      {/* ── Top Bar ── */}
      <div className="w-full max-w-215 flex items-center justify-between mb-6">
        <div
          className="text-white px-4 py-1.5 rounded shadow-md select-none"
          style={{ background: "#e53935", fontFamily: "Schoolbell, cursive", fontSize: "1.4rem", letterSpacing: 1 }}
        >
          📓 {nodeTitle || "Untitled Node"}
        </div>

        <div className="flex items-center gap-2.5">
          {INK_COLORS.map(({ color, label }) => (
            <button
              key={color}
              title={label}
              onClick={() => setInkColor(color)}
              className="w-7 h-7 rounded-full border-[3px] border-white shadow-md transition-transform hover:scale-110"
              style={{
                background: color,
                outline: inkColor === color ? "3px solid #333" : "none",
                outlineOffset: 2,
              }}
            />
          ))}
          <div className="w-px h-7 bg-gray-300 mx-1" />
          <button onClick={addSticker} className="bg-white border-2 border-gray-300 rounded-lg px-3 py-1.5 text-sm text-gray-700 hover:bg-red-500 hover:text-white hover:border-red-500 transition-all">
            🌟 Sticker
          </button>
          <button onClick={clearPage} className="bg-white border-2 border-gray-300 rounded-lg px-3 py-1.5 text-sm text-gray-700 hover:bg-red-500 hover:text-white hover:border-red-500 transition-all">
            🗑 Clear
          </button>
          <button onClick={() => window.print()} className="bg-white border-2 border-gray-300 rounded-lg px-3 py-1.5 text-sm text-gray-700 hover:bg-red-500 hover:text-white hover:border-red-500 transition-all">
            🖨 Print
          </button>
          <div className="w-px h-7 bg-gray-300 mx-1" />
          <button
            onClick={enhancePage}
            disabled={isEnhancing || !page.text.trim()}
            className="flex items-center gap-1.5 border-2 rounded-lg px-3 py-1.5 text-sm font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background: isEnhancing ? "#7c3aed" : "linear-gradient(135deg, #7c3aed, #c026d3)",
              color: "#fff",
              borderColor: "#7c3aed",
            }}
            title="Enhance with AI (Groq)"
          >
            <Sparkles size={14} />
            {isEnhancing ? "Enhancing…" : "AI Enhance"}
          </button>
        </div>
      </div>

      {/* ── AI Error Banner ── */}
      {enhanceError && (
        <div className="w-full max-w-215 mb-3 px-4 py-2 rounded-lg text-sm font-medium"
          style={{ background: "#fef2f2", border: "1px solid #fca5a5", color: "#dc2626" }}>
          ⚠️ {enhanceError}
          <button onClick={() => setEnhanceError("")} className="ml-3 underline text-xs">dismiss</button>
        </div>
      )}

      {/* ── Notebook ── */}
      <div
        className="w-full max-w-215 rounded-lg overflow-hidden"
        style={{ boxShadow: "6px 6px 32px rgba(0,0,0,0.18)" }}
      >
        <div
          ref={pageInnerRef}
          style={{
            backgroundImage: `
              linear-gradient(to right, transparent 79px, #f4a7b9 79px, #f4a7b9 81px, transparent 81px),
              repeating-linear-gradient(to bottom, transparent 0px, transparent 31px, #c5d8f0 31px, #c5d8f0 32px)
            `,
            backgroundColor: "#fdfaf3",
            position: "relative",
          }}
        >
          {/* Page Header */}
          <div
            className="h-16 border-b-2 border-blue-200 flex items-end gap-3 pb-2"
            style={{ paddingLeft: 96, paddingRight: 24, background: "linear-gradient(to bottom, #fef3e2 0%, #fdfaf3 100%)" }}
          >
            <input
              type="text"
              value={page.title}
              onChange={e => updatePage({ title: e.target.value })}
              placeholder="Title your page…"
              maxLength={60}
              className="bg-transparent border-none outline-none flex-1 font-bold tracking-wide"
              style={{ fontFamily: "Caveat, cursive", fontSize: "1.8rem", color: "#d32f2f" }}
            />
            <span className="text-gray-400 whitespace-nowrap pb-0.5 shrink-0" style={{ fontFamily: "Caveat, cursive", fontSize: "0.95rem" }}>
              {dateStr}
            </span>
          </div>

          {/* Stickers */}
          {page.stickers.map(s => (
            <div
              key={s.id}
              className="absolute text-4xl select-none cursor-move hover:scale-125 transition-transform"
              style={{ left: s.x, top: s.y, lineHeight: 1, zIndex: dragging?.id === s.id ? 99 : 20 }}
              onMouseDown={e => onStickerMouseDown(e, s.id)}
              onDoubleClick={() => updatePage({ stickers: page.stickers.filter(st => st.id !== s.id) })}
            >
              {s.emoji}
            </div>
          ))}

          {/* Writing Area */}
          <div style={{ padding: "8px 24px 80px 96px" }}>
            <textarea
              ref={textareaRef}
              value={page.text}
              onChange={e => updatePage({ text: e.target.value })}
              placeholder={"Start writing here… ✍️\n\nYour thoughts, ideas, homework, doodles, dreams…\n\nEvery great story starts with a blank page."}
              className="w-full bg-transparent border-none outline-none resize-none block"
              style={{
                fontFamily: "Caveat, cursive",
                fontSize: "1.35rem",
                color: inkColor,
                lineHeight: "32px",
                letterSpacing: "0.5px",
                caretColor: "#d32f2f",
                WebkitTextFillColor: inkColor,
                minHeight: 600,
                overflow: "hidden",
              }}
            />
          </div>

          {/* ── Page Changer — bottom left ── */}
          <div
            className="sticky bottom-0 left-0 flex items-center gap-2 p-4"
            style={{ background: "linear-gradient(to top, #fdfaf3 70%, transparent)" }}
          >
            {/* Prev arrow */}
            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 0}
              className="w-8 h-8 rounded-full flex items-center justify-center border-2 border-gray-300 bg-white text-gray-600 transition-all hover:bg-red-500 hover:text-white hover:border-red-500 disabled:opacity-30 disabled:cursor-not-allowed"
              style={{ fontFamily: "Patrick Hand, cursive" }}
            >
              ‹
            </button>

            {/* Page dots */}
            <div className="flex items-center gap-1.5">
              {Array.from({ length: TOTAL_PAGES }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => goToPage(i)}
                  className="transition-all rounded-full"
                  style={{
                    width: i === currentPage ? 28 : 10,
                    height: 10,
                    background: i === currentPage ? "#e53935" : pages[i].text.trim() ? "#b0bec5" : "#ddd",
                    border: "none",
                    cursor: "pointer",
                  }}
                  title={`Page ${i + 1}${pages[i].title ? ` — ${pages[i].title}` : ""}`}
                />
              ))}
            </div>

            {/* Next arrow */}
            <button
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === TOTAL_PAGES - 1}
              className="w-8 h-8 rounded-full flex items-center justify-center border-2 border-gray-300 bg-white text-gray-600 transition-all hover:bg-red-500 hover:text-white hover:border-red-500 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              ›
            </button>

            {/* Page label */}
            <span
              className="ml-2 text-gray-400 text-sm select-none"
              style={{ fontFamily: "Caveat, cursive", fontSize: "1rem" }}
            >
              Page {currentPage + 1} of {TOTAL_PAGES}
            </span>

            {/* Word count pushed to right */}
            <span
              className="ml-auto text-gray-400 text-sm pr-2 select-none"
              style={{ fontFamily: "Patrick Hand, cursive" }}
            >
              {wordCount} word{wordCount !== 1 ? "s" : ""} · {page.text.length} chars
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}