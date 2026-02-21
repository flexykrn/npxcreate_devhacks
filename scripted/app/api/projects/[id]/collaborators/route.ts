import { NextRequest, NextResponse } from 'next/server';
import { 
  validateSession, 
  getProjectCollaborators, 
  addCollaborator, 
  removeCollaborator,
  updateCollaboratorRole,
  isProjectOwner,
  usernameExists,
  getUserById
} from '@/database';
import { getDatabase } from '@/database';

// GET all collaborators for a project
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.cookies.get('session_token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const user = validateSession(token);

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid session' },
        { status: 401 }
      );
    }

    const projectId = parseInt(params.id);
    const collaborators = getProjectCollaborators(projectId);

    return NextResponse.json(
      { collaborators },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get collaborators error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST add collaborator
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.cookies.get('session_token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const user = validateSession(token);

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid session' },
        { status: 401 }
      );
    }

    const projectId = parseInt(params.id);

    if (!isProjectOwner(projectId, user.id)) {
      return NextResponse.json(
        { error: 'Only project owner can add collaborators' },
        { status: 403 }
      );
    }

    const { username, role = 'viewer' } = await request.json();

    if (!username) {
      return NextResponse.json(
        { error: 'Username is required' },
        { status: 400 }
      );
    }

    // Get user by username
    const db = getDatabase();
    const stmt = db.prepare('SELECT id FROM users WHERE username = ?');
    const targetUser = stmt.get(username) as { id: number } | undefined;

    if (!targetUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const success = addCollaborator(projectId, targetUser.id, role);

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to add collaborator (may already exist)' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true },
      { status: 201 }
    );
  } catch (error) {
    console.error('Add collaborator error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE remove collaborator
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.cookies.get('session_token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const user = validateSession(token);

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid session' },
        { status: 401 }
      );
    }

    const projectId = parseInt(params.id);

    if (!isProjectOwner(projectId, user.id)) {
      return NextResponse.json(
        { error: 'Only project owner can remove collaborators' },
        { status: 403 }
      );
    }

    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const success = removeCollaborator(projectId, userId);

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to remove collaborator' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true },
      { status: 200 }
    );
  } catch (error) {
    console.error('Remove collaborator error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH update collaborator role
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.cookies.get('session_token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const user = validateSession(token);

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid session' },
        { status: 401 }
      );
    }

    const projectId = parseInt(params.id);

    if (!isProjectOwner(projectId, user.id)) {
      return NextResponse.json(
        { error: 'Only project owner can update roles' },
        { status: 403 }
      );
    }

    const { userId, role } = await request.json();

    if (!userId || !role) {
      return NextResponse.json(
        { error: 'User ID and role are required' },
        { status: 400 }
      );
    }

    const success = updateCollaboratorRole(projectId, userId, role);

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to update role' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true },
      { status: 200 }
    );
  } catch (error) {
    console.error('Update collaborator role error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
