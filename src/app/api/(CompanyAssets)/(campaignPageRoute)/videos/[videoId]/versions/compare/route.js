import { NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';
import { verify } from 'jsonwebtoken';

export async function POST(request, { params }) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    verify(token, process.env.JWT_SECRET);
    const { videoId } = await params;
    const { versionIds } = await request.json(); // [versionId1, versionId2]

    if (!versionIds || versionIds.length !== 2) {
      return NextResponse.json({ 
        error: 'Exactly 2 version IDs required' 
      }, { status: 400 });
    }

    // Fetch both versions with related data
    const versions = await prisma.videoVersion.findMany({
      where: {
        id: { in: versionIds },
        videoId
      },
      include: {
        uploader: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        },
        video: {
          select: {
            title: true,
            comments: {
              where: {
                // Optional: filter comments by version if you added versionNumber field
                OR: [
                  { versionNumber: null }, // Comments without version (show on all)
                  // { versionNumber: { in: [version1.version, version2.version] } }
                ]
              },
              include: {
                employee: {
                  select: {
                    firstName: true,
                    lastName: true
                  }
                }
              },
              orderBy: { createdAt: 'desc' }
            }
          }
        }
      }
    });

    if (versions.length !== 2) {
      return NextResponse.json({ 
        error: 'One or both versions not found' 
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      comparison: {
        versions: versions.map(v => ({
          ...v,
          fileSize: v.fileSize.toString(),
          uploaderName: `${v.uploader.firstName} ${v.uploader.lastName}`
        })),
        comments: versions[0].video.comments,
        videoTitle: versions[0].video.title
      }
    });
  } catch (error) {
    console.error('Comparison fetch error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch comparison data' 
    }, { status: 500 });
  }
}
