"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { useApp } from "@/lib/AppContext"
import { getProjectById } from "@/lib/localDb"
import MainPage from "@/app/main/page"

export default function ProjectTreePage() {
  const router = useRouter()
  const params = useParams()
  const { setCurrentProject } = useApp()
  const projectId = params.id as string
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (projectId) {
      const project = getProjectById(projectId)
      if (project) {
        setCurrentProject(project)
        setIsLoading(false)
      } else {
        router.push('/dashboard')
      }
    }
  }, [projectId, setCurrentProject, router])

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#fdf8ff' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📂</div>
          <div style={{ fontSize: 18, color: '#6b7280' }}>Loading project...</div>
        </div>
      </div>
    )
  }

  return <MainPage />
}
