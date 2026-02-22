"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion, useMotionValue } from "framer-motion"

const colors = [
  "#cfaad8", "#934acb", "#48229a", "#dd00ee", "#b794f4",
  "#9f7aea", "#805ad5", "#6b46c1", "#a855f7", "#c084fc"
]

const nodeLabels = [
  "Preview", "Preview", "Preview", "Preview", "Preview",
  "Preview", "Preview", "Preview", "Preview", "Preview"
]

const SIZE = 100
const GAP = 160

function getInitial(vw: number, vh: number) {
  // Linear snake path: alternates direction each row
  const cols = 5
  const totalW = (cols - 1) * GAP + SIZE
  const startX = (vw - totalW) / 2
  const startY = vh / 2 - GAP / 2
  
  return colors.map((_, i) => {
    const row = Math.floor(i / cols)
    const colInRow = i % cols
    // Alternate direction: even rows go right, odd rows go left
    const col = row % 2 === 0 ? colInRow : (cols - 1 - colInRow)
    return {
      x: startX + col * GAP,
      y: startY + row * GAP,
    }
  })
}

function NotebookPreview({ label, color, visible }: { label: string, color: string, visible: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, x: "-50%" }}
      animate={{ 
        opacity: visible ? 1 : 0, 
        scale: visible ? 1 : 0.9,
        x: "-50%"
      }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      style={{
        position: "absolute",
        top: SIZE + 60,
        left: "50%",
        width: 280,
        background: "rgba(255, 255, 255, 0.98)",
        borderRadius: 16,
        boxShadow: `0 8px 32px rgba(0,0,0,0.15), 0 0 0 1px ${color}33`,
        overflow: "hidden",
        pointerEvents: "none",
        zIndex: 100,
      }}
    >
      {/* Header */}
      <div style={{
        padding: "12px 16px",
        background: `linear-gradient(135deg, ${color}22, ${color}11)`,
        borderBottom: `2px solid ${color}33`,
      }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#333" }}>
          📓 {label}
        </div>
      </div>

      {/* Preview Section Placeholder */}
      <div style={{ 
        padding: 24, 
        textAlign: "center",
        color: "#6b7280",
        fontSize: 13,
      }}>
        <div style={{ 
          padding: 32,
          background: "#f9fafb",
          borderRadius: 12,
          border: `2px dashed ${color}44`,
        }}>
          Preview Will Be Available
        </div>
      </div>
    </motion.div>
  )
}

function DragBox({
  color, startX, startY, containerRef, nodeIndex, unlockedCount, onUnlock, onMove,
}: {
  color: string
  startX: number
  startY: number
  containerRef: React.RefObject<HTMLDivElement | null>
  nodeIndex: number
  unlockedCount: number
  onUnlock: () => void
  onMove: (x: number, y: number) => void
}) {
  const router = useRouter()
  const x = useMotionValue(startX)
  const y = useMotionValue(startY)
  const [isDragging, setIsDragging] = useState(false)
  const [hovered, setHovered] = useState(false)
  const isLatest = nodeIndex === unlockedCount - 1

  // ✅ Properly wire onMove using useEffect
  useEffect(() => {
    const unsubX = x.on("change", () => onMove(x.get(), y.get()))
    const unsubY = y.on("change", () => onMove(x.get(), y.get()))
    return () => { unsubX(); unsubY() }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleClick = () => {
    if (isDragging) return
    if (isLatest) {
      onUnlock()
    } else {
      router.push("/notebook")
    }
  }

  return (
    <motion.div
      drag
      dragMomentum={false}
      dragElastic={0}
      dragConstraints={containerRef}
      onDragStart={() => setIsDragging(true)}
      onDragEnd={() => setTimeout(() => setIsDragging(false), 100)}
      onClick={handleClick}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      initial={{ scale: 0, opacity: 0 }}
      animate={{
        scale: hovered ? 1.15 : 1,
        opacity: 1,
        boxShadow: isLatest
          ? [
              `0 0 0 0px ${color}55, 0 4px 20px ${color}66`,
              `0 0 0 16px ${color}22, 0 4px 32px ${color}88`,
              `0 0 0 0px ${color}55, 0 4px 20px ${color}66`,
            ]
          : hovered
          ? `0 0 0 8px ${color}33, 0 4px 20px ${color}55`
          : `0 2px 10px ${color}44`,
      }}
      transition={{
        scale: { type: "spring", stiffness: 300, damping: 20 },
        opacity: { duration: 0.4 },
        boxShadow: isLatest
          ? { duration: 1.8, repeat: Infinity, ease: "easeInOut" }
          : { duration: 0.25 },
      }}
      whileDrag={{ scale: 1.2, boxShadow: `0 12px 40px ${color}88` }}
      style={{
        x, y,
        position: "absolute",
        top: 0,
        left: 0,
        width: SIZE,
        height: SIZE,
        borderRadius: "50%",
        backgroundColor: color,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#fff",
        fontWeight: 800,
        fontSize: 18,
        cursor: isLatest ? "pointer" : "grab",
        zIndex: hovered ? 10 : 1,
        userSelect: "none",
      }}
    >
      {nodeIndex + 1}

      {/* Tooltip */}
      <motion.div
        animate={{ opacity: hovered ? 1 : 0, y: hovered ? 0 : 8 }}
        transition={{ duration: 0.2 }}
        style={{
          position: "absolute",
          bottom: -38,
          left: "50%",
          transform: "translateX(-50%)",
          background: "rgba(255,255,255,0.96)",
          padding: "4px 12px",
          borderRadius: 8,
          fontSize: 12,
          fontWeight: 700,
          color,
          whiteSpace: "nowrap",
          boxShadow: "0 2px 10px rgba(0,0,0,0.12)",
          pointerEvents: "none",
        }}
      >
        {isLatest ? `${nodeLabels[nodeIndex]} ✦ Click to unlock` : nodeLabels[nodeIndex]}
      </motion.div>

      {/* Notebook Preview */}
      <NotebookPreview 
        label={nodeLabels[nodeIndex]} 
        color={color} 
        visible={hovered && !isDragging} 
      />
    </motion.div>
  )
}

// ✅ Separate SVG line component that re-renders on position change
function Lines({ positions, unlockedCount }: { positions: { x: number; y: number }[], unlockedCount: number }) {
  return (
    <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 0 }}>
      <defs>
        <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%"   stopColor="#cfaad8" />
          <stop offset="50%"  stopColor="#934acb" />
          <stop offset="100%" stopColor="#dd00ee" />
        </linearGradient>
      </defs>

      {positions.map((pos, i) => {
        if (i >= unlockedCount - 1) return null
        const next = positions[i + 1]
        if (!next) return null
        return (
          <motion.line
            key={i}
            x1={pos.x + SIZE / 2}
            y1={pos.y + SIZE / 2}
            x2={next.x + SIZE / 2}
            y2={next.y + SIZE / 2}
            stroke="url(#lineGrad)"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeDasharray="8 5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          />
        )
      })}
    </svg>
  )
}

export default function Page() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [unlockedCount, setUnlockedCount] = useState(1)

  const [initial] = useState<{ x: number; y: number }[]>(() =>
    typeof window !== "undefined" ? getInitial(window.innerWidth, window.innerHeight) : []
  )

  // ✅ positions tracks live drag positions for line updates
  const [positions, setPositions] = useState<{ x: number; y: number }[]>(() =>
    typeof window !== "undefined" ? getInitial(window.innerWidth, window.innerHeight) : []
  )

  // Load unlocked progress from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("unlockedNodes")
    if (saved) {
      setUnlockedCount(parseInt(saved))
    }
  }, [])

  const updatePosition = (index: number, x: number, y: number) => {
    setPositions(prev => {
      const updated = [...prev]
      updated[index] = { x, y }
      return updated
    })
  }

  const unlockNext = () => {
    setUnlockedCount(prev => {
      const newCount = prev < colors.length ? prev + 1 : prev
      localStorage.setItem("unlockedNodes", newCount.toString())
      return newCount
    })
  }

  const resetProgress = () => {
    setUnlockedCount(1)
    localStorage.setItem("unlockedNodes", "1")
  }

  if (!initial.length) return null

  return (
    <div
      ref={containerRef}
      style={{
        position: "relative",
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
        background: "#fdf8ff",
      }}
    >

      {/* Background blobs */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0 }}>
        <div style={{ position: "absolute", top: "10%", left: "15%", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle,#f3e8ff88,transparent 70%)" }} />
        <div style={{ position: "absolute", bottom: "10%", right: "10%", width: 350, height: 350, borderRadius: "50%", background: "radial-gradient(circle,#fce7ff88,transparent 70%)" }} />
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 500, height: 300, borderRadius: "50%", background: "radial-gradient(circle,#ede9ff55,transparent 70%)" }} />
      </div>

      {/* ✅ Lines use live positions so they follow dragged nodes */}
      <Lines positions={positions} unlockedCount={unlockedCount} />

      {/* Nodes */}
      {colors.map((color, i) => {
        if (i >= unlockedCount) return null
        return (
          <DragBox
            key={i}
            color={color}
            startX={initial[i].x}
            startY={initial[i].y}
            containerRef={containerRef}
            nodeIndex={i}
            unlockedCount={unlockedCount}
            onUnlock={unlockNext}
            onMove={(x, y) => updatePosition(i, x, y)}
          />
        )
      })}
    </div>
  )
}