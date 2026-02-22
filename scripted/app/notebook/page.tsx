"use client"
import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft, Save, Download, Sparkles, FileText, ChevronRight } from 'lucide-react'

function NotebookContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const stage = searchParams.get('stage') || '2'

  const [loading, setLoading] = useState(true)
  const [content, setContent] = useState<string>("")
  const [title, setTitle] = useState<string>("")
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadStageData()
  }, [stage])

  const loadStageData = () => {
    try {
      const stageNum = parseInt(stage)
      
      if (stageNum === 2) {
        // Load AI enhanced output from localStorage
        const stage1Data = localStorage.getItem('stage1Data')
        if (stage1Data) {
          const parsed = JSON.parse(stage1Data)
          setTitle("AI Enhanced Screenplay")
          setContent(formatScreenplayData(parsed))
        } else {
          setContent("No screenplay data found. Please start from Stage 1.")
        }
      } else if (stageNum === 3) {
        setTitle("Visual Context Analysis")
        const imageUrl = localStorage.getItem('stage3Image')
        setContent("Visual analysis will appear here...\n\nImage processing in progress...")
      } else if (stageNum === 4) {
        setTitle("Final Screenplay")
        setContent("Final polished screenplay will appear here...")
      }
      
      setLoading(false)
    } catch (err) {
      console.error('Error loading stage data:', err)
      setError('Failed to load screenplay data')
      setLoading(false)
    }
  }

  const formatScreenplayData = (data: any) => {
    let formatted = ""
    
    if (data.scenes && data.scenes.length > 0) {
      data.scenes.forEach((scene: any) => {
        formatted += `${scene.location} - ${scene.time}\n\n`
        
        // Interleave actions and dialogues
        scene.actions?.forEach((action: string) => {
          formatted += `${action}\n\n`
        })
        
        scene.dialogues?.forEach((dialogue: any) => {
          formatted += `${dialogue.character}\n`
          formatted += `${dialogue.text}\n\n`
        })
        
        formatted += `---\n\n`
      })
    } else {
      formatted = JSON.stringify(data, null, 2)
    }
    
    return formatted
  }

  const handleProceedFurther = () => {
    const stageNum = parseInt(stage)
    const nextStage = stageNum + 1
    
    if (nextStage <= 4) {
      // Save current content
      localStorage.setItem(`stage${stageNum}Content`, content)
      
      // Update unlocked stage in localStorage
      localStorage.setItem('unlockedStage', nextStage.toString())
      
      // Go back to main page
      router.push('/main')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <Sparkles className="w-12 h-12 animate-spin mx-auto mb-4 text-purple-600" />
          <p className="text-gray-600">Loading screenplay data...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error</h2>
          <p className="text-gray-700 mb-6">{error}</p>
          <button
            onClick={() => router.push('/main')}
            className="w-full py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Back to Pipeline
          </button>
        </div>
      </div>
    )
  }

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
    >
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Caveat:wght@400;600;700&family=Schoolbell&family=Patrick+Hand&display=swap');`}</style>

      {/* Top Bar */}
      <div className="w-full max-w-[860px] flex items-center justify-between mb-6">
        <button
          onClick={() => router.push('/main')}
          className="flex items-center gap-2 px-4 py-2 bg-white/80 rounded-lg shadow-md hover:bg-white transition-colors"
        >
          <ArrowLeft size={18} />
          <span className="font-semibold">Back to Pipeline</span>
        </button>

        <div
          className="text-white px-4 py-1.5 rounded shadow-md select-none"
          style={{ background: "#e53935", fontFamily: "Schoolbell, cursive", fontSize: "1.4rem", letterSpacing: 1 }}
        >
          📓 Stage {stage} - {title || "Screenplay"}
        </div>

        <button 
          onClick={() => window.print()} 
          className="bg-white border-2 border-gray-300 rounded-lg px-3 py-1.5 text-sm text-gray-700 hover:bg-red-500 hover:text-white hover:border-red-500 transition-all"
        >
          🖨 Print
        </button>
      </div>

      {/* Notebook */}
      <div
        className="w-full max-w-[860px] rounded-lg overflow-hidden"
        style={{ boxShadow: "6px 6px 32px rgba(0,0,0,0.18)" }}
      >
        <div
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
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Title your screenplay…"
              maxLength={60}
              className="bg-transparent border-none outline-none flex-1 font-bold tracking-wide"
              style={{ fontFamily: "Caveat, cursive", fontSize: "1.8rem", color: "#d32f2f" }}
            />
          </div>

          {/* Writing Area */}
          <div style={{ padding: "8px 24px 80px 96px" }}>
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder={"Your screenplay appears here... ✍️\n\nYou can edit any part of it!\n\nMake changes, add notes, or refine the dialogue..."}
              className="w-full bg-transparent border-none outline-none resize-none block"
              style={{
                fontFamily: "Caveat, cursive",
                fontSize: "1.35rem",
                color: "#1a237e",
                lineHeight: "32px",
                letterSpacing: "0.5px",
                caretColor: "#d32f2f",
                minHeight: 600,
                overflow: "hidden",
              }}
            />
          </div>

          {/* Bottom Action Bar */}
          <div
            className="sticky bottom-0 left-0 flex items-center gap-4 p-4 border-t-2 border-blue-200"
            style={{ background: "linear-gradient(to top, #fdfaf3 70%, transparent)" }}
          >
            <span
              className="text-gray-400 text-sm select-none"
              style={{ fontFamily: "Patrick Hand, cursive" }}
            >
              {content.trim().split(/\s+/).length} words · {content.length} chars
            </span>

            <button
              onClick={handleProceedFurther}
              className="ml-auto flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-lg shadow-lg hover:shadow-xl hover:scale-105 transition-all"
              style={{ fontFamily: "Patrick Hand, cursive", fontSize: "1.1rem" }}
            >
              Proceed Further
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function NotebookPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center">
        <Sparkles className="w-12 h-12 animate-spin text-purple-600" />
      </div>
    }>
      <NotebookContent />
    </Suspense>
  )
}
