// app/api/videos/[videoId]/comments/route.js
import prisma from '@/app/lib/prisma';
import { verify } from 'jsonwebtoken';
import { NextResponse } from 'next/server';

// GET - Fetch all comments for a video
export async function GET(req, { params }) {
  try {
    const token = req.cookies.get('token')?.value;
    // if (!token) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    const { videoId } = await params;

    const comments = await prisma.comment.findMany({
      where: { videoId },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        resolver: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        replies: {
          include: {
            employee: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, comments });
  } catch (error) {
    console.error('Error fetching comments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch comments' },
      { status: 500 }
    );
  }
}

// POST - Create a new comment
// export async function POST(req, { params }) {
//   try {
//     const token = req.cookies.get('token')?.value;
//     if (!token) {
//       return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
//     }

//     const decoded = verify(token, process.env.JWT_SECRET);
//     const { videoId } = await params;
    
//     // FIX: Destructure priority from the request body here
//     const { content, timestamp, parentId, priority } = await req.json();

//     const comment = await prisma.comment.create({
//       data: {
//         videoId,
//         employeeId: decoded.id,
//         content,
//         timestamp: timestamp || null,
//         parentId: parentId || null,
//         priority: priority || 'NONE' // Use the variable now that it is defined, defaulting to 'NONE'
//       },
//       include: {
//         employee: {
//           select: {
//             firstName: true,
//             lastName: true,
//           },
//         },
//       },
//     });

//     return NextResponse.json({ success: true, comment });
//   } catch (error) {
//     console.error('Error creating comment:', error);
//     return NextResponse.json(
//       { error: 'Failed to create comment' },
//       { status: 500 }
//     );
//   }
// }

export async function POST(req, { params }) {
  try {
    const { videoId } = await params;
    const body = await req.json();
    
    // Destructure inputs
    const { content, timestamp, parentId, priority, isGuest, guestName } = body;

    let employeeId = null;
    let finalGuestName = null;

    // --- AUTH LOGIC ---
    if (isGuest) {
      // Guest Mode: No token check needed
      // Ensure your schema supports this! (employeeId needs to be optional)
      finalGuestName = guestName || "Guest User";
    } else {
      // Employee Mode: Verify Token
      const token = req.cookies.get('token')?.value;
      if (!token) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      try {
        const decoded = verify(token, process.env.JWT_SECRET);
        employeeId = decoded.id;
      } catch (err) {
        return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
      }
    }

    // --- CREATE COMMENT ---
    const comment = await prisma.comment.create({
      data: {
        videoId,
        content,
        timestamp: timestamp || null,
        parentId: parentId || null,
        priority: priority || 'NONE',
        
        // Handle Author Assignment
        ...(employeeId ? { employeeId } : {}), // Only add if exists
        ...(finalGuestName ? { guestName: finalGuestName } : {}), // Add guest name if guest
      },
      include: {
        employee: { // Only returns data if employeeId exists
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, comment });

  } catch (error) {
    console.error('Error creating comment:', error);
    return NextResponse.json(
      { error: 'Failed to create comment' },
      { status: 500 }
    );
  }
}
