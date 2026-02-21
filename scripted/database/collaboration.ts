import { getDatabase } from './db';
import crypto from 'crypto';

export interface Collaborator {
  id: number;
  project_id: number;
  user_id: number;
  username: string;
  role: string;
  added_at: string;
}

export interface ShareLink {
  id: number;
  project_id: number;
  share_token: string;
  permissions: string;
  created_at: string;
  expires_at?: string;
}

// Generate share token
function generateShareToken(): string {
  return crypto.randomBytes(16).toString('hex');
}

// Add collaborator to project
export function addCollaborator(projectId: number, userId: number, role: string = 'viewer'): boolean {
  const db = getDatabase();
  
  try {
    const stmt = db.prepare('INSERT INTO project_collaborators (project_id, user_id, role) VALUES (?, ?, ?)');
    stmt.run(projectId, userId, role);
    return true;
  } catch (error) {
    console.error('Error adding collaborator:', error);
    return false;
  }
}

// Remove collaborator from project
export function removeCollaborator(projectId: number, userId: number): boolean {
  const db = getDatabase();
  
  try {
    const stmt = db.prepare('DELETE FROM project_collaborators WHERE project_id = ? AND user_id = ?');
    const result = stmt.run(projectId, userId);
    return result.changes > 0;
  } catch (error) {
    console.error('Error removing collaborator:', error);
    return false;
  }
}

// Get all collaborators for a project
export function getProjectCollaborators(projectId: number): Collaborator[] {
  const db = getDatabase();
  
  try {
    const stmt = db.prepare(`
      SELECT pc.*, u.username
      FROM project_collaborators pc
      JOIN users u ON pc.user_id = u.id
      WHERE pc.project_id = ?
      ORDER BY pc.added_at DESC
    `);
    
    const collaborators = stmt.all(projectId) as Collaborator[];
    return collaborators;
  } catch (error) {
    console.error('Error getting collaborators:', error);
    return [];
  }
}

// Update collaborator role
export function updateCollaboratorRole(projectId: number, userId: number, role: string): boolean {
  const db = getDatabase();
  
  try {
    const stmt = db.prepare('UPDATE project_collaborators SET role = ? WHERE project_id = ? AND user_id = ?');
    const result = stmt.run(role, projectId, userId);
    return result.changes > 0;
  } catch (error) {
    console.error('Error updating collaborator role:', error);
    return false;
  }
}

// Get collaborator role
export function getCollaboratorRole(projectId: number, userId: number): string | null {
  const db = getDatabase();
  
  try {
    const stmt = db.prepare('SELECT role FROM project_collaborators WHERE project_id = ? AND user_id = ?');
    const result = stmt.get(projectId, userId) as { role: string } | undefined;
    return result?.role || null;
  } catch (error) {
    console.error('Error getting collaborator role:', error);
    return null;
  }
}

// Create share link
export function createShareLink(projectId: number, permissions: string = 'view', expiresInDays?: number): ShareLink | null {
  const db = getDatabase();
  
  try {
    const token = generateShareToken();
    let expiresAt = null;
    
    if (expiresInDays) {
      const expires = new Date();
      expires.setDate(expires.getDate() + expiresInDays);
      expiresAt = expires.toISOString();
    }
    
    const stmt = db.prepare('INSERT INTO project_shares (project_id, share_token, permissions, expires_at) VALUES (?, ?, ?, ?)');
    const result = stmt.run(projectId, token, permissions, expiresAt);
    
    const shareLink = db.prepare('SELECT * FROM project_shares WHERE id = ?')
      .get(result.lastInsertRowid) as ShareLink;
    
    return shareLink;
  } catch (error) {
    console.error('Error creating share link:', error);
    return null;
  }
}

// Get share link by token
export function getShareLinkByToken(token: string): ShareLink | null {
  const db = getDatabase();
  
  try {
    const stmt = db.prepare(`
      SELECT * FROM project_shares 
      WHERE share_token = ? 
      AND (expires_at IS NULL OR expires_at > datetime('now'))
    `);
    
    const shareLink = stmt.get(token) as ShareLink | undefined;
    return shareLink || null;
  } catch (error) {
    console.error('Error getting share link:', error);
    return null;
  }
}

// Get all share links for a project
export function getProjectShareLinks(projectId: number): ShareLink[] {
  const db = getDatabase();
  
  try {
    const stmt = db.prepare(`
      SELECT * FROM project_shares 
      WHERE project_id = ?
      ORDER BY created_at DESC
    `);
    
    const shareLinks = stmt.all(projectId) as ShareLink[];
    return shareLinks;
  } catch (error) {
    console.error('Error getting share links:', error);
    return [];
  }
}

// Delete share link
export function deleteShareLink(shareId: number): boolean {
  const db = getDatabase();
  
  try {
    const stmt = db.prepare('DELETE FROM project_shares WHERE id = ?');
    const result = stmt.run(shareId);
    return result.changes > 0;
  } catch (error) {
    console.error('Error deleting share link:', error);
    return false;
  }
}

// Delete share link by token
export function deleteShareLinkByToken(token: string): boolean {
  const db = getDatabase();
  
  try {
    const stmt = db.prepare('DELETE FROM project_shares WHERE share_token = ?');
    const result = stmt.run(token);
    return result.changes > 0;
  } catch (error) {
    console.error('Error deleting share link:', error);
    return false;
  }
}
