// do not cache , invalidation is a trouble
//api/employees/campaign
import { NextResponse } from 'next/server';
import { verify } from 'jsonwebtoken';
import prisma from '@/app/lib/prisma';

export async function GET(req) {
  try {
    // 1. Verify Authentication
    const token = req.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verify(token, process.env.JWT_SECRET);
    const employeeId = decoded.id;

    // 2. Fetch Campaigns assigned to this employee
    const assignments = await prisma.campaignAssignment.findMany({
      where: {
        employeeId: employeeId
      },
      include: {
        role: true, // To show what role they play in this campaign (e.g. Editor, Viewer)
        campaign: {
          include: {
            assignments: true, // To count total members
            videos: {
              where: { status: 'ready' } // To count completed videos or calculate progress
            }
          }
        }
      },
      orderBy: {
        joinedAt: 'desc'
      }
    });

    // 3. Format Data for Frontend
    const campaigns = assignments.map((assignment) => {
      const c = assignment.campaign;
      
      // Calculate progress based on videos or your specific logic
      // Example logic: (videos ready / total videos expected) * 100
      // For now, I'll generate a semi-random progress based on video count for visual effect
      const progress = Math.min(100, (c.videos.length * 10)); 

      return {
        id: c.id,
        name: c.name,
        role: assignment.role.name, // "Editor", "Reviewer", etc.
        status: c.status, // 'active', 'archived', etc.
        dueDate: c.updatedAt, // Or a specific dueDate field if you add one to schema
        members: c.assignments.length,
        videos: c.videos.length,
        progress: progress,
        joinedAt: assignment.joinedAt
      };
    });

    return NextResponse.json({ success: true, campaigns });

  } catch (error) {
    console.error('Error fetching employee campaigns:', error);
    return NextResponse.json(
      { error: 'Failed to fetch campaigns' },
      { status: 500 }
    );
  }
}
