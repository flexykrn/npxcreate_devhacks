"use client"

import { useState, useEffect } from "react"
import { motion, useMotionValue } from "framer-motion"

const colors = ["#cfaad8", "#934acb", "#48229a", "#dd00ee"]
const initial = [
  { x: 100, y: 150 },
  { x: 250, y: 150 },
  { x: 400, y: 150 },
  { x: 550, y: 150 },
]
const SIZE = 50

function DragBox({ color, startX, startY, onMove }: {
  color: string
  startX: number
  startY: number
  onMove: (x: number, y: number) => void
}) {
  const x = useMotionValue(startX)
  const y = useMotionValue(startY)

  useEffect(() => {
    const unsubX = x.on("change", () => onMove(x.get(), y.get()))
    const unsubY = y.on("change", () => onMove(x.get(), y.get()))
    return () => { unsubX(); unsubY() }
  }, [])

  return (
    <motion.div
      drag
      style={{
        x, y,
        position: "absolute",
        top: 0,
        left: 0,
        width: SIZE,
        height: SIZE,
        backgroundColor: color,
        borderRadius: 10,
        cursor: "grab",
      }}
    />
  )
}

export default function Page() {
  const [positions, setPositions] = useState(initial)

  const updatePosition = (index: number, x: number, y: number) => {
    setPositions((prev) => {
      const updated = [...prev]
      updated[index] = { x, y }
      return updated
    })
  }

  return (
    <div style={{ position: "relative", width: "100vw", height: "100vh" }}>

      {/* Lines: perfectly center-to-center */}
      <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}>
        {positions.map((pos, i) => {
          if (i === positions.length - 1) return null
          const next = positions[i + 1]
          return (
            <line
              key={i}
              x1={pos.x + SIZE / 2}
              y1={pos.y + SIZE / 2}
              x2={next.x + SIZE / 2}
              y2={next.y + SIZE / 2}
              stroke="#934acb"
              strokeWidth={2}
              strokeLinecap="round"
            />
          )
        })}
      </svg>

      {/* Boxes */}
      {colors.map((color, i) => (
        <DragBox
          key={i}
          color={color}
          startX={initial[i].x}
          startY={initial[i].y}
          onMove={(x, y) => updatePosition(i, x, y)}
        />
      ))}
    </div>
  )
}
