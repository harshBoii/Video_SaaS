import { NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';
import { verify } from 'jsonwebtoken';

export async function GET(request, { params }) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    verify(token, process.env.JWT_SECRET);
    const { versionId } = await params;

    const version = await prisma.videoVersion.findUnique({
      where: { id: versionId },
      include: {
        uploader: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    if (!version) {
      return NextResponse.json({ error: 'Version not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      version: {
        ...version,
        fileSize: version.fileSize.toString()
      }
    });
  } catch (error) {
    console.error('Version fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch version' }, { status: 500 });
  }
}

// DELETE - Archive version
export async function DELETE(request, { params }) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    verify(token, process.env.JWT_SECRET);
    const { versionId } = await params;

    // Check if it's the active version
    const version = await prisma.videoVersion.findUnique({
      where: { id: versionId },
      select: { isActive: true }
    });

    if (version?.isActive) {
      return NextResponse.json({ 
        error: 'Cannot delete active version' 
      }, { status: 400 });
    }

    await prisma.videoVersion.update({
      where: { id: versionId },
      data: { status: 'deleted' }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Version deletion error:', error);
    return NextResponse.json({ error: 'Failed to delete version' }, { status: 500 });
  }
}
