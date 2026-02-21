import { NextRequest, NextResponse } from 'next/server';
import { 
  validateSession, 
  createShareLink, 
  getProjectShareLinks,
  deleteShareLink,
  isProjectOwner,
  getShareLinkByToken
} from '@/database';

// GET all share links for a project
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
    const shareLinks = getProjectShareLinks(projectId);

    return NextResponse.json(
      { shareLinks },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get share links error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST create share link
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
        { error: 'Only project owner can create share links' },
        { status: 403 }
      );
    }

    const { permissions = 'view', expiresInDays } = await request.json();

    const shareLink = createShareLink(projectId, permissions, expiresInDays);

    if (!shareLink) {
      return NextResponse.json(
        { error: 'Failed to create share link' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { 
        success: true,
        shareLink 
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create share link error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE share link
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
        { error: 'Only project owner can delete share links' },
        { status: 403 }
      );
    }

    const { shareId } = await request.json();

    if (!shareId) {
      return NextResponse.json(
        { error: 'Share ID is required' },
        { status: 400 }
      );
    }

    const success = deleteShareLink(shareId);

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to delete share link' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true },
      { status: 200 }
    );
  } catch (error) {
    console.error('Delete share link error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
