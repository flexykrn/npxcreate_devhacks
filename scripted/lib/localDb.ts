// Local Database using localStorage with TypeScript types

export type NodeData = {
  id: string
  index: number
  x: number
  y: number
  parentId: string | null
  depth: number
  title: string
  type: 'document' | 'code' | 'data' | 'design' | 'task' | 'link'
  status: 'draft' | 'in-progress' | 'review' | 'complete'
  tags: string[]
  content: string
  createdAt: string
  updatedAt: string
}

export type Project = {
  id: string
  title: string
  description: string
  nodes: NodeData[]
  createdAt: string
  updatedAt: string
  lastOpened: string
  isFavorite: boolean
  template?: string
  deleted?: boolean
  deletedAt?: string
}

export type User = {
  id: string
  name: string
  email: string
  avatar?: string
  role: 'owner' | 'admin' | 'editor' | 'viewer'
}

// Initialize default user if not exists
export const initializeUser = (): User => {
  const existingUser = localStorage.getItem('scripted_user')
  if (existingUser) return JSON.parse(existingUser)
  
  const defaultUser: User = {
    id: 'user-1',
    name: 'John Doe',
    email: 'user@example.com',
    role: 'owner',
  }
  
  localStorage.setItem('scripted_user', JSON.stringify(defaultUser))
  return defaultUser
}

export const getCurrentUser = (): User | null => {
  const user = localStorage.getItem('scripted_user')
  return user ? JSON.parse(user) : null
}

export const updateUser = (user: Partial<User>): void => {
  const currentUser = getCurrentUser()
  if (currentUser) {
    const updated = { ...currentUser, ...user }
    localStorage.setItem('scripted_user', JSON.stringify(updated))
  }
}

export const getAllProjects = (): Project[] => {
  const projects = localStorage.getItem('scripted_projects')
  const allProjects = projects ? JSON.parse(projects) : []
  return allProjects.filter((p: Project) => !p.deleted)
}

export const getAllProjectsIncludingDeleted = (): Project[] => {
  const projects = localStorage.getItem('scripted_projects')
  return projects ? JSON.parse(projects) : []
}

export const getProjectById = (id: string): Project | null => {
  const projects = getAllProjects()
  return projects.find(p => p.id === id) || null
}

export const createProject = (title: string, description: string = '', template?: string): Project => {
  const projects = getAllProjects()
  
  const newProject: Project = {
    id: `project-${Date.now()}`,
    title,
    description,
    nodes: [{
      id: `node-0-${Date.now()}`,
      index: 0,
      x: 0,
      y: 0,
      parentId: null,
      depth: 0,
      title: 'Root Node',
      type: 'document',
      status: 'draft',
      tags: [],
      content: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    lastOpened: new Date().toISOString(),
    isFavorite: false,
    template,
  }
  
  projects.push(newProject)
  localStorage.setItem('scripted_projects', JSON.stringify(projects))
  return newProject
}

export const updateProject = (id: string, updates: Partial<Project>): void => {
  const projects = getAllProjects()
  const index = projects.findIndex(p => p.id === id)
  
  if (index !== -1) {
    projects[index] = {
      ...projects[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    }
    localStorage.setItem('scripted_projects', JSON.stringify(projects))
  }
}

export const deleteProject = (id: string): void => {
  const projects = getAllProjectsIncludingDeleted()
  const index = projects.findIndex(p => p.id === id)
  
  if (index !== -1) {
    projects[index] = {
      ...projects[index],
      deleted: true,
      deletedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    localStorage.setItem('scripted_projects', JSON.stringify(projects))
  }
}

export const getDeletedProjects = (): Project[] => {
  const projects = getAllProjectsIncludingDeleted()
  return projects.filter(p => p.deleted === true)
}

export const restoreProject = (id: string): void => {
  const projects = getAllProjectsIncludingDeleted()
  const index = projects.findIndex(p => p.id === id)
  
  if (index !== -1) {
    projects[index] = {
      ...projects[index],
      deleted: false,
      deletedAt: undefined,
      updatedAt: new Date().toISOString(),
    }
    localStorage.setItem('scripted_projects', JSON.stringify(projects))
  }
}

export const permanentlyDeleteProject = (id: string): void => {
  const projects = getAllProjectsIncludingDeleted()
  const filtered = projects.filter(p => p.id !== id)
  localStorage.setItem('scripted_projects', JSON.stringify(filtered))
}

export const toggleFavorite = (id: string): void => {
  const project = getProjectById(id)
  if (project) {
    updateProject(id, { isFavorite: !project.isFavorite })
  }
}

// Update last opened
export const updateLastOpened = (id: string): void => {
  updateProject(id, { lastOpened: new Date().toISOString() })
}

export const getNodeById = (projectId: string, nodeId: string): NodeData | null => {
  const project = getProjectById(projectId)
  if (!project) return null
  return project.nodes.find(n => n.id === nodeId) || null
}

export const updateNode = (projectId: string, nodeId: string, updates: Partial<NodeData>): void => {
  const project = getProjectById(projectId)
  if (!project) return
  
  const nodeIndex = project.nodes.findIndex(n => n.id === nodeId)
  if (nodeIndex !== -1) {
    project.nodes[nodeIndex] = {
      ...project.nodes[nodeIndex],
      ...updates,
      updatedAt: new Date().toISOString(),
    }
    updateProject(projectId, { nodes: project.nodes })
  }
}

// Update all nodes (for tree structure changes)
export const updateAllNodes = (projectId: string, nodes: NodeData[]): void => {
  updateProject(projectId, { nodes })
}

// Add node to project
export const addNodeToProject = (projectId: string, node: NodeData): void => {
  const project = getProjectById(projectId)
  if (!project) return
  
  project.nodes.push(node)
  updateProject(projectId, { nodes: project.nodes })
}

// Remove node from project
export const removeNodeFromProject = (projectId: string, nodeId: string): void => {
  const project = getProjectById(projectId)
  if (!project) return
  
  const filtered = project.nodes.filter(n => n.id !== nodeId)
  updateProject(projectId, { nodes: filtered })
}

// Get favorite projects
export const getFavoriteProjects = (): Project[] => {
  return getAllProjects().filter(p => p.isFavorite)
}

export const getRecentProjects = (limit: number = 5): Project[] => {
  return getAllProjects()
    .sort((a, b) => new Date(b.lastOpened).getTime() - new Date(a.lastOpened).getTime())
    .slice(0, limit)
}

export const searchProjects = (query: string): Project[] => {
  const lowerQuery = query.toLowerCase()
  return getAllProjects().filter(p => 
    p.title.toLowerCase().includes(lowerQuery) ||
    p.description.toLowerCase().includes(lowerQuery)
  )
}

// Initialize with sample project if empty
export const initializeWithSampleProject = (): void => {
  const projects = getAllProjects()
  if (projects.length === 0) {
    createProject(
      'My First Project',
      'Welcome to ScriptED! Start building your knowledge tree here.',
      'blank'
    )
  }
}
