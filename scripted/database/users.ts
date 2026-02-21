import { getDatabase } from './db';
import crypto from 'crypto';

export interface User {
  id: number;
  username: string;
  email?: string;
  created_at: string;
}

export interface UserWithPassword extends User {
  password: string;
}

// Hash password (in production, use bcrypt or similar)
function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// Generate session token
function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

// Create new user (signup)
export function createUser(username: string, password: string, email?: string): User | null {
  const db = getDatabase();
  
  try {
    const hashedPassword = hashPassword(password);
    const stmt = db.prepare('INSERT INTO users (username, password, email) VALUES (?, ?, ?)');
    const result = stmt.run(username, hashedPassword, email);
    
    const user = db.prepare('SELECT id, username, email, created_at FROM users WHERE id = ?')
      .get(result.lastInsertRowid) as User;
    
    return user;
  } catch (error) {
    console.error('Error creating user:', error);
    return null;
  }
}

// Authenticate user (login)
export function authenticateUser(username: string, password: string): User | null {
  const db = getDatabase();
  
  try {
    const hashedPassword = hashPassword(password);
    const stmt = db.prepare('SELECT id, username, email, created_at FROM users WHERE username = ? AND password = ?');
    const user = stmt.get(username, hashedPassword) as User | undefined;
    
    return user || null;
  } catch (error) {
    console.error('Error authenticating user:', error);
    return null;
  }
}

// Create session
export function createSession(userId: number): string | null {
  const db = getDatabase();
  
  try {
    const token = generateToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days
    
    const stmt = db.prepare('INSERT INTO sessions (user_id, token, expires_at) VALUES (?, ?, ?)');
    stmt.run(userId, token, expiresAt.toISOString());
    
    return token;
  } catch (error) {
    console.error('Error creating session:', error);
    return null;
  }
}

// Validate session
export function validateSession(token: string): User | null {
  const db = getDatabase();
  
  try {
    const stmt = db.prepare(`
      SELECT u.id, u.username, u.email, u.created_at 
      FROM sessions s
      JOIN users u ON s.user_id = u.id
      WHERE s.token = ? AND s.expires_at > datetime('now')
    `);
    
    const user = stmt.get(token) as User | undefined;
    return user || null;
  } catch (error) {
    console.error('Error validating session:', error);
    return null;
  }
}

// Delete session (logout)
export function deleteSession(token: string): boolean {
  const db = getDatabase();
  
  try {
    const stmt = db.prepare('DELETE FROM sessions WHERE token = ?');
    stmt.run(token);
    return true;
  } catch (error) {
    console.error('Error deleting session:', error);
    return false;
  }
}

// Get user by ID
export function getUserById(userId: number): User | null {
  const db = getDatabase();
  
  try {
    const stmt = db.prepare('SELECT id, username, email, created_at FROM users WHERE id = ?');
    const user = stmt.get(userId) as User | undefined;
    return user || null;
  } catch (error) {
    console.error('Error getting user:', error);
    return null;
  }
}

// Check if username exists
export function usernameExists(username: string): boolean {
  const db = getDatabase();
  
  try {
    const stmt = db.prepare('SELECT COUNT(*) as count FROM users WHERE username = ?');
    const result = stmt.get(username) as { count: number };
    return result.count > 0;
  } catch (error) {
    console.error('Error checking username:', error);
    return false;
  }
}
