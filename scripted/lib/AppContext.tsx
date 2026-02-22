"use client"

import React, { createContext, useContext, useState, useEffect } from 'react'
import { Project, User, getCurrentUser, initializeUser, initializeWithSampleProject } from '@/lib/localDb'

type AppContextType = {
  user: User | null
  setUser: (user: User | null) => void
  currentProject: Project | null
  setCurrentProject: (project: Project | null) => void
  currentNodeId: string | null
  setCurrentNodeId: (nodeId: string | null) => void
  refreshTrigger: number
  triggerRefresh: () => void
}

const AppContext = createContext<AppContextType | undefined>(undefined)

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [currentProject, setCurrentProject] = useState<Project | null>(null)
  const [currentNodeId, setCurrentNodeId] = useState<string | null>(null)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  useEffect(() => {
    const existingUser = getCurrentUser()
    setUser(existingUser)
    
    if (existingUser) {
      initializeWithSampleProject()
    }
  }, [])

  const triggerRefresh = () => {
    setRefreshTrigger(prev => prev + 1)
  }

  return (
    <AppContext.Provider
      value={{
        user,
        setUser,
        currentProject,
        setCurrentProject,
        currentNodeId,
        setCurrentNodeId,
        refreshTrigger,
        triggerRefresh,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const context = useContext(AppContext)
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider')
  }
  return context
}
