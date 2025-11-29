import { NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';
import { verify } from 'jsonwebtoken';

// GET - Fetch description (public or authenticated)
export async function GET(request, { params }) {
  try {
    const { videoId } = await params;

    const description = await prisma.videoDescription.findUnique({
      where: { videoId }
    });

    if (!description) {
      return NextResponse.json({ 
        success: true, 
        description: { content: '', chapters: [] } 
      });
    }

    return NextResponse.json({ 
      success: true, 
      description 
    });
  } catch (error) {
    console.error('Description Fetch Error:', error);
    return NextResponse.json({ error: 'Failed to fetch description' }, { status: 500 });
  }
}

// POST/PUT - Create or update description (authenticated only)
export async function POST(request, { params }) {
  try {
    // Verify authentication
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verify(token, process.env.JWT_SECRET);
    
    const { videoId } = await params;
    const { content } = await request.json();

    if (!content && content !== '') {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    // Extract chapters from timestamps in format [0:00] Chapter Title
    const chapters = extractChapters(content);

    const description = await prisma.videoDescription.upsert({
      where: { videoId },
      update: { 
        content, 
        chapters: chapters.length > 0 ? chapters : null 
      },
      create: { 
        videoId, 
        content, 
        chapters: chapters.length > 0 ? chapters : null 
      }
    });

    return NextResponse.json({ 
      success: true, 
      description 
    });
  } catch (error) {
    console.error('Description Update Error:', error);
    return NextResponse.json({ error: 'Failed to update description' }, { status: 500 });
  }
}

// DELETE - Remove description (authenticated only)
export async function DELETE(request, { params }) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    verify(token, process.env.JWT_SECRET);
    
    const { videoId } = await params;

    await prisma.videoDescription.delete({
      where: { videoId }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Description Delete Error:', error);
    return NextResponse.json({ error: 'Failed to delete description' }, { status: 500 });
  }
}

// Helper: Extract chapters from content
function extractChapters(content) {
  const chapters = [];
  const lines = content.split('\n');
  
  // Match patterns like [0:00] Chapter Title or [1:23:45] Chapter Title
  const timestampRegex = /\[(\d{1,2}):(\d{2})(?::(\d{2}))?\]\s*(.+)/;
  
  for (const line of lines) {
    const match = line.match(timestampRegex);
    if (match) {
      const hours = match[3] ? parseInt(match[1]) : 0;
      const minutes = match[3] ? parseInt(match[2]) : parseInt(match[1]);
      const seconds = match[3] ? parseInt(match[3]) : parseInt(match[2]);
      const title = match[4].trim();
      
      const timeInSeconds = match[3] 
        ? hours * 3600 + minutes * 60 + seconds 
        : minutes * 60 + seconds;
      
      chapters.push({
        time: timeInSeconds,
        title,
        timestamp: match[3] ? `${match[1]}:${match[2]}:${match[3]}` : `${match[1]}:${match[2]}`
      });
    }
  }
  
  return chapters.sort((a, b) => a.time - b.time);
}
