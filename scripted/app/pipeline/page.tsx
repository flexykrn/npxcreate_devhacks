"use client"
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { Trash2, RotateCcw, Plus, X, Upload, FileText, Sparkles } from 'lucide-react'

type NodeData = {
  id: string
  index: number
  x: number
  y: number
  parentId: string | null
  depth: number
  stage: 'upload' | 'stage1' | 'stage2' | 'stage3' | 'final'
  sessionId?: string
  data?: any
}

type RemovedNode = NodeData & {
  removedAt: number
}

export default function MainPage() {
  const router = useRouter()
  const [nodes, setNodes] = useState<NodeData[]>([
    { id: '1', index: 1, x: 400, y: 100, parentId: null, depth: 0, stage: 'upload' }
  ])
  const [removedNodes, setRemovedNodes] = useState<RemovedNode[]>([])
  const [draggedNode, setDraggedNode] = useState<string | null>(null)
  const [hoveredNode, setHoveredNode] = useState<string | null>(null)
  const [showRecycleBin, setShowRecycleBin] = useState(false)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [connectingFrom, setConnectingFrom] = useState<string | null>(null)
  const [connectionTarget, setConnectionTarget] = useState<string | null>(null)
  
  // Upload modal state
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [rawText, setRawText] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentNodeId, setCurrentNodeId] = useState<string | null>(null)

  useEffect(() => {
    const saved = localStorage.getItem('notebook-nodes')
    const savedRemoved = localStorage.getItem('removed-nodes')
    if (saved) {
      try {
        setNodes(JSON.parse(saved))
      } catch (e) {
        console.error('Failed to parse saved nodes')
      }
    }
    if (savedRemoved) {
      try {
        setRemovedNodes(JSON.parse(savedRemoved))
      } catch (e) {
        console.error('Failed to parse removed nodes')
      }
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('notebook-nodes', JSON.stringify(nodes))
  }, [nodes])

  useEffect(() => {
    localStorage.setItem('removed-nodes', JSON.stringify(removedNodes))
  }, [removedNodes])

  const getNodeLabel = (node: NodeData) => {
    const stageLabels = {
      'upload': 'Upload Script',
      'stage1': 'Stage 1: Parse',
      'stage2': 'Stage 2: Analyze',
      'stage3': 'Stage 3: Enhance',
      'final': 'Final Output'
    }
    return stageLabels[node.stage] || `Node ${node.index}`
  }

  const getNodeColor = (stage: NodeData['stage']) => {
    const colors = {
      'upload': 'from-blue-500 to-blue-600',
      'stage1': 'from-purple-500 to-purple-600',
      'stage2': 'from-pink-500 to-pink-600',
      'stage3': 'from-orange-500 to-orange-600',
      'final': 'from-green-500 to-green-600'
    }
    return colors[stage] || 'from-gray-500 to-gray-600'
  }

  const addNode = (parentId: string) => {
    const parent = nodes.find(n => n.id === parentId)
    if (!parent) return

    const siblings = nodes.filter(n => n.parentId === parentId)
    const newIndex = Math.max(...nodes.map(n => n.index)) + 1
    const newId = Date.now().toString()
  
    const verticalSpacing = 150
    const horizontalSpacing = 180
    const childrenCount = siblings.length
    const offsetX = (childrenCount - Math.floor(childrenCount / 2)) * horizontalSpacing
  
    // Determine next stage
    const stageOrder: NodeData['stage'][] = ['upload', 'stage1', 'stage2', 'stage3', 'final']
    const currentStageIndex = stageOrder.indexOf(parent.stage)
    const nextStage = stageOrder[Math.min(currentStageIndex + 1, stageOrder.length - 1)]
  
    const newNode: NodeData = {
      id: newId,
      index: newIndex,
      x: parent.x + offsetX,
      y: parent.y + verticalSpacing,
      parentId: parentId,
      depth: parent.depth + 1,
      stage: nextStage
    }
    setNodes([...nodes, newNode])
  }

  const removeNode = (nodeId: string) => {
    const nodeToRemove = nodes.find(n => n.id === nodeId)
    if (!nodeToRemove || nodeToRemove.parentId === null) return

    const getDescendants = (id: string): string[] => {
      const children = nodes.filter(n => n.parentId === id)
      return [id, ...children.flatMap(child => getDescendants(child.id))]
    }

    const idsToRemove = getDescendants(nodeId)
    const nodesToRemove = nodes.filter(n => idsToRemove.includes(n.id))
    const remainingNodes = nodes.filter(n => !idsToRemove.includes(n.id))

    setRemovedNodes([
      ...removedNodes,
      ...nodesToRemove.map(n => ({ ...n, removedAt: Date.now() }))
    ])
    setNodes(remainingNodes)
  }

  const restoreNode = (nodeId: string) => {
    const nodeToRestore = removedNodes.find(n => n.id === nodeId)
    if (!nodeToRestore) return

    const parentExists = nodeToRestore.parentId === null ||
                        nodes.some(n => n.id === nodeToRestore.parentId)
  
    if (!parentExists) {
      alert('Cannot restore: parent node does not exist')
      return
    }

    const { removedAt, ...node } = nodeToRestore
    setNodes([...nodes, node])
    setRemovedNodes(removedNodes.filter(n => n.id !== nodeId))
  }

  const handleMouseDown = (e: React.MouseEvent, nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId)
    if (!node) return

    setDraggedNode(nodeId)
    setOffset({
      x: e.clientX - node.x,
      y: e.clientY - node.y
    })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (draggedNode) {
      setNodes(nodes.map(node =>
        node.id === draggedNode
          ? { ...node, x: e.clientX - offset.x, y: e.clientY - offset.y }
          : node
      ))
    }
  }

  const handleMouseUp = () => {
    setDraggedNode(null)
  }

  const handleNodeClick = (nodeId: string) => {
    if (draggedNode) return
  
    const node = nodes.find(n => n.id === nodeId)
    if (!node) return

    if (connectingFrom) {
      if (connectingFrom !== nodeId) {
        const sourceNode = nodes.find(n => n.id === connectingFrom)
        const targetNode = nodes.find(n => n.id === nodeId)
      
        if (sourceNode && targetNode && targetNode.index > sourceNode.index) {
          setNodes(nodes.map(n =>
            n.id === nodeId
              ? { ...n, parentId: connectingFrom, depth: (sourceNode.depth || 0) + 1 }
              : n
          ))
        }
      }
      setConnectingFrom(null)
      setConnectionTarget(null)
    } else {
      // Handle node interaction based on stage
      if (node.stage === 'upload' && !node.sessionId) {
        setCurrentNodeId(nodeId)
        setShowUploadModal(true)
      } else if (node.sessionId) {
        router.push(`/notebook?node=${nodeId}&session=${node.sessionId}`)
      }
    }
  }

  const startConnection = (e: React.MouseEvent, fromNodeId: string) => {
    e.stopPropagation()
    setConnectingFrom(fromNodeId)
  }

  const handleNodeHover = (nodeId: string | null) => {
    if (connectingFrom && nodeId && nodeId !== connectingFrom) {
      const sourceNode = nodes.find(n => n.id === connectingFrom)
      const targetNode = nodes.find(n => n.id === nodeId)
    
      if (sourceNode && targetNode && targetNode.index > sourceNode.index) {
        setConnectionTarget(nodeId)
      } else {
        setConnectionTarget(null)
      }
    } else {
      setConnectionTarget(null)
    }
  }

  const handleFileUpload = async () => {
    setError(null)
    setLoading(true)

    try {
      const sessionId = `session_${Date.now()}`
      
      if (rawText.trim()) {
        // Process text
        const formData = new FormData()
        formData.append('raw_text', rawText)
        formData.append('session_id', sessionId)

        const response = await fetch('http://localhost:8080/api/v1/process-text', {
          method: 'POST',
          body: formData
        })

        if (!response.ok) {
          throw new Error('Failed to process text')
        }

        const result = await response.json()
        
        // Update node with session data
        if (currentNodeId) {
          setNodes(nodes.map(n => 
            n.id === currentNodeId 
              ? { ...n, sessionId, data: result.data, stage: 'stage1' }
              : n
          ))
          
          // Create next stage node
          addNode(currentNodeId)
        }

        setShowUploadModal(false)
        setRawText("")
        setSelectedFile(null)
        setError(null)
        
      } else if (selectedFile) {
        // Process file
        const formData = new FormData()
        formData.append('file', selectedFile)
        formData.append('session_id', sessionId)

        const response = await fetch('http://localhost:8080/api/v1/upload-script', {
          method: 'POST',
          body: formData
        })

        if (!response.ok) {
          throw new Error('Failed to upload file')
        }

        const result = await response.json()
        
        // Update node with session data
        if (currentNodeId) {
          setNodes(nodes.map(n => 
            n.id === currentNodeId 
              ? { ...n, sessionId, data: result.data, stage: 'stage1' }
              : n
          ))
          
          // Create next stage node
          addNode(currentNodeId)
        }

        setShowUploadModal(false)
        setRawText("")
        setSelectedFile(null)
        setError(null)
        
      } else {
        setError("⚠️ Please enter text or select a file")
      }
    } catch (err) {
      console.error("Error:", err)
      setError(`❌ ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  const renderLines = () => {
    return nodes.map(node => {
      if (!node.parentId) return null
      const parent = nodes.find(n => n.id === node.parentId)
      if (!parent) return null

      return (
        <line
          key={`line-${node.id}`}
          x1={parent.x}
          y1={parent.y}
          x2={node.x}
          y2={node.y}
          stroke="#9333ea"
          strokeWidth="2"
          strokeDasharray="5,5"
          opacity="0.5"
        />
      )
    })
  }

  return (
    <div
      className="relative w-screen h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 overflow-hidden"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        {renderLines()}
        {connectingFrom && connectionTarget && (
          <line
            x1={nodes.find(n => n.id === connectingFrom)?.x || 0}
            y1={nodes.find(n => n.id === connectingFrom)?.y || 0}
            x2={nodes.find(n => n.id === connectionTarget)?.x || 0}
            y2={nodes.find(n => n.id === connectionTarget)?.y || 0}
            stroke="#22c55e"
            strokeWidth="3"
            strokeDasharray="5,5"
            opacity="0.8"
          />
        )}
      </svg>

      <AnimatePresence>
        {nodes.map((node) => {
          const isHovered = hoveredNode === node.id && !draggedNode
          const isConnectionTarget = connectionTarget === node.id
        
          return (
            <motion.div
              key={node.id}
              className="absolute"
              style={{
                left: node.x,
                top: node.y,
                transform: 'translate(-50%, -50%)'
              }}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              onMouseEnter={() => {
                setHoveredNode(node.id)
                handleNodeHover(node.id)
              }}
              onMouseLeave={() => {
                setHoveredNode(null)
                handleNodeHover(null)
              }}
            >
              <div className="relative">
                <motion.div
                  className={`w-20 h-20 rounded-full flex items-center justify-center text-white font-bold text-sm cursor-pointer select-none transition-all ${
                    isConnectionTarget
                      ? 'bg-gradient-to-br from-green-400 to-green-600 ring-4 ring-green-300'
                      : `bg-gradient-to-br ${getNodeColor(node.stage)}`
                  }`}
                  onMouseDown={(e) => handleMouseDown(e, node.id)}
                  onClick={() => handleNodeClick(node.id)}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {node.index}
                </motion.div>

                {isHovered && (
                  <>
                    <motion.button
                      className="absolute -top-2 -right-2 w-9 h-9 rounded-full bg-green-500 text-white flex items-center justify-center shadow-lg hover:bg-green-600 transition-colors z-10"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                      onClick={(e) => {
                        e.stopPropagation()
                        addNode(node.id)
                      }}
                      title="Add child node"
                    >
                      <Plus className="w-5 h-5" />
                    </motion.button>

                    {node.parentId && (
                      <motion.button
                        className="absolute -top-2 -left-2 w-9 h-9 rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors z-10"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                        onClick={(e) => {
                          e.stopPropagation()
                          removeNode(node.id)
                        }}
                        title="Remove node"
                      >
                        <X className="w-5 h-5" />
                      </motion.button>
                    )}

                    <motion.button
                      className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center shadow-lg hover:bg-blue-600 transition-colors z-10 whitespace-nowrap"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                      onClick={(e) => startConnection(e, node.id)}
                      title="Connect to another node"
                    >
                      Connect
                    </motion.button>

                    <motion.div
                      className="absolute top-24 left-1/2 -translate-x-1/2 bg-white rounded-xl shadow-2xl p-4 w-64 border border-purple-200 z-20"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="text-center">
                        <h3 className="font-bold text-gray-800 mb-2">{getNodeLabel(node)}</h3>
                        <div className="text-xs text-gray-500 bg-purple-50 rounded-lg py-3 border border-purple-100">
                          {node.sessionId ? '✅ Data Available' : '⏳ Pending'}
                        </div>
                      </div>
                      <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white border-l border-t border-purple-200 rotate-45" />
                    </motion.div>
                  </>
                )}
              </div>
            </motion.div>
          )
        })}
      </AnimatePresence>

      {/* Upload Modal */}
      <AnimatePresence>
        {showUploadModal && (
          <motion.div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-800">Upload Script</h2>
                  <button
                    onClick={() => setShowUploadModal(false)}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                {error && (
                  <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                    {error}
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Paste Screenplay Text
                    </label>
                    <textarea
                      value={rawText}
                      onChange={(e) => setRawText(e.target.value)}
                      placeholder="INT. SUBWAY CAR - MIDNIGHT&#10;&#10;The fluorescent lights flicker wildly..."
                      className="w-full h-40 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>

                  <div className="text-center text-gray-500">OR</div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Upload File (PDF, DOCX, TXT)
                    </label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-purple-500 transition-colors cursor-pointer">
                      <input
                        type="file"
                        accept=".pdf,.docx,.txt"
                        onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                        className="hidden"
                        id="file-upload"
                      />
                      <label htmlFor="file-upload" className="cursor-pointer">
                        <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                        {selectedFile ? (
                          <p className="text-purple-600 font-medium">{selectedFile.name}</p>
                        ) : (
                          <p className="text-gray-600">Click to upload or drag and drop</p>
                        )}
                      </label>
                    </div>
                  </div>

                  <button
                    onClick={handleFileUpload}
                    disabled={loading}
                    className="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center">
                        <Sparkles className="w-5 h-5 mr-2 animate-spin" />
                        Processing...
                      </span>
                    ) : (
                      'Process Script'
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {connectingFrom && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-blue-500 text-white px-6 py-3 rounded-full shadow-lg z-50">
          Click on a later node to connect, or click anywhere to cancel
        </div>
      )}

      <div className="fixed bottom-6 right-6 z-40">
        <motion.button
          className="relative w-14 h-14 rounded-full bg-gradient-to-br from-red-500 to-pink-600 text-white flex items-center justify-center shadow-lg hover:shadow-2xl transition-shadow"
          onClick={() => setShowRecycleBin(!showRecycleBin)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Trash2 className="w-6 h-6" />
          {removedNodes.length > 0 && (
            <span className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-400 text-black text-xs font-bold rounded-full flex items-center justify-center">
              {removedNodes.length}
            </span>
          )}
        </motion.button>

        <AnimatePresence>
          {showRecycleBin && (
            <motion.div
              className="absolute bottom-16 right-0 w-80 bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-200"
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.9 }}
            >
              <div className="bg-gradient-to-r from-red-500 to-pink-600 text-white p-4">
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <Trash2 className="w-5 h-5" />
                  Recycle Bin
                </h3>
              </div>
              <div className="max-h-96 overflow-y-auto p-4">
                {removedNodes.length === 0 ? (
                  <p className="text-gray-400 text-center py-8">No removed nodes</p>
                ) : (
                  <div className="space-y-2">
                    {removedNodes.map((node) => (
                      <motion.div
                        key={node.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                      >
                        <span className="font-medium text-gray-700">{getNodeLabel(node)}</span>
                        <button
                          className="px-3 py-1 bg-green-500 text-white text-sm rounded-lg hover:bg-green-600 transition-colors flex items-center gap-1"
                          onClick={() => restoreNode(node.id)}
                        >
                          <RotateCcw className="w-4 h-4" />
                          Restore
                        </button>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
