"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { motion, useMotionValue, AnimatePresence } from "framer-motion"
import { Upload, X, FileText, LinkIcon, Sparkles } from "lucide-react"

const colors = ["#cfaad8", "#934acb", "#48229a", "#dd00ee"]
const nodeLinks = ["/notebook", "/notebook", "/notebook", "/notebook"]
const nodeLabels = ["Dashboard", "Notebook", "Features", "About"]
const SIZE   = 100
const GAP    = 150 // centre-to-centre spacing

/* Compute centred initial positions */
function getInitial(vw: number, vh: number) {
  const totalW = (colors.length - 1) * GAP + SIZE
  const startX = (vw - totalW) / 2
  const startY = (vh - SIZE) / 2
  return colors.map((_, i) => ({ x: startX + i * GAP, y: startY }))
}

/* ── Animated Source popup ── */
function SourcePopup({ onClose }: { onClose: () => void }) {
  const [fileName, setFileName] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.75, y: -10, filter: "blur(8px)" }}
      animate={{ opacity: 1, scale: 1,    y: 0,   filter: "blur(0px)" }}
      exit={{    opacity: 0, scale: 0.80, y: -6,   filter: "blur(6px)" }}
      transition={{ type: "spring", stiffness: 380, damping: 28 }}
      style={{
        position: "absolute",
        top: SIZE + 16,
        left: "50%",
        translateX: "-50%",
        zIndex: 999,
        width: 296,
        background: "linear-gradient(145deg,#ffffff,#faf5ff)",
        borderRadius: 20,
        boxShadow:
          "0 0 0 1.5px #e4caff, 0 20px 60px rgba(100,30,200,0.22), 0 4px 16px rgba(0,0,0,0.10)",
        padding: "20px 20px 18px",
        pointerEvents: "all",
        transformOrigin: "top center",
      }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {/* Glowing caret */}
      <div style={{
        position: "absolute", top: -8, left: "50%", transform: "translateX(-50%)",
        width: 18, height: 9, overflow: "hidden",
      }}>
        <motion.div
          animate={{ boxShadow: ["0 0 8px #c084fc", "0 0 20px #dd00ee", "0 0 8px #c084fc"] }}
          transition={{ duration: 2, repeat: Infinity }}
          style={{
            width: 18, height: 18,
            background: "linear-gradient(135deg,#fff,#faf5ff)",
            border: "1.5px solid #e4caff",
            transform: "rotate(45deg)",
            marginTop: 4,
          }}
        />
      </div>

      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16 }}>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <motion.div
            animate={{ rotate: [0,15,-15,0] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
          >
            <Sparkles size={16} color="#934acb" />
          </motion.div>
          <span style={{ fontWeight:800, fontSize:15, background:"linear-gradient(90deg,#48229a,#dd00ee)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>
            Source Input
          </span>
        </div>
        <motion.button
          whileHover={{ scale:1.15, rotate:90 }}
          whileTap={{ scale:0.9 }}
          transition={{ type:"spring", stiffness:400, damping:20 }}
          onClick={onClose}
          style={{ background:"none", border:"none", cursor:"pointer", color:"#bbb", padding:2 }}
        >
          <X size={16} />
        </motion.button>
      </div>

      {/* Divider */}
      <motion.div
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ delay: 0.1, duration: 0.4 }}
        style={{ height:1, background:"linear-gradient(90deg,transparent,#e4caff,transparent)", marginBottom:16, transformOrigin:"left" }}
      />

      {/* Repo URL */}
      <motion.div initial={{ opacity:0, x:-10 }} animate={{ opacity:1, x:0 }} transition={{ delay:0.12 }}>
        <label style={{ display:"block", fontSize:10, fontWeight:700, color:"#9061c2", marginBottom:6, textTransform:"uppercase", letterSpacing:"0.06em" }}>
          Repository URL
        </label>
        <motion.div
          whileHover={{ scale: 1.02, boxShadow:"0 0 0 3px #d8b4fe" }}
          style={{ display:"flex", alignItems:"center", gap:8,
            border:"1.5px solid #e4caff", borderRadius:12, padding:"8px 12px",
            background:"#fdf8ff", marginBottom:14, transition:"box-shadow 0.2s" }}
        >
          <LinkIcon size={13} color="#934acb" />
          <input
            placeholder="https://github.com/org/repo"
            style={{ border:"none", outline:"none", background:"transparent", fontSize:12, color:"#333", width:"100%" }}
          />
        </motion.div>
      </motion.div>

      {/* File upload */}
      <motion.div initial={{ opacity:0, x:-10 }} animate={{ opacity:1, x:0 }} transition={{ delay:0.18 }}>
        <label style={{ display:"block", fontSize:10, fontWeight:700, color:"#9061c2", marginBottom:6, textTransform:"uppercase", letterSpacing:"0.06em" }}>
          Upload File
        </label>
        <motion.div
          onClick={() => fileRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault(); setDragging(false)
            const f = e.dataTransfer.files?.[0]
            if (f) setFileName(f.name)
          }}
          animate={dragging ? { scale:1.03, borderColor:"#a855f7" } : { scale:1, borderColor: fileName ? "#a855f7" : "#d4b8f0" }}
          style={{
            border:"2px dashed #d4b8f0", borderRadius:14,
            padding:"18px 12px", textAlign:"center", cursor:"pointer",
            background: dragging ? "#f5eeff" : fileName ? "#f3eaff" : "#fdf8ff",
            transition:"background 0.2s",
          }}
        >
          {fileName ? (
            <motion.div
              initial={{ scale:0.8, opacity:0 }} animate={{ scale:1, opacity:1 }}
              style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}
            >
              <FileText size={18} color="#934acb" />
              <span style={{ fontSize:12, color:"#48229a", fontWeight:700 }}>{fileName}</span>
            </motion.div>
          ) : (
            <>
              <motion.div
                animate={{ y: [0,-4,0] }}
                transition={{ duration:1.6, repeat:Infinity, ease:"easeInOut" }}
              >
                <Upload size={24} color="#c084fc" style={{ margin:"0 auto 8px" }} />
              </motion.div>
              <p style={{ fontSize:12, color:"#a78bca", margin:0 }}>Click or drop file here</p>
              <p style={{ fontSize:10, color:"#c4abdf", margin:"4px 0 0" }}>.zip · .tar.gz · any format</p>
            </>
          )}
          <input ref={fileRef} type="file" style={{ display:"none" }} onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)} />
        </motion.div>
      </motion.div>

      {/* Submit */}
      <motion.button
        initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.24 }}
        whileHover={{ scale:1.03, boxShadow:"0 6px 24px rgba(147,74,203,0.45)" }}
        whileTap={{ scale:0.97 }}
        style={{
          marginTop:16, width:"100%", padding:"10px 0",
          background:"linear-gradient(90deg,#934acb,#dd00ee)",
          color:"#fff", border:"none", borderRadius:12,
          fontWeight:800, fontSize:13, cursor:"pointer",
          letterSpacing:"0.03em",
          boxShadow:"0 2px 12px rgba(147,74,203,0.35)",
        }}
      >
        Confirm Source
      </motion.button>
    </motion.div>
  )
}

function DragBox({ color, startX, startY, showPopup, containerRef, onMove, href, label }: {
  color: string; startX: number; startY: number
  showPopup?: boolean
  containerRef: React.RefObject<HTMLDivElement | null>
  onMove: (x: number, y: number) => void
  href?: string
  label?: string
}) {
  const router = useRouter()
  const x = useMotionValue(startX)
  const y = useMotionValue(startY)
  const [hovered, setHovered] = useState(false)
  const [popupOpen, setPopupOpen] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const unsubX = x.on("change", () => onMove(x.get(), y.get()))
    const unsubY = y.on("change", () => onMove(x.get(), y.get()))
    return () => { unsubX(); unsubY() }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const onEnter = () => {
    if (leaveTimer.current) clearTimeout(leaveTimer.current)
    setHovered(true)
    if (showPopup) setPopupOpen(true)
  }
  const onLeave = () => {
    setHovered(false)
    if (showPopup) leaveTimer.current = setTimeout(() => setPopupOpen(false), 400)
  }

  const handleClick = () => {
    if (!isDragging && href) {
      router.push(href)
    }
  }

  return (
    <motion.div
      drag
      dragMomentum={false}
      dragElastic={0}
      dragConstraints={containerRef}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      onDragStart={() => setIsDragging(true)}
      onDragEnd={() => setTimeout(() => setIsDragging(false), 100)}
      onClick={handleClick}
      whileDrag={{ scale: 1.15, boxShadow: `0 12px 40px ${color}88` }}
      style={{
        x, y,
        position: "absolute", top: 0, left: 0,
        width: SIZE, height: SIZE,
        backgroundColor: color,
        borderRadius: "50%",
        cursor: href ? "pointer" : "grab",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: hovered ? 20 : 1,
      }}
      animate={{
        scale: hovered ? 1.12 : 1,
        boxShadow: hovered
          ? `0 0 0 6px ${color}44, 0 8px 32px ${color}66`
          : `0 2px 8px ${color}33`,
      }}
      transition={{ type: "spring", stiffness: 360, damping: 22 }}
    >
      {label && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ 
            opacity: hovered && !isDragging ? 1 : 0, 
            y: hovered && !isDragging ? 0 : 10 
          }}
          transition={{ duration: 0.2 }}
          style={{
            position: "absolute",
            bottom: -40,
            left: "50%",
            transform: "translateX(-50%)",
            background: "rgba(255, 255, 255, 0.95)",
            padding: "6px 12px",
            borderRadius: "8px",
            fontSize: "13px",
            fontWeight: 600,
            color: color,
            whiteSpace: "nowrap",
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            pointerEvents: "none",
          }}
        >
          {label}
        </motion.div>
      )}
      <AnimatePresence>
        {showPopup && popupOpen && (
          <SourcePopup onClose={() => setPopupOpen(false)} />
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default function Page() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [initial] = useState<{ x: number; y: number }[]>(() =>
    typeof window !== "undefined" ? getInitial(window.innerWidth, window.innerHeight) : []
  )
  const [positions, setPositions] = useState<{ x: number; y: number }[]>(() =>
    typeof window !== "undefined" ? getInitial(window.innerWidth, window.innerHeight) : []
  )

  const updatePosition = (index: number, x: number, y: number) => {
    setPositions((prev) => {
      const updated = [...prev]
      updated[index] = { x, y }
      return updated
    })
  }

  if (!initial.length) return null

  return (
    <div
      ref={containerRef}
      style={{ position: "relative", width: "100vw", height: "100vh", overflow: "hidden", background: "#fdf8ff" }}
    >
      {/* Soft background blobs */}
      <div style={{ position:"absolute", inset:0, pointerEvents:"none", zIndex:0 }}>
        <div style={{ position:"absolute", top:"10%", left:"15%", width:400, height:400, borderRadius:"50%", background:"radial-gradient(circle,#f3e8ff88,transparent 70%)" }} />
        <div style={{ position:"absolute", bottom:"10%", right:"10%", width:350, height:350, borderRadius:"50%", background:"radial-gradient(circle,#fce7ff88,transparent 70%)" }} />
      </div>

      <svg style={{ position:"absolute", inset:0, width:"100%", height:"100%", pointerEvents:"none", zIndex:1 }}>
        <defs>
          <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%"   stopColor="#cfaad8" />
            <stop offset="50%"  stopColor="#934acb" />
            <stop offset="100%" stopColor="#dd00ee" />
          </linearGradient>
        </defs>
        {positions.map((pos, i) => {
          if (i === positions.length - 1) return null
          const next = positions[i + 1]
          return (
            <line
              key={i}
              x1={pos.x + SIZE / 2} y1={pos.y + SIZE / 2}
              x2={next.x + SIZE / 2} y2={next.y + SIZE / 2}
              stroke="url(#lineGrad)"
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeDasharray="6 4"
            />
          )
        })}
      </svg>

      {colors.map((color, i) => (
        <DragBox
          key={i}
          color={color}
          showPopup={i === 0}
          containerRef={containerRef}
          startX={initial[i].x}
          startY={initial[i].y}
          onMove={(x, y) => updatePosition(i, x, y)}
          href={nodeLinks[i]}
          label={nodeLabels[i]}
        />
      ))}
    </div>
  )
}