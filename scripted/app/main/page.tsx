"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion, useMotionValue } from "framer-motion"
import { useApp } from "@/lib/AppContext"
import { updateAllNodes, type NodeData } from "@/lib/localDb"
import { ZoomIn, ZoomOut, Maximize2, Home } from "lucide-react"

const colors = [
  "#cfaad8", "#934acb", "#48229a", "#dd00ee", "#b794f4",
  "#9f7aea", "#805ad5", "#6b46c1", "#a855f7", "#c084fc"
]

const getNodeLabel = (index: number) => `Node ${index + 1}`

const SIZE = 100
const GAP = 160

function calculateNodePosition(
  parentNode: NodeData | null,
  siblings: NodeData[],
  vw: number,
  vh: number
): { x: number; y: number } {
  if (!parentNode) {
    return {
      x: vw / 2 - SIZE / 2,
      y: vh / 2 - SIZE / 2,
    }
  }

  const siblingCount = siblings.length
  const verticalOffset = GAP * 1.5
  const horizontalSpacing = GAP * 1.2
  const totalWidth = (siblingCount - 1) * horizontalSpacing
  const startX = parentNode.x - totalWidth / 2
  
  return {
    x: startX + siblings.length * horizontalSpacing,
    y: parentNode.y + verticalOffset,
  }
}

function NotebookPreview({ 
  label, 
  color, 
  visible, 
}: { 
  label: string
  color: string
  visible: boolean
}) {
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

      {/* Preview Section */}
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
          Preview Available
        </div>
      </div>
    </motion.div>
  )
}

function DragBox({
  node,
  color,
  containerRef,
  onMove,
  onAddNode,
  onRemoveNode,
  onStartLink,
  onLink,
  onNavigateToNotebook,
  isLinking,
  linkingNodeId,
  canBeLinkedTo,
}: {
  node: NodeData
  color: string
  containerRef: React.RefObject<HTMLDivElement | null>
  onMove: (x: number, y: number) => void
  onAddNode: () => void
  onRemoveNode: () => void
  onStartLink: () => void
  onLink: () => void
  onNavigateToNotebook: (nodeId: string) => void
  isLinking: boolean
  linkingNodeId: string | null
  canBeLinkedTo: boolean
}) {
  const x = useMotionValue(node.x)
  const y = useMotionValue(node.y)
  const [isDragging, setIsDragging] = useState(false)
  const [hovered, setHovered] = useState(false)

  useEffect(() => {
    const unsubX = x.on("change", () => onMove(x.get(), y.get()))
    const unsubY = y.on("change", () => onMove(x.get(), y.get()))
    return () => { unsubX(); unsubY() }
  }, [x, y, onMove])

  const handleClick = () => {
    if (isDragging) return
    if (isLinking) {
      if (canBeLinkedTo) {
        onLink()
      }
      return
    }
    onNavigateToNotebook(node.id)
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
        boxShadow: isLinking && linkingNodeId === node.id
          ? `0 0 0 12px #3b82f6, 0 4px 20px #3b82f6`
          : isLinking && canBeLinkedTo
          ? `0 0 0 8px #10b981, 0 4px 20px #10b981`
          : isLinking && !canBeLinkedTo
          ? `0 0 0 8px #ef4444, 0 4px 20px #ef4444`
          : hovered
          ? `0 0 0 8px ${color}33, 0 4px 20px ${color}55`
          : `0 2px 10px ${color}44`,
      }}
      transition={{
        scale: { type: "spring", stiffness: 300, damping: 20 },
        opacity: { duration: 0.4 },
        boxShadow: { duration: 0.25 },
      }}
      whileDrag={{ scale: 1.2, boxShadow: `0 12px 40px ${color}88` }}
      style={{
        x,
        y,
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
        cursor: isLinking && canBeLinkedTo ? "pointer" : isLinking ? "not-allowed" : "pointer",
        zIndex: hovered ? 10 : 1,
        userSelect: "none",
      }}
    >
      <div style={{ 
        textAlign: "center",
        padding: "0 8px",
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
        width: "100%",
        fontSize: node.title && node.title.length > 8 ? 11 : 18,
      }}>
        {node.title && node.title.length > 0 
          ? node.title.length > 12 
            ? node.title.substring(0, 10) + "..." 
            : node.title
          : node.index + 1
        }
      </div>

      {/* Action Buttons Around Circle */}
      {hovered && !isDragging && !isLinking && (
        <>
          {/* Add Button (Top Right) */}
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 15 }}
            onClick={(e) => {
              e.stopPropagation()
              onAddNode()
            }}
            style={{
              position: "absolute",
              top: -15,
              right: -15,
              width: 36,
              height: 36,
              borderRadius: "50%",
              background: "#10b981",
              border: "3px solid #fff",
              color: "#fff",
              fontSize: 18,
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
              zIndex: 20,
            }}
            title="Add Node"
          >
            +
          </motion.button>

          {/* Remove Button (Top Left) */}
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 15, delay: 0.05 }}
            onClick={(e) => {
              e.stopPropagation()
              onRemoveNode()
            }}
            style={{
              position: "absolute",
              top: -15,
              left: -15,
              width: 36,
              height: 36,
              borderRadius: "50%",
              background: "#ef4444",
              border: "3px solid #fff",
              color: "#fff",
              fontSize: 20,
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
              zIndex: 20,
            }}
            title="Remove Node"
          >
            ×
          </motion.button>

          {/* Link Button (Bottom) */}
          {node.parentId !== null && (
            <motion.button
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 15, delay: 0.1 }}
              onClick={(e) => {
                e.stopPropagation()
                onStartLink()
              }}
              style={{
                position: "absolute",
                bottom: -15,
                left: "50%",
                transform: "translateX(-50%)",
                width: 36,
                height: 36,
                borderRadius: "50%",
                background: "#3b82f6",
                border: "3px solid #fff",
                color: "#fff",
                fontSize: 16,
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                zIndex: 20,
              }}
              title="Relink to Another Node"
            >
              🔗
            </motion.button>
          )}
        </>
      )}

      {/* Tooltip */}
      <motion.div
        animate={{ opacity: hovered || isLinking ? 1 : 0, y: hovered || isLinking ? 0 : 8 }}
        transition={{ duration: 0.2 }}
        style={{
          position: "absolute",
          bottom: -38,
          left: "50%",
          transform: "translateX(-50%)",
          background: isLinking && linkingNodeId === node.id
            ? "rgba(59, 130, 246, 0.96)"
            : isLinking && canBeLinkedTo
            ? "rgba(16, 185, 129, 0.96)"
            : isLinking && !canBeLinkedTo
            ? "rgba(239, 68, 68, 0.96)"
            : "rgba(255,255,255,0.96)",
          padding: "4px 12px",
          borderRadius: 8,
          fontSize: 12,
          fontWeight: 700,
          color: isLinking ? "#fff" : color,
          whiteSpace: "nowrap",
          boxShadow: "0 2px 10px rgba(0,0,0,0.12)",
          pointerEvents: "none",
        }}
      >
        {isLinking && linkingNodeId === node.id
          ? "🔗 Source node"
          : isLinking && canBeLinkedTo
          ? "✓ Click to link here"
          : isLinking && !canBeLinkedTo
          ? "✗ Cannot link here"
          : getNodeLabel(node.index)}
      </motion.div>

      {/* Notebook Preview */}
      <NotebookPreview
        label={node.title || getNodeLabel(node.index)}
        color={color}
        visible={hovered && !isDragging && !isLinking}
      />
    </motion.div>
  )
}

function Lines({ nodes }: { nodes: NodeData[] }) {
  return (
    <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 0 }}>
      <defs>
        <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#cfaad8" />
          <stop offset="50%" stopColor="#934acb" />
          <stop offset="100%" stopColor="#dd00ee" />
        </linearGradient>
      </defs>

      {nodes.map((node) => {
        if (!node.parentId) return null
        const parent = nodes.find(n => n.id === node.parentId)
        if (!parent) return null
        
        return (
          <motion.line
            key={`${parent.id}-${node.id}`}
            x1={parent.x + SIZE / 2}
            y1={parent.y + SIZE / 2}
            x2={node.x + SIZE / 2}
            y2={node.y + SIZE / 2}
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

function RecycleBin({ 
  recycleBin, 
  onRestore 
}: { 
  recycleBin: NodeData[]
  onRestore: (node: NodeData) => void 
}) {
  const [isOpen, setIsOpen] = useState(false)

  if (recycleBin.length === 0) return null

  return (
    <div style={{
      position: "fixed",
      bottom: 20,
      right: 20,
      zIndex: 200,
    }}>
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: 60,
          height: 60,
          borderRadius: "50%",
          background: "#374151",
          color: "#fff",
          border: "none",
          fontSize: 24,
          cursor: "pointer",
          boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
        }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        🗑️
        <div style={{
          position: "absolute",
          top: -5,
          right: -5,
          width: 20,
          height: 20,
          borderRadius: "50%",
          background: "#ef4444",
          fontSize: 12,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}>
          {recycleBin.length}
        </div>
      </motion.button>

      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            position: "absolute",
            bottom: 70,
            right: 0,
            width: 250,
            maxHeight: 300,
            background: "#fff",
            borderRadius: 12,
            boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
            overflow: "auto",
            padding: 12,
          }}
        >
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, color: "#374151" }}>
            Recycle Bin
          </div>
          {recycleBin.map((node) => (
            <div
              key={node.id}
              style={{
                padding: "8px 12px",
                background: "#f9fafb",
                borderRadius: 8,
                marginBottom: 8,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span style={{ fontSize: 13, color: "#374151" }}>
                {getNodeLabel(node.index)}
              </span>
              <button
                onClick={() => onRestore(node)}
                style={{
                  padding: "4px 12px",
                  background: colors[node.index % colors.length],
                  color: "#fff",
                  border: "none",
                  borderRadius: 6,
                  fontSize: 11,
                  cursor: "pointer",
                  fontWeight: 600,
                }}
              >
                Restore
              </button>
            </div>
          ))}
        </motion.div>
      )}
    </div>
  )
}

export default function Page() {
  const router = useRouter()
  const { currentProject, setCurrentNodeId, triggerRefresh } = useApp()
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLDivElement>(null)
  const [activeNodes, setActiveNodes] = useState<NodeData[]>([])
  const [recycleBin, setRecycleBin] = useState<NodeData[]>([])
  const [nextId, setNextId] = useState(1)
  const [linkingNodeId, setLinkingNodeId] = useState<string | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)
  const [zoom, setZoom] = useState(1)
  const [panX, setPanX] = useState(0)
  const [panY, setPanY] = useState(0)
  const [isPanning, setIsPanning] = useState(false)
  const [panStart, setPanStart] = useState({ x: 0, y: 0 })

  useEffect(() => {
    if (currentProject && typeof window !== "undefined" && !isInitialized) {
      if (currentProject.nodes && currentProject.nodes.length > 0) {
        const rootNode = currentProject.nodes.find(n => n.parentId === null)
        if (rootNode && rootNode.x === 0 && rootNode.y === 0) {
          const pos = calculateNodePosition(null, [], window.innerWidth, window.innerHeight)
          const updatedNodes = currentProject.nodes.map(node => {
            if (node.parentId === null) {
              return { ...node, x: pos.x, y: pos.y }
            }
            return node
          })
          setActiveNodes(updatedNodes)
        } else {
          setActiveNodes(currentProject.nodes)
        }
        
        const maxId = Math.max(...currentProject.nodes.map(n => {
          const parts = n.id.split('-')
          return parseInt(parts[1]) || 0
        }))
        setNextId(maxId + 1)
      } else {
        const pos = calculateNodePosition(null, [], window.innerWidth, window.innerHeight)
        const initialNode: NodeData = {
          id: "node-0",
          index: 0,
          x: pos.x,
          y: pos.y,
          parentId: null,
          depth: 0,
          title: "Root Node",
          type: "document",
          status: "draft",
          tags: [],
          content: "",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
        setActiveNodes([initialNode])
      }
      setIsInitialized(true)
    }
  }, [currentProject, isInitialized])

  useEffect(() => {
    if (currentProject && isInitialized && activeNodes.length > 0) {
      updateAllNodes(currentProject.id, activeNodes)
      triggerRefresh()
    }
  }, [activeNodes, currentProject, isInitialized, triggerRefresh])

  const updatePosition = (id: string, x: number, y: number) => {
    setActiveNodes(prev =>
      prev.map(node => (node.id === id ? { ...node, x, y } : node))
    )
  }

  const addNode = (parentId: string) => {
    if (typeof window !== "undefined") {
      const parent = activeNodes.find(n => n.id === parentId)
      if (!parent) return

      const siblings = activeNodes.filter(n => n.parentId === parentId)
      
      const newIndex = activeNodes.length
      const pos = calculateNodePosition(
        parent,
        siblings,
        window.innerWidth,
        window.innerHeight
      )
      
      const newNode: NodeData = {
        id: `node-${nextId}`,
        index: newIndex,
        x: pos.x,
        y: pos.y,
        parentId: parentId,
        depth: parent.depth + 1,
        title: `Node ${newIndex + 1}`,
        type: "document",
        status: "draft",
        tags: [],
        content: "",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      setActiveNodes(prev => [...prev, newNode])
      setNextId(prev => prev + 1)
    }
  }

  const removeNode = (id: string) => {
    const nodeToRemove = activeNodes.find(n => n.id === id)
    if (!nodeToRemove) return
    
    if (nodeToRemove.parentId === null) {
      alert("Cannot remove the root node!")
      return
    }

    const getAllDescendants = (nodeId: string): string[] => {
      const children = activeNodes.filter(n => n.parentId === nodeId)
      const descendants = children.map(c => c.id)
      children.forEach(child => {
        descendants.push(...getAllDescendants(child.id))
      })
      return descendants
    }

    const idsToRemove = [id, ...getAllDescendants(id)]
    const nodesToRemove = activeNodes.filter(n => idsToRemove.includes(n.id))

    setActiveNodes(prev => prev.filter(n => !idsToRemove.includes(n.id)))
    setRecycleBin(prev => [...prev, ...nodesToRemove])
  }

  const restoreNode = (node: NodeData) => {
    // Check if parent exists in active nodes
    if (node.parentId && !activeNodes.find(n => n.id === node.parentId)) {
      alert("Cannot restore: parent node not found!")
      return
    }
    
    setRecycleBin(prev => prev.filter(n => n.id !== node.id))
    setActiveNodes(prev => [...prev, node])
  }

  const startLinking = (nodeId: string) => {
    setLinkingNodeId(nodeId)
  }

  const cancelLinking = () => {
    setLinkingNodeId(null)
  }

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && linkingNodeId) {
        cancelLinking()
      }
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [linkingNodeId])

  const linkToNode = (targetParentId: string) => {
    if (!linkingNodeId) return
    
    const nodeToRelink = activeNodes.find(n => n.id === linkingNodeId)
    const newParent = activeNodes.find(n => n.id === targetParentId)
    
    if (!nodeToRelink || !newParent) return
    
    // Update the node's parent
    if (typeof window !== "undefined") {
      const siblings = activeNodes.filter(n => n.parentId === targetParentId && n.id !== linkingNodeId)
      const newPos = calculateNodePosition(newParent, siblings, window.innerWidth, window.innerHeight)
      
      setActiveNodes(prev =>
        prev.map(n =>
          n.id === linkingNodeId
            ? { ...n, parentId: targetParentId, x: newPos.x, y: newPos.y, depth: newParent.depth + 1 }
            : n
        )
      )
    }
    
    setLinkingNodeId(null)
  }

  const canLinkTo = (targetNodeId: string): boolean => {
    if (!linkingNodeId) return false
    const linkingNode = activeNodes.find(n => n.id === linkingNodeId)
    const targetNode = activeNodes.find(n => n.id === targetNodeId)
    
    if (!linkingNode || !targetNode) return false
    if (linkingNode.id === targetNode.id) return false
    if (linkingNode.parentId === null) return false // Can't relink root
    if (targetNode.parentId === null && linkingNode.parentId === targetNodeId) return false // Already linked to root
    
    // Can only link to nodes created before this one
    if (targetNode.index >= linkingNode.index) return false
    
    // Check if target is a descendant of linking node (would create cycle)
    const isDescendant = (nodeId: string, ancestorId: string): boolean => {
      const node = activeNodes.find(n => n.id === nodeId)
      if (!node || node.parentId === null) return false
      if (node.parentId === ancestorId) return true
      return isDescendant(node.parentId, ancestorId)
    }
    
    if (isDescendant(targetNode.id, linkingNode.id)) return false
    
    return true
  }

  const handleNavigateToNotebook = (nodeId: string) => {
    if (currentProject) {
      setCurrentNodeId(nodeId)
      router.push(`/project/${currentProject.id}/notebook`)
    }
  }

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.2, 3))
  }

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.2, 0.3))
  }

  const handleResetView = () => {
    setZoom(1)
    setPanX(0)
    setPanY(0)
  }

  const handleFitToView = () => {
    if (activeNodes.length === 0 || !containerRef.current) return

    const padding = 100
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity

    activeNodes.forEach(node => {
      minX = Math.min(minX, node.x)
      minY = Math.min(minY, node.y)
      maxX = Math.max(maxX, node.x + SIZE)
      maxY = Math.max(maxY, node.y + SIZE)
    })

    const contentWidth = maxX - minX
    const contentHeight = maxY - minY
    const containerWidth = containerRef.current.clientWidth - padding * 2
    const containerHeight = containerRef.current.clientHeight - padding * 2

    const scaleX = containerWidth / contentWidth
    const scaleY = containerHeight / contentHeight
    const newZoom = Math.min(scaleX, scaleY, 1)

    const centerX = (minX + maxX) / 2
    const centerY = (minY + maxY) / 2
    const viewportCenterX = containerRef.current.clientWidth / 2
    const viewportCenterY = containerRef.current.clientHeight / 2

    setPanX((viewportCenterX - centerX * newZoom))
    setPanY((viewportCenterY - centerY * newZoom))
    setZoom(newZoom)
  }

  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault()
      const delta = e.deltaY > 0 ? -0.1 : 0.1
      setZoom(prev => Math.max(0.3, Math.min(3, prev + delta)))
    }
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 1 || (e.button === 0 && (e.altKey || e.shiftKey))) {
      e.preventDefault()
      setIsPanning(true)
      setPanStart({ x: e.clientX - panX, y: e.clientY - panY })
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setPanX(e.clientX - panStart.x)
      setPanY(e.clientY - panStart.y)
    }
  }

  const handleMouseUp = () => {
    setIsPanning(false)
  }

  if (activeNodes.length === 0 || !currentProject) return null

  return (
    <div
      ref={containerRef}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      style={{
        position: "relative",
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
        background: "#fdf8ff",
        cursor: isPanning ? 'grabbing' : 'default',
      }}
    >
      {/* Zoom Controls */}
      <div style={{
        position: "fixed",
        bottom: 100,
        right: 20,
        zIndex: 200,
        display: "flex",
        flexDirection: "column",
        gap: 8,
        background: "rgba(255, 255, 255, 0.95)",
        padding: 12,
        borderRadius: 16,
        boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
        border: "1px solid rgba(147, 74, 203, 0.2)",
      }}>
        <div style={{
          fontSize: 10,
          color: "#666",
          textAlign: "center",
          marginBottom: 4,
          fontWeight: 600,
        }}>
          Navigation
        </div>
        
        <motion.button
          onClick={handleZoomIn}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          title="Zoom In"
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: "linear-gradient(135deg, #cfaad8, #934acb)",
            color: "#fff",
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 4px 12px rgba(147, 74, 203, 0.3)",
          }}
        >
          <ZoomIn className="w-5 h-5" />
        </motion.button>
        
        <motion.button
          onClick={handleZoomOut}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          title="Zoom Out"
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: "linear-gradient(135deg, #cfaad8, #934acb)",
            color: "#fff",
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 4px 12px rgba(147, 74, 203, 0.3)",
          }}
        >
          <ZoomOut className="w-5 h-5" />
        </motion.button>
        
        <motion.button
          onClick={handleFitToView}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          title="Fit to View"
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: "linear-gradient(135deg, #cfaad8, #934acb)",
            color: "#fff",
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 4px 12px rgba(147, 74, 203, 0.3)",
          }}
        >
          <Maximize2 className="w-5 h-5" />
        </motion.button>
        
        <motion.button
          onClick={handleResetView}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          title="Reset View"
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: "linear-gradient(135deg, #cfaad8, #934acb)",
            color: "#fff",
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 4px 12px rgba(147, 74, 203, 0.3)",
          }}
        >
          <Home className="w-5 h-5" />
        </motion.button>

        <div style={{
          fontSize: 9,
          color: "#999",
          textAlign: "center",
          marginTop: 4,
          lineHeight: 1.3,
        }}>
          Ctrl+Scroll: Zoom<br/>
          Shift+Drag: Pan
        </div>

        <div style={{
          fontSize: 11,
          color: "#666",
          textAlign: "center",
          marginTop: 8,
          paddingTop: 8,
          borderTop: "1px solid #e5e7eb",
          fontWeight: 600,
        }}>
          {Math.round(zoom * 100)}%
        </div>
      </div>

      {/* Canvas with zoom and pan */}
      <div
        ref={canvasRef}
        style={{
          position: "absolute",
          inset: 0,
          transformOrigin: "0 0",
          transform: `translate(${panX}px, ${panY}px) scale(${zoom})`,
          transition: isPanning ? 'none' : 'transform 0.2s ease-out',
        }}
      >
        {/* Background blobs */}
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0 }}>
          <div style={{ position: "absolute", top: "10%", left: "15%", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle,#f3e8ff88,transparent 70%)" }} />
          <div style={{ position: "absolute", bottom: "10%", right: "10%", width: 350, height: 350, borderRadius: "50%", background: "radial-gradient(circle,#fce7ff88,transparent 70%)" }} />
          <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 500, height: 300, borderRadius: "50%", background: "radial-gradient(circle,#ede9ff55,transparent 70%)" }} />
        </div>

        {/* Lines connecting nodes */}
        <Lines nodes={activeNodes} />

        {/* Active Nodes */}
        {activeNodes.map((node) => (
          <DragBox
            key={node.id}
            node={node}
            color={colors[node.index % colors.length]}
            containerRef={canvasRef}
            onMove={(x, y) => updatePosition(node.id, x, y)}
            onAddNode={() => addNode(node.id)}
            onRemoveNode={() => removeNode(node.id)}
            onStartLink={() => startLinking(node.id)}
            onLink={() => linkToNode(node.id)}
            onNavigateToNotebook={handleNavigateToNotebook}
            isLinking={linkingNodeId !== null}
            linkingNodeId={linkingNodeId}
            canBeLinkedTo={canLinkTo(node.id)}
          />
        ))}
      </div>

      {/* Linking Mode Banner */}
      {linkingNodeId && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          style={{
            position: "fixed",
            top: 20,
            left: "50%",
            transform: "translateX(-50%)",
            background: "rgba(59, 130, 246, 0.95)",
            color: "#fff",
            padding: "12px 24px",
            borderRadius: 12,
            boxShadow: "0 8px 32px rgba(59, 130, 246, 0.3)",
            zIndex: 100,
            display: "flex",
            alignItems: "center",
            gap: 12,
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          <span>🔗 Linking mode active - Click on a valid node to relink</span>
          <button
            onClick={cancelLinking}
            style={{
              background: "rgba(255, 255, 255, 0.2)",
              border: "1px solid rgba(255, 255, 255, 0.3)",
              color: "#fff",
              padding: "4px 12px",
              borderRadius: 6,
              fontSize: 12,
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            Cancel (ESC)
          </button>
        </motion.div>
      )}

      {/* Recycle Bin */}
      <RecycleBin recycleBin={recycleBin} onRestore={restoreNode} />
    </div>
  )
}