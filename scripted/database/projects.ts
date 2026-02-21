import { getDatabase } from './db';

export interface Project {
  id: number;
  name: string;
  description?: string;
  owner_id: number;
  created_at: string;
  updated_at: string;
}

export interface ProjectWithOwner extends Project {
  owner_username: string;
}

// Create new project
export function createProject(name: string, ownerId: number, description?: string): Project | null {
  const db = getDatabase();
  
  try {
    const stmt = db.prepare('INSERT INTO projects (name, description, owner_id) VALUES (?, ?, ?)');
    const result = stmt.run(name, description, ownerId);
    
    const project = db.prepare('SELECT * FROM projects WHERE id = ?')
      .get(result.lastInsertRowid) as Project;
    
    return project;
  } catch (error) {
    console.error('Error creating project:', error);
    return null;
  }
}

// Get all projects for a user (owned or collaborated)
export function getUserProjects(userId: number): ProjectWithOwner[] {
  const db = getDatabase();
  
  try {
    const stmt = db.prepare(`
      SELECT DISTINCT p.*, u.username as owner_username
      FROM projects p
      JOIN users u ON p.owner_id = u.id
      LEFT JOIN project_collaborators pc ON p.id = pc.project_id
      WHERE p.owner_id = ? OR pc.user_id = ?
      ORDER BY p.updated_at DESC
    `);
    
    const projects = stmt.all(userId, userId) as ProjectWithOwner[];
    return projects;
  } catch (error) {
    console.error('Error getting user projects:', error);
    return [];
  }
}

// Get project by ID
export function getProjectById(projectId: number): ProjectWithOwner | null {
  const db = getDatabase();
  
  try {
    const stmt = db.prepare(`
      SELECT p.*, u.username as owner_username
      FROM projects p
      JOIN users u ON p.owner_id = u.id
      WHERE p.id = ?
    `);
    
    const project = stmt.get(projectId) as ProjectWithOwner | undefined;
    return project || null;
  } catch (error) {
    console.error('Error getting project:', error);
    return null;
  }
}

// Update project
export function updateProject(projectId: number, name?: string, description?: string): boolean {
  const db = getDatabase();
  
  try {
    if (name !== undefined && description !== undefined) {
      const stmt = db.prepare('UPDATE projects SET name = ?, description = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
      stmt.run(name, description, projectId);
    } else if (name !== undefined) {
      const stmt = db.prepare('UPDATE projects SET name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
      stmt.run(name, projectId);
    } else if (description !== undefined) {
      const stmt = db.prepare('UPDATE projects SET description = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
      stmt.run(description, projectId);
    }
    return true;
  } catch (error) {
    console.error('Error updating project:', error);
    return false;
  }
}

// Delete project
export function deleteProject(projectId: number, userId: number): boolean {
  const db = getDatabase();
  
  try {
    // Only owner can delete
    const stmt = db.prepare('DELETE FROM projects WHERE id = ? AND owner_id = ?');
    const result = stmt.run(projectId, userId);
    return result.changes > 0;
  } catch (error) {
    console.error('Error deleting project:', error);
    return false;
  }
}

// Check if user has access to project
export function userHasAccess(projectId: number, userId: number): boolean {
  const db = getDatabase();
  
  try {
    const stmt = db.prepare(`
      SELECT COUNT(*) as count
      FROM projects p
      LEFT JOIN project_collaborators pc ON p.id = pc.project_id
      WHERE p.id = ? AND (p.owner_id = ? OR pc.user_id = ?)
    `);
    
    const result = stmt.get(projectId, userId, userId) as { count: number };
    return result.count > 0;
  } catch (error) {
    console.error('Error checking access:', error);
    return false;
  }
}

// Check if user is owner
export function isProjectOwner(projectId: number, userId: number): boolean {
  const db = getDatabase();
  
  try {
    const stmt = db.prepare('SELECT COUNT(*) as count FROM projects WHERE id = ? AND owner_id = ?');
    const result = stmt.get(projectId, userId) as { count: number };
    return result.count > 0;
  } catch (error) {
    console.error('Error checking ownership:', error);
    return false;
  }
}
