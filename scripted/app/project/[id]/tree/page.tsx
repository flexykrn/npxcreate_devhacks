"use client"

import { motion } from "framer-motion"

const NODE_SIZE = 64
const BRANCH_SIZE = 56

// SVG path helper
function AnimatedPath({ d, color, delay }: { d: string; color: string; delay: number }) {
  return (
    <motion.path
      d={d}
      stroke={color}
      strokeWidth={3}
      fill="none"
      strokeLinecap="round"
      initial={{ pathLength: 0, opacity: 0 }}
      animate={{ pathLength: 1, opacity: 1 }}
      transition={{ delay, duration: 0.6, ease: "easeInOut" }}
    />
  )
}

function GlowCircle({
  x, y, size = NODE_SIZE, gradient, shadow, delay,
  label,
}: {
  x: number; y: number; size?: number
  gradient: [string, string]
  shadow: string
  delay: number
  label?: string
}) {
  return (
    <motion.g
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay, type: "spring", stiffness: 260, damping: 18 }}
      style={{ transformOrigin: `${x}px ${y}px` }}
    >
      {/* Glow */}
      <motion.circle
        cx={x} cy={y} r={size / 2 + 10}
        fill={shadow}
        animate={{ opacity: [0.4, 0.8, 0.4], r: [size / 2 + 8, size / 2 + 16, size / 2 + 8] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: delay + 0.5 }}
      />
      {/* Main circle */}
      <circle cx={x} cy={y} r={size / 2} fill={`url(#grad-${x}-${y})`} />
      {/* Shine */}
      <circle cx={x - size * 0.12} cy={y - size * 0.15} r={size * 0.12} fill="rgba(255,255,255,0.25)" />
      {/* Label */}
      {label && (
        <motion.text
          x={x} y={y + size / 2 + 20}
          textAnchor="middle"
          fill="rgba(255,255,255,0.7)"
          fontSize={12}
          fontFamily="monospace"
          fontWeight={600}
          initial={{ opacity: 0, y: y + size / 2 + 28 }}
          animate={{ opacity: 1, y: y + size / 2 + 20 }}
          transition={{ delay: delay + 0.3, duration: 0.4 }}
        >
          {label}
        </motion.text>
      )}
      <defs>
        <radialGradient id={`grad-${x}-${y}`} cx="35%" cy="35%" r="65%">
          <stop offset="0%" stopColor={gradient[0]} />
          <stop offset="100%" stopColor={gradient[1]} />
        </radialGradient>
      </defs>
    </motion.g>
  )
}

export default function GitPipeline() {
  // Layout
  const cx = 300          // center x
  const top = 80          // node 1 y
  const mid = 220         // node 2 y
  const bot = 380         // node 3 (merge) y
  const lx = 160          // left branch x
  const rx = 440          // right branch x
  const bry = 310         // branch circles y

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900">
      <svg width={600} height={480} viewBox="0 0 600 480">
        <defs>
          <linearGradient id="line1" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#a855f7" />
            <stop offset="100%" stopColor="#22d3ee" />
          </linearGradient>
          <linearGradient id="lineL" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#22d3ee" />
            <stop offset="100%" stopColor="#ec4899" />
          </linearGradient>
          <linearGradient id="lineR" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#22d3ee" />
            <stop offset="100%" stopColor="#10b981" />
          </linearGradient>
          <linearGradient id="lineMergeL" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ec4899" />
            <stop offset="100%" stopColor="#a855f7" />
          </linearGradient>
          <linearGradient id="lineMergeR" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#a855f7" />
          </linearGradient>
        </defs>

        {/* ── Line 1: Node1 → Node2 (vertical) ── */}
        <AnimatedPath
          d={`M ${cx} ${top + 32} L ${cx} ${mid - 32}`}
          color="url(#line1)"
          delay={0.5}
        />

        {/* ── Line 2: Node2 → Left branch (curve) ── */}
        <AnimatedPath
          d={`M ${cx} ${mid + 32} Q ${cx} ${bry - 20} ${lx} ${bry - 28}`}
          color="url(#lineL)"
          delay={1.2}
        />

        {/* ── Line 3: Node2 → Right branch (curve) ── */}
        <AnimatedPath
          d={`M ${cx} ${mid + 32} Q ${cx} ${bry - 20} ${rx} ${bry - 28}`}
          color="url(#lineR)"
          delay={1.2}
        />

        {/* ── Line 4: Left branch → Node3 (merge) ── */}
        <AnimatedPath
          d={`M ${lx} ${bry + 28} Q ${lx} ${bot + 10} ${cx - 32} ${bot}`}
          color="url(#lineMergeL)"
          delay={2.4}
        />

        {/* ── Line 5: Right branch → Node3 (merge) ── */}
        <AnimatedPath
          d={`M ${rx} ${bry + 28} Q ${rx} ${bot + 10} ${cx + 32} ${bot}`}
          color="url(#lineMergeR)"
          delay={2.4}
        />

        {/* ── Node 1 (main/origin) ── */}
        <GlowCircle
          x={cx} y={top}
          gradient={["#c084fc", "#7c3aed"]}
          shadow="rgba(147,51,234,0.4)"
          delay={0}
          label="main"
        />

        {/* ── Node 2 (branch point) ── */}
        <GlowCircle
          x={cx} y={mid}
          gradient={["#67e8f9", "#0891b2"]}
          shadow="rgba(6,182,212,0.4)"
          delay={0.9}
          label="HEAD"
        />

        {/* ── Left Branch ── */}
        <GlowCircle
          x={lx} y={bry}
          size={BRANCH_SIZE}
          gradient={["#f472b6", "#be185d"]}
          shadow="rgba(236,72,153,0.4)"
          delay={1.8}
          label="feat/ui"
        />

        {/* ── Right Branch ── */}
        <GlowCircle
          x={rx} y={bry}
          size={BRANCH_SIZE}
          gradient={["#34d399", "#059669"]}
          shadow="rgba(16,185,129,0.4)"
          delay={1.8}
          label="feat/api"
        />

        {/* ── Node 3 (merge commit) ── */}
        <GlowCircle
          x={cx} y={bot}
          gradient={["#a78bfa", "#6d28d9"]}
          shadow="rgba(109,40,217,0.5)"
          delay={3.0}
          label="merge"
        />

        {/* ── Animated dot travelling down line 1 ── */}
        <motion.circle
          r={5} fill="#e879f9"
          initial={{ offsetDistance: "0%" }}
          animate={{ offsetDistance: "100%" }}
          transition={{ delay: 0.5, duration: 0.5, ease: "easeInOut" }}
          style={{
            offsetPath: `path("M ${cx} ${top + 32} L ${cx} ${mid - 32}")`,
          } as React.CSSProperties}
        />
      </svg>
    </div>
  )
}