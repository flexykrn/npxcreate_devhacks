"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/lib/AppContext";
import { updateNode } from "@/lib/localDb";
import { ArrowLeft, Sparkles, Image as ImageIcon, X, ChevronDown } from "lucide-react";

const STICKERS = ["⭐","🌈","❤️","🎯","💡","🔥","✅","📌","🎵","🦋","🌸","🏆","✨","🎨","🚀"];
const INK_COLORS = [
  { color: "#1a237e", label: "Blue" },
  { color: "#b71c1c", label: "Red" },
  { color: "#1b5e20", label: "Green" },
  { color: "#4a148c", label: "Purple" },
  { color: "#212121", label: "Black" },
];

const TOTAL_PAGES = 5;

const EXAMPLE_SCRIPT = `FADE IN:

INT. NEON-LIT DETECTIVE OFFICE - NIGHT

Rain hammers the grimy window. DETECTIVE MAYA CROSS, 30s, sharp eyes, cigarette dangling, studies a crime-scene photo pinned to a corkboard.

MAYA
(muttering)
Three bodies. Same mark. Someone's sending a message.

A knock at the door. TOMMY VEGA, 20s, nervous energy, soaked from the rain, steps in without waiting.

TOMMY
You Cross? They say you find people.

MAYA
I find the truth. Sometimes a person comes with it.
(beat)
Sit down. You're dripping on my floor.

Tommy drops into the chair. He slides a photograph across the desk — a woman, mid-40s, expensive coat, frightened eyes.

TOMMY
My sister. She disappeared three nights ago. Same night as the blackout.

Maya picks up the photo. Something flickers behind her eyes.

MAYA
Where was she last seen?

TOMMY
The Aurelius Hotel. Room 714.

Maya stubs out her cigarette. Stands. Grabs her coat.

MAYA
That room hasn't been rented in six years.
(beat)
Which means somebody went to a lot of trouble.

She heads for the door. Pauses.

MAYA (CONT'D)
You carrying?

Tommy blinks. Nods.

MAYA (CONT'D)
Keep it holstered unless I say otherwise.
The people who use that room — they don't negotiate.

EXT. AURELIUS HOTEL - CONTINUOUS

They step into the rain. The hotel looms ahead — dark windows, a busted neon sign flickering "AU EL US."

MAYA (V.O.)
In this city, the truth is always one floor above where you're standing.
And the elevator never works.

FADE TO:

INT. HOTEL CORRIDOR - FLOOR 7 - NIGHT

Maya moves down the corridor, hand near her holster. Tommy close behind.

A DOOR creaks open — Room 714.

Inside: a single lamp, burning. A chair. A note pinned to the wall.

Maya reads it. Her jaw tightens.

MAYA
She's alive.
(long pause)
But she doesn't want to be found.

SMASH CUT TO BLACK.`;

const PERSONAS = [
  { key: "writer_comedy",          label: "Comedy Writer",         emoji: "😂", group: "Dialogue" },
  { key: "writer_noir",            label: "Noir Writer",           emoji: "🕵️", group: "Dialogue" },
  { key: "character_psychologist", label: "Character Psychologist",emoji: "🧠", group: "Dialogue" },
  { key: "director_action",        label: "Action Director",       emoji: "💥", group: "Action"   },
  { key: "director_horror",        label: "Horror Director",       emoji: "👻", group: "Action"   },
  { key: "cinematographer",        label: "Cinematographer",       emoji: "🎥", group: "Action"   },
  { key: "world_builder",          label: "World Builder",         emoji: "🏗️", group: "Action"   },
  { key: "sound_designer",         label: "Sound Designer",        emoji: "🔊", group: "Action"   },
  { key: "script_doctor",          label: "Script Doctor",         emoji: "💊", group: "Analysis" },
  { key: "continuity_checker",     label: "Continuity Checker",    emoji: "📋", group: "Analysis" },
];

type Sticker = { id: number; emoji: string; x: number; y: number };
type PageData = { title: string; text: string; stickers: Sticker[]; sessionId?: string };

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

  // AI Panel
  const [aiTab, setAiTab] = useState<"enhance"|"vision">("enhance");
  const [selectedPersona, setSelectedPersona] = useState("writer_comedy");
  const [userFeedback, setUserFeedback] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [aiError, setAiError] = useState("");
  const [aiSuccess, setAiSuccess] = useState("");

  // Vision
  const [imageFile, setImageFile] = useState<File|null>(null);
  const [imagePreview, setImagePreview] = useState<string|null>(null);
  const [visionResult, setVisionResult] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const imgRef = useRef<HTMLInputElement>(null);

  const pageInnerRef = useRef<HTMLDivElement>(null);
  const textareaRef  = useRef<HTMLTextAreaElement>(null);

  const page = pages[currentPage];

  if (!currentProject || !currentNodeId) {
    return (
      <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"100vh", background:"#fdf8ff" }}>
        <div style={{ textAlign:"center" }}>
          <div style={{ fontSize:48, marginBottom:16 }}>📓</div>
          <div style={{ fontSize:18, color:"#6b7280" }}>Loading notebook...</div>
        </div>
      </div>
    );
  }

  useEffect(() => {
    if (currentProject && currentNodeId && !isLoaded) {
      const node = currentProject.nodes.find(n => n.id === currentNodeId);
      if (node) {
        setNodeTitle(node.title);
        try {
          if (node.content?.trim()) {
            const p = JSON.parse(node.content);
            if (Array.isArray(p) && p.length > 0) setPages(p);
          }
        } catch {}
        setIsLoaded(true);
      }
    }
  }, [currentProject, currentNodeId, isLoaded]);

  useEffect(() => {
    if (currentProject && currentNodeId && isLoaded) {
      const t = setTimeout(() => {
        updateNode(currentProject.id, currentNodeId, {
          content: JSON.stringify(pages), updatedAt: new Date().toISOString(),
        });
        triggerRefresh();
      }, 500);
      return () => clearTimeout(t);
    }
  }, [pages, currentProject, currentNodeId, isLoaded, triggerRefresh]);

  const updatePage = (partial: Partial<PageData>) =>
    setPages(prev => prev.map((p, i) => i === currentPage ? { ...p, ...partial } : p));

  useEffect(() => {
    setDateStr(new Date().toLocaleDateString("en-US", { weekday:"short", month:"short", day:"numeric", year:"numeric" }));
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
    updatePage({ stickers: [...page.stickers, { id: Date.now(), emoji, x: 80 + Math.random()*400, y: 80 + Math.random()*350 }] });
    setStickerIndex(i => i + 1);
  };

  const clearPage = () => { if (confirm("Clear this page?")) updatePage({ text:"", stickers:[] }); };

  const onStickerMouseDown = (e: React.MouseEvent, id: number) => {
    e.preventDefault();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setDragging({ id, ox: e.clientX - rect.left, oy: e.clientY - rect.top });
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!dragging || !pageInnerRef.current) return;
    const pr = pageInnerRef.current.getBoundingClientRect();
    updatePage({ stickers: page.stickers.map(s =>
      s.id === dragging.id ? { ...s, x: e.clientX - pr.left - dragging.ox, y: e.clientY - pr.top - dragging.oy } : s
    )});
  };

  const goToPage = (i: number) => { if (i >= 0 && i < TOTAL_PAGES) setCurrentPage(i); };

  // ── AI: First process text then apply persona ─────────────────────────────
  const handleEnhance = async () => {
    if (!page.text.trim()) { setAiError("Write something on this page first!"); return; }
    setIsProcessing(true); setAiError(""); setAiSuccess("");
    try {
      // Step 1: process text to build session
      const sessionId = page.sessionId || (currentProject?.id + "-" + currentNodeId);
      const fd1 = new FormData();
      fd1.append("raw_text", page.text);
      fd1.append("session_id", sessionId);
      const r1 = await fetch("http://localhost:8080/api/v1/process-text", { method:"POST", body:fd1 });
      if (!r1.ok) throw new Error(`Parse error ${r1.status}`);
      const d1 = await r1.json();

      // Step 2: apply persona via agent handoff
      const fd2 = new FormData();
      fd2.append("session_id", sessionId);
      fd2.append("persona", selectedPersona);
      if (userFeedback.trim()) fd2.append("user_feedback", userFeedback);
      const r2 = await fetch("http://localhost:8080/api/v1/pipeline/stage3-agent-handoff", { method:"POST", body:fd2 });
      if (!r2.ok) throw new Error(`Agent error ${r2.status}`);
      const d2 = await r2.json();

      const finalText = d2.clean_text || d1.clean_text || "";
      if (finalText) {
        updatePage({ text: finalText, sessionId });
        setAiSuccess(`Enhanced with ${PERSONAS.find(p=>p.key===selectedPersona)?.label || selectedPersona}!`);
      } else {
        setAiError("AI returned empty result. Try again.");
      }
    } catch (e) {
      setAiError("Backend error. Is it running on port 8080?");
      console.error(e);
    } finally {
      setIsProcessing(false);
    }
  };

  // ── Vision: analyze image ─────────────────────────────────────────────────
  const handleVisionAnalyze = async () => {
    if (!imageFile) { setAiError("Upload an image first."); return; }
    setIsAnalyzing(true); setAiError(""); setVisionResult("");
    try {
      const sessionId = page.sessionId || (currentProject?.id + "-" + currentNodeId);
      const fd = new FormData();
      fd.append("file", imageFile);
      fd.append("session_id", sessionId);
      const r = await fetch("http://localhost:8080/api/v1/vision/analyze", { method:"POST", body:fd });
      if (!r.ok) throw new Error(`Vision error ${r.status}`);
      const d = await r.json();
      setVisionResult(d.analysis || "");
      updatePage({ sessionId });
      setAiSuccess("Visual context saved! Future enhancements will use this image.");
    } catch (e) {
      setAiError("Vision error. Check backend is running.");
      console.error(e);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const onImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setImageFile(f);
    setVisionResult("");
    const reader = new FileReader();
    reader.onload = ev => setImagePreview(ev.target?.result as string);
    reader.readAsDataURL(f);
  };

  const groups = ["Dialogue","Action","Analysis"];

  return (
    <div
      className="min-h-screen flex gap-0"
      style={{ background:"#e8e0d5", fontFamily:"Patrick Hand, cursive" }}
      onMouseMove={onMouseMove}
      onMouseUp={() => setDragging(null)}
    >
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Caveat:wght@400;600;700&family=Schoolbell&family=Patrick+Hand&display=swap');`}</style>

      {/* ── LEFT: Notebook ── */}
      <div className="flex-1 flex flex-col items-center px-5 pt-24 pb-16" style={{
        backgroundImage:`repeating-linear-gradient(45deg,#d6cfc4 0px,#d6cfc4 1px,transparent 1px,transparent 12px),repeating-linear-gradient(-45deg,#d6cfc4 0px,#d6cfc4 1px,transparent 1px,transparent 12px)`
      }}>

        {/* Back */}
        <div className="w-full max-w-3xl mb-4">
          <button onClick={() => router.push(currentProject ? `/project/${currentProject.id}/tree` : "/dashboard")}
            className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-gray-300 rounded-lg text-gray-700 hover:bg-blue-500 hover:text-white hover:border-blue-500 transition-all shadow-md"
            style={{ fontFamily:"Patrick Hand, cursive", fontSize:"1rem" }}>
            <ArrowLeft className="w-4 h-4" /> Back to Tree
          </button>
        </div>

        {/* Top bar */}
        <div className="w-full max-w-3xl flex items-center justify-between mb-6">
          <div className="text-white px-4 py-1.5 rounded shadow-md select-none"
            style={{ background:"#e53935", fontFamily:"Schoolbell, cursive", fontSize:"1.4rem", letterSpacing:1 }}>
            📓 {nodeTitle || "Untitled Node"}
          </div>
          <div className="flex items-center gap-2.5">
            {INK_COLORS.map(({ color, label }) => (
              <button key={color} title={label} onClick={() => setInkColor(color)}
                className="w-7 h-7 rounded-full border-[3px] border-white shadow-md transition-transform hover:scale-110"
                style={{ background:color, outline: inkColor===color ? "3px solid #333" : "none", outlineOffset:2 }} />
            ))}
            <div className="w-px h-7 bg-gray-300 mx-1" />
            <button onClick={addSticker} className="bg-white border-2 border-gray-300 rounded-lg px-3 py-1.5 text-sm text-gray-700 hover:bg-red-500 hover:text-white hover:border-red-500 transition-all">🌟 Sticker</button>
            <button
              onClick={() => { if (!page.text.trim() || confirm("Replace page with example screenplay?")) { updatePage({ title:"Detective Thriller", text:EXAMPLE_SCRIPT }); } }}
              className="bg-white border-2 border-purple-300 rounded-lg px-3 py-1.5 text-sm text-purple-700 hover:bg-purple-500 hover:text-white hover:border-purple-500 transition-all"
              title="Load example screenplay to test AI features">
              📄 Example
            </button>
            <button onClick={clearPage}  className="bg-white border-2 border-gray-300 rounded-lg px-3 py-1.5 text-sm text-gray-700 hover:bg-red-500 hover:text-white hover:border-red-500 transition-all">🗑 Clear</button>
            <button onClick={() => window.print()} className="bg-white border-2 border-gray-300 rounded-lg px-3 py-1.5 text-sm text-gray-700 hover:bg-red-500 hover:text-white hover:border-red-500 transition-all">🖨 Print</button>
          </div>
        </div>

        {/* Notebook */}
        <div className="w-full max-w-3xl rounded-lg overflow-hidden" style={{ boxShadow:"6px 6px 32px rgba(0,0,0,0.18)" }}>
          <div ref={pageInnerRef} style={{
            backgroundImage:`linear-gradient(to right,transparent 79px,#f4a7b9 79px,#f4a7b9 81px,transparent 81px),repeating-linear-gradient(to bottom,transparent 0px,transparent 31px,#c5d8f0 31px,#c5d8f0 32px)`,
            backgroundColor:"#fdfaf3", position:"relative"
          }}>
            {/* Header */}
            <div className="h-16 border-b-2 border-blue-200 flex items-end gap-3 pb-2"
              style={{ paddingLeft:96, paddingRight:24, background:"linear-gradient(to bottom,#fef3e2 0%,#fdfaf3 100%)" }}>
              <input type="text" value={page.title} onChange={e => updatePage({ title:e.target.value })}
                placeholder="Title your page…" maxLength={60}
                className="bg-transparent border-none outline-none flex-1 font-bold tracking-wide"
                style={{ fontFamily:"Caveat, cursive", fontSize:"1.8rem", color:"#d32f2f" }} />
              <span className="text-gray-400 whitespace-nowrap pb-0.5 shrink-0"
                style={{ fontFamily:"Caveat, cursive", fontSize:"0.95rem" }}>{dateStr}</span>
            </div>

            {/* Stickers */}
            {page.stickers.map(s => (
              <div key={s.id} className="absolute text-4xl select-none cursor-move hover:scale-125 transition-transform"
                style={{ left:s.x, top:s.y, lineHeight:1, zIndex: dragging?.id===s.id ? 99 : 20 }}
                onMouseDown={e => onStickerMouseDown(e, s.id)}
                onDoubleClick={() => updatePage({ stickers: page.stickers.filter(st => st.id !== s.id) })}>
                {s.emoji}
              </div>
            ))}

            {/* Writing area */}
            <div style={{ padding:"8px 24px 80px 96px" }}>
              <textarea ref={textareaRef} value={page.text} onChange={e => updatePage({ text:e.target.value })}
                placeholder={"Start writing here... ✍️\n\nPaste your screenplay, jot ideas, write scenes...\n\nThen use AI Enhance → to transform it!"}
                className="w-full bg-transparent border-none outline-none resize-none block"
                style={{ fontFamily:"Caveat, cursive", fontSize:"1.35rem", color:inkColor, lineHeight:"32px", letterSpacing:"0.5px", caretColor:"#d32f2f", WebkitTextFillColor:inkColor, minHeight:600, overflow:"hidden" }} />
            </div>

            {/* Page nav */}
            <div className="sticky bottom-0 left-0 flex items-center gap-2 p-4"
              style={{ background:"linear-gradient(to top,#fdfaf3 70%,transparent)" }}>
              <button onClick={() => goToPage(currentPage-1)} disabled={currentPage===0}
                className="w-8 h-8 rounded-full flex items-center justify-center border-2 border-gray-300 bg-white text-gray-600 transition-all hover:bg-red-500 hover:text-white hover:border-red-500 disabled:opacity-30 disabled:cursor-not-allowed">‹</button>
              <div className="flex items-center gap-1.5">
                {Array.from({ length:TOTAL_PAGES }).map((_,i) => (
                  <button key={i} onClick={() => goToPage(i)} className="transition-all rounded-full"
                    style={{ width:i===currentPage?28:10, height:10, background:i===currentPage?"#e53935":pages[i].text.trim()?"#b0bec5":"#ddd", border:"none", cursor:"pointer" }} />
                ))}
              </div>
              <button onClick={() => goToPage(currentPage+1)} disabled={currentPage===TOTAL_PAGES-1}
                className="w-8 h-8 rounded-full flex items-center justify-center border-2 border-gray-300 bg-white text-gray-600 transition-all hover:bg-red-500 hover:text-white hover:border-red-500 disabled:opacity-30 disabled:cursor-not-allowed">›</button>
              <span className="ml-2 text-gray-400 text-sm select-none" style={{ fontFamily:"Caveat, cursive", fontSize:"1rem" }}>
                Page {currentPage+1} of {TOTAL_PAGES}
              </span>
              <span className="ml-auto text-gray-400 text-sm pr-2 select-none" style={{ fontFamily:"Patrick Hand, cursive" }}>
                {wordCount} word{wordCount!==1?"s":""} · {page.text.length} chars
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── RIGHT: AI Panel ── */}
      <div className="w-80 flex-shrink-0 flex flex-col" style={{
        background:"linear-gradient(180deg,#1e1030 0%,#2d1b4e 100%)",
        borderLeft:"1px solid rgba(147,74,203,0.3)", paddingTop:24, paddingBottom:24
      }}>
        {/* Header */}
        <div className="px-5 mb-4">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles size={18} color="#c084fc" />
            <span style={{ fontFamily:"Schoolbell, cursive", fontSize:"1.3rem", color:"#e9d5ff" }}>AI Studio</span>
          </div>
          <p style={{ fontSize:11, color:"#9ca3af", fontFamily:"Patrick Hand, cursive" }}>
            Enhance your script or analyze reference images
          </p>
        </div>

        {/* Tabs */}
        <div className="flex mx-5 mb-4 rounded-lg overflow-hidden border border-purple-800">
          <button onClick={() => setAiTab("enhance")}
            className="flex-1 py-2 text-sm font-semibold transition-all"
            style={{ background: aiTab==="enhance" ? "linear-gradient(135deg,#7c3aed,#c026d3)" : "transparent",
                     color: aiTab==="enhance" ? "#fff" : "#9ca3af", fontFamily:"Patrick Hand, cursive" }}>
            ✨ Enhance
          </button>
          <button onClick={() => setAiTab("vision")}
            className="flex-1 py-2 text-sm font-semibold transition-all"
            style={{ background: aiTab==="vision" ? "linear-gradient(135deg,#0284c7,#7c3aed)" : "transparent",
                     color: aiTab==="vision" ? "#fff" : "#9ca3af", fontFamily:"Patrick Hand, cursive" }}>
            🖼 Vision
          </button>
        </div>

        {/* Error / Success */}
        {aiError && (
          <div className="mx-5 mb-3 p-3 rounded-lg text-xs" style={{ background:"#450a0a", border:"1px solid #dc2626", color:"#fca5a5" }}>
            ⚠️ {aiError}
            <button onClick={() => setAiError("")} className="ml-2 underline">dismiss</button>
          </div>
        )}
        {aiSuccess && (
          <div className="mx-5 mb-3 p-3 rounded-lg text-xs" style={{ background:"#052e16", border:"1px solid #16a34a", color:"#86efac" }}>
            ✅ {aiSuccess}
            <button onClick={() => setAiSuccess("")} className="ml-2 underline">dismiss</button>
          </div>
        )}

        {/* ── ENHANCE TAB ── */}
        {aiTab === "enhance" && (
          <div className="flex-1 overflow-y-auto px-5 flex flex-col gap-4">
            <p style={{ fontSize:11, color:"#9ca3af", fontFamily:"Patrick Hand, cursive" }}>
              Pick a persona. The AI will rewrite your script in that style using your stored context.
            </p>

            {groups.map(group => (
              <div key={group}>
                <p style={{ fontSize:10, color:"#6b7280", fontFamily:"Patrick Hand, cursive", textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:6 }}>
                  {group}
                </p>
                <div className="flex flex-col gap-1.5">
                  {PERSONAS.filter(p => p.group === group).map(p => (
                    <button key={p.key} onClick={() => setSelectedPersona(p.key)}
                      className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all text-left"
                      style={{
                        background: selectedPersona===p.key ? "linear-gradient(135deg,rgba(124,58,237,0.6),rgba(192,38,211,0.4))" : "rgba(255,255,255,0.05)",
                        border: selectedPersona===p.key ? "1px solid #c084fc" : "1px solid rgba(255,255,255,0.08)",
                        color: selectedPersona===p.key ? "#e9d5ff" : "#9ca3af",
                      }}>
                      <span style={{ fontSize:16 }}>{p.emoji}</span>
                      <span style={{ fontSize:12, fontFamily:"Patrick Hand, cursive" }}>{p.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}

            {/* Custom directive */}
            <div>
              <p style={{ fontSize:10, color:"#6b7280", fontFamily:"Patrick Hand, cursive", textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:6 }}>
                Custom Directive (optional)
              </p>
              <textarea value={userFeedback} onChange={e => setUserFeedback(e.target.value)}
                placeholder="e.g. Make it rain, add more tension..."
                className="w-full rounded-xl p-3 text-sm resize-none border"
                style={{ background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", color:"#e9d5ff", fontFamily:"Patrick Hand, cursive", fontSize:12, minHeight:70 }} />
            </div>

            <button onClick={handleEnhance} disabled={isProcessing}
              className="w-full py-3 rounded-xl font-bold text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              style={{ background: isProcessing ? "rgba(124,58,237,0.4)" : "linear-gradient(135deg,#7c3aed,#c026d3)", color:"#fff", fontFamily:"Schoolbell, cursive", fontSize:"1.1rem" }}>
              <Sparkles size={16} />
              {isProcessing ? "Processing..." : "Enhance Script"}
            </button>
          </div>
        )}

        {/* ── VISION TAB ── */}
        {aiTab === "vision" && (
          <div className="flex-1 overflow-y-auto px-5 flex flex-col gap-4">
            <p style={{ fontSize:11, color:"#9ca3af", fontFamily:"Patrick Hand, cursive" }}>
              Upload a reference image. The AI will analyze it and carry visual context into future script enhancements.
            </p>

            {/* Upload area */}
            <div
              onClick={() => imgRef.current?.click()}
              className="rounded-xl border-2 border-dashed flex flex-col items-center justify-center p-4 cursor-pointer transition-all"
              style={{ borderColor: imagePreview ? "#c084fc" : "rgba(147,74,203,0.4)", background:"rgba(255,255,255,0.03)", minHeight:140 }}>
              {imagePreview ? (
                <div className="relative w-full">
                  <img src={imagePreview} alt="preview" className="w-full rounded-lg" style={{ maxHeight:160, objectFit:"cover" }} />
                  <button onClick={e => { e.stopPropagation(); setImageFile(null); setImagePreview(null); setVisionResult(""); }}
                    className="absolute top-1 right-1 w-6 h-6 rounded-full flex items-center justify-center"
                    style={{ background:"rgba(0,0,0,0.7)", color:"#fff" }}>
                    <X size={12} />
                  </button>
                  <p className="text-xs mt-2 text-center" style={{ color:"#9ca3af" }}>{imageFile?.name}</p>
                </div>
              ) : (
                <>
                  <ImageIcon size={32} color="#7c3aed" style={{ marginBottom:8 }} />
                  <p style={{ fontSize:12, color:"#9ca3af", fontFamily:"Patrick Hand, cursive", textAlign:"center" }}>
                    Click to upload image<br/>JPG, PNG, WebP
                  </p>
                </>
              )}
              <input ref={imgRef} type="file" accept="image/*" className="hidden" onChange={onImageChange} />
            </div>

            <button onClick={handleVisionAnalyze} disabled={isAnalyzing || !imageFile}
              className="w-full py-3 rounded-xl font-bold text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              style={{ background: isAnalyzing ? "rgba(2,132,199,0.4)" : "linear-gradient(135deg,#0284c7,#7c3aed)", color:"#fff", fontFamily:"Schoolbell, cursive", fontSize:"1.1rem" }}>
              <ImageIcon size={16} />
              {isAnalyzing ? "Analyzing..." : "Analyze Image"}
            </button>

            {visionResult && (
              <div className="rounded-xl p-3" style={{ background:"rgba(255,255,255,0.05)", border:"1px solid rgba(147,74,203,0.3)" }}>
                <p style={{ fontSize:10, color:"#c084fc", fontFamily:"Patrick Hand, cursive", textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:6 }}>
                  Visual Analysis
                </p>
                <p style={{ fontSize:11, color:"#e9d5ff", fontFamily:"Patrick Hand, cursive", lineHeight:1.6, whiteSpace:"pre-wrap" }}>
                  {visionResult}
                </p>
              </div>
            )}

            <div className="rounded-xl p-3" style={{ background:"rgba(16,185,129,0.08)", border:"1px solid rgba(16,185,129,0.2)" }}>
              <p style={{ fontSize:11, color:"#6ee7b7", fontFamily:"Patrick Hand, cursive" }}>
                💡 After analyzing an image, go to the Enhance tab and apply any persona — the visual context will automatically be used to style the script!
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}