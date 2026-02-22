"use client"

import { useState, useEffect, useRef } from "react"
import { motion, useMotionValue, AnimatePresence } from "framer-motion"
import { Upload, X, FileText, Sparkles, Image as ImageIcon, CheckCircle2, Edit3 } from "lucide-react"
import { useRouter } from "next/navigation"

const colors = ["#cfaad8", "#934acb", "#48229a", "#dd00ee"]
const names  = ["Source", "AI Enhancement", "Visual Context", "Final Script"]
const SIZE   = 100
const GAP    = 150 // centre-to-centre spacing

/* Compute centred initial positions */
function getInitial(vw: number, vh: number) {
  const totalW = (colors.length - 1) * GAP + SIZE
  const startX = (vw - totalW) / 2
  const startY = (vh - SIZE) / 2
  return colors.map((_, i) => ({ x: startX + i * GAP, y: startY }))
}

/* ── Stage 1: Text Input Popup ── */
function TextInputPopup({ onClose, onSubmit }: { onClose: () => void; onSubmit: (text: string) => void }) {
  const [text, setText] = useState("")

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
        width: 400,
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
            Enter Your Script
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

      {/* Text area */}
      <motion.div initial={{ opacity:0, x:-10 }} animate={{ opacity:1, x:0 }} transition={{ delay:0.12 }}>
        <label style={{ display:"block", fontSize:10, fontWeight:700, color:"#9061c2", marginBottom:6, textTransform:"uppercase", letterSpacing:"0.06em" }}>
          Screenplay Text
        </label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
          placeholder="INT. COFFEE SHOP - DAY&#10;&#10;JOHN&#10;I never thought I'd see you again.&#10;&#10;MARY&#10;Neither did I..."
          style={{
            width: "100%",
            minHeight: 200,
            border:"1.5px solid #e4caff",
            borderRadius:12,
            padding:"12px",
            background:"#fdf8ff",
            fontSize:12,
            color:"#333",
            fontFamily: "monospace",
            resize: "vertical"
          }}
        />
      </motion.div>

      {/* Submit */}
      <motion.button
        initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.18 }}
        whileHover={{ scale:1.03, boxShadow:"0 6px 24px rgba(147,74,203,0.45)" }}
        whileTap={{ scale:0.97 }}
        onClick={() => {
          if (text.trim()) {
            onSubmit(text)
            onClose()
          }
        }}
        disabled={!text.trim()}
        style={{
          marginTop:16, width:"100%", padding:"10px 0",
          background: text.trim() ? "linear-gradient(90deg,#934acb,#dd00ee)" : "#ccc",
          color:"#fff", border:"none", borderRadius:12,
          fontWeight:800, fontSize:13, cursor: text.trim() ? "pointer" : "not-allowed",
          letterSpacing:"0.03em",
          boxShadow:"0 2px 12px rgba(147,74,203,0.35)",
        }}
      >
        Process Script
      </motion.button>
    </motion.div>
  )
}

/* ── Stage 3: Image Upload Popup ── */
function ImageUploadPopup({ onClose, onSubmit }: { onClose: () => void; onSubmit: (image: File) => void }) {
  const [image, setImage] = useState<File | null>(null)
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
        width: 350,
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
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <ImageIcon size={16} color="#934acb" />
          </motion.div>
          <span style={{ fontWeight:800, fontSize:15, background:"linear-gradient(90deg,#48229a,#dd00ee)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>
            Add Visual Context
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

      {/* Image upload */}
      <motion.div initial={{ opacity:0, x:-10 }} animate={{ opacity:1, x:0 }} transition={{ delay:0.12 }}>
        <label style={{ display:"block", fontSize:10, fontWeight:700, color:"#9061c2", marginBottom:6, textTransform:"uppercase", letterSpacing:"0.06em" }}>
          Upload Reference Image
        </label>
        <motion.div
          onClick={() => fileRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault(); setDragging(false)
            const f = e.dataTransfer.files?.[0]
            if (f && f.type.startsWith('image/')) setImage(f)
          }}
          animate={dragging ? { scale:1.03, borderColor:"#a855f7" } : { scale:1, borderColor: image ? "#a855f7" : "#d4b8f0" }}
          style={{
            border:"2px dashed #d4b8f0", borderRadius:14,
            padding:"24px 12px", textAlign:"center", cursor:"pointer",
            background: dragging ? "#f5eeff" : image ? "#f3eaff" : "#fdf8ff",
            transition:"background 0.2s",
          }}
        >
          {image ? (
            <motion.div
              initial={{ scale:0.8, opacity:0 }} animate={{ scale:1, opacity:1 }}
              style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:8 }}
            >
              <img src={URL.createObjectURL(image)} alt="preview" style={{ maxWidth: "100%", maxHeight: 120, borderRadius: 8 }} />
              <span style={{ fontSize:11, color:"#48229a", fontWeight:600 }}>{image.name}</span>
            </motion.div>
          ) : (
            <>
              <motion.div
                animate={{ y: [0,-4,0] }}
                transition={{ duration:1.6, repeat:Infinity, ease:"easeInOut" }}
              >
                <ImageIcon size={32} color="#c084fc" style={{ margin:"0 auto 8px" }} />
              </motion.div>
              <p style={{ fontSize:12, color:"#a78bca", margin:0 }}>Click or drop image here</p>
              <p style={{ fontSize:10, color:"#c4abdf", margin:"4px 0 0" }}>JPG, PNG, WebP</p>
            </>
          )}
          <input ref={fileRef} type="file" accept="image/*" style={{ display:"none" }} onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) setImage(f)
          }} />
        </motion.div>
      </motion.div>

      {/* Submit */}
      <motion.button
        initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.18 }}
        whileHover={{ scale:1.03, boxShadow:"0 6px 24px rgba(147,74,203,0.45)" }}
        whileTap={{ scale:0.97 }}
        onClick={() => {
          if (image) {
            onSubmit(image)
            onClose()
          }
        }}
        disabled={!image}
        style={{
          marginTop:16, width:"100%", padding:"10px 0",
          background: image ? "linear-gradient(90deg,#934acb,#dd00ee)" : "#ccc",
          color:"#fff", border:"none", borderRadius:12,
          fontWeight:800, fontSize:13, cursor: image ? "pointer" : "not-allowed",
          letterSpacing:"0.03em",
          boxShadow:"0 2px 12px rgba(147,74,203,0.35)",
        }}
      >
        Add to Context
      </motion.button>
    </motion.div>
  )
}

function DragBox({ color, startX, startY, name, stage, unlocked, containerRef, onMove, onInteract, onSubmitText, onSubmitImage }: {
  color: string; startX: number; startY: number; name: string; stage: number; unlocked: boolean
  containerRef: React.RefObject<HTMLDivElement | null>
  onMove: (x: number, y: number) => void
  onInteract: () => void
  onSubmitText?: (text: string) => void
  onSubmitImage?: (image: File) => void
}) {
  const x = useMotionValue(startX)
  const y = useMotionValue(startY)
  const [hovered, setHovered] = useState(false)
  const [popupOpen, setPopupOpen] = useState(false)
  const leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const unsubX = x.on("change", () => onMove(x.get(), y.get()))
    const unsubY = y.on("change", () => onMove(x.get(), y.get()))
    return () => { unsubX(); unsubY() }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const onEnter = () => {
    if (!unlocked) return
    if (leaveTimer.current) clearTimeout(leaveTimer.current)
    setHovered(true)
  }
  
  const onLeave = () => {
    setHovered(false)
  }

  const handleClick = () => {
    if (unlocked) {
      if (stage === 1 || stage === 3) {
        // For input stages, toggle popup
        setPopupOpen(!popupOpen)
      } else {
        // For output stages, go to notebook
        onInteract()
      }
    }
  }

  return (
    <motion.div
      drag={unlocked}
      dragMomentum={false}
      dragElastic={0}
      dragConstraints={containerRef}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      onClick={handleClick}
      whileDrag={{ scale: 1.15, boxShadow: `0 12px 40px ${color}88` }}
      style={{
        x, y,
        position: "absolute", top: 0, left: 0,
        width: SIZE, height: SIZE,
        backgroundColor: unlocked ? color : "#ddd",
        borderRadius: "50%",
        cursor: unlocked ? "grab" : "not-allowed",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: hovered ? 20 : 1,
        opacity: unlocked ? 1 : 0.5,
      }}
      animate={{
        scale: hovered ? 1.12 : 1,
        boxShadow: hovered && unlocked
          ? `0 0 0 6px ${color}44, 0 8px 32px ${color}66`
          : `0 2px 8px ${color}33`,
      }}
      transition={{ type: "spring", stiffness: 360, damping: 22 }}
    >
      <span style={{
        color: "#fff", fontWeight: 700, fontSize: 13, letterSpacing: "0.03em",
        textShadow: "0 1px 4px rgba(0,0,0,0.35)",
        pointerEvents: "none", userSelect: "none",
      }}>
        {name}
      </span>

      <AnimatePresence>
        {popupOpen && unlocked && stage === 1 && onSubmitText && (
          <TextInputPopup 
            onClose={() => setPopupOpen(false)} 
            onSubmit={(text) => {
              onSubmitText(text)
              setPopupOpen(false)
            }} 
          />
        )}
        {popupOpen && unlocked && stage === 3 && onSubmitImage && (
          <ImageUploadPopup 
            onClose={() => setPopupOpen(false)} 
            onSubmit={(image) => {
              onSubmitImage(image)
              setPopupOpen(false)
            }} 
          />
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default function Page() {
  const router = useRouter()
  const containerRef = useRef<HTMLDivElement>(null)
  const [unlockedStage, setUnlockedStage] = useState(1) // Only stage 1 is unlocked initially
  const [processing, setProcessing] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  
  const [initial] = useState<{ x: number; y: number }[]>(() =>
    typeof window !== "undefined" ? getInitial(window.innerWidth, window.innerHeight) : []
  )
  const [positions, setPositions] = useState<{ x: number; y: number }[]>(() =>
    typeof window !== "undefined" ? getInitial(window.innerWidth, window.innerHeight) : []
  )

  // Load unlocked stage from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('unlockedStage')
    if (saved) {
      setUnlockedStage(parseInt(saved))
    }
  }, [])

  const updatePosition = (index: number, x: number, y: number) => {
    setPositions((prev) => {
      const updated = [...prev]
      updated[index] = { x, y }
      return updated
    })
  }

  const handleStage1Submit = async (text: string) => {
    setProcessing(true)
    try {
      const formData = new FormData()
      formData.append('raw_text', text)
      formData.append('session_id', sessionId || crypto.randomUUID())

      const response = await fetch('http://localhost:8080/api/v1/process-text', {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        const result = await response.json()
        setSessionId(result.session_id)
        
        // Store data in localStorage for notebook to access
        localStorage.setItem('currentStage', '2')
        localStorage.setItem('stage1Data', JSON.stringify(result.data))
        localStorage.setItem('sessionId', result.session_id)
        
        // Unlock stage 2 and go to notebook
        setUnlockedStage(2)
        router.push('/notebook?stage=2')
      } else {
        alert('Error processing screenplay. Please try again.')
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Failed to connect to backend. Make sure it\'s running on port 8080.')
    } finally {
      setProcessing(false)
    }
  }

  const handleStage3Submit = async (image: File) => {
    setProcessing(true)
    try {
      const formData = new FormData()
      formData.append('image', image)
      formData.append('session_id', sessionId || '')

      // TODO: Create vision endpoint
      // const response = await fetch('http://localhost:8080/api/v1/vision/analyze', {
      //   method: 'POST',
      //   body: formData
      // })

      // For now, simulate success
      localStorage.setItem('currentStage', '3')
      localStorage.setItem('stage3Image', URL.createObjectURL(image))
      setUnlockedStage(4)
      router.push('/notebook?stage=3')
    } catch (error) {
      console.error('Error:', error)
      alert('Failed to process image.')
    } finally {
      setProcessing(false)
    }
  }

  const handleStageInteraction = (stage: number) => {
    const stageParam = stage.toString()
    router.push(`/notebook?stage=${stageParam}`)
  }

  const unlockNextStage = () => {
    if (unlockedStage < 4) {
      setUnlockedStage(prev => prev + 1)
    }
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

      {/* Lines connecting nodes */}
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
          const isUnlocked = i < unlockedStage
          return (
            <line
              key={i}
              x1={pos.x + SIZE / 2} y1={pos.y + SIZE / 2}
              x2={next.x + SIZE / 2} y2={next.y + SIZE / 2}
              stroke={isUnlocked ? "url(#lineGrad)" : "#ddd"}
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeDasharray="6 4"
              opacity={isUnlocked ? 1 : 0.3}
            />
          )
        })}
      </svg>

      {/* Nodes */}
      {colors.map((color, i) => (
        <DragBox
          key={i}
          color={color}
          name={names[i]}
          stage={i + 1}
          unlocked={i < unlockedStage}
          containerRef={containerRef}
          startX={initial[i].x}
          startY={initial[i].y}
          onMove={(x, y) => updatePosition(i, x, y)}
          onInteract={() => handleStageInteraction(i + 1)}
          onSubmitText={i === 0 ? handleStage1Submit : undefined}
          onSubmitImage={i === 2 ? handleStage3Submit : undefined}
        />
      ))}

      {/* Debug / Reset button */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        whileHover={{ scale: 1.05 }}
        onClick={unlockNextStage}
        style={{
          position: "absolute",
          bottom: 20,
          right: 20,
          padding: "8px 16px",
          background: "linear-gradient(90deg,#934acb,#dd00ee)",
          color: "#fff",
          border: "none",
          borderRadius: 8,
          fontSize: 12,
          fontWeight: 600,
          cursor: "pointer",
          zIndex: 100
        }}
      >
        Unlock Next Stage
      </motion.button>
    </div>
  )
}