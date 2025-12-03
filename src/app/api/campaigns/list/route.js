import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/app/lib/auth';
import prisma from '@/app/lib/prisma';

export async function GET(request) {
  const { authenticated, user, error } = await authenticateRequest(request);
  if (!authenticated) return error;

  try {
    const campaigns = await prisma.campaign.findMany({
      where: {
        companyId: user.companyId,
        status: 'active',
        OR: [
          { adminId: user.id },
          { assignments: { some: { employeeId: user.id } } }
        ]
      },
      select: {
        id: true,
        name: true,
        _count: {
          select: { videos: true }
        }
      },
      orderBy: { name: 'asc' }
    });

    return NextResponse.json({
      success: true,
      campaigns: campaigns.map(c => ({
        id: c.id,
        name: c.name,
        videoCount: c._count.videos
      }))
    });

  } catch (error) {
    console.error('[CAMPAIGNS LIST ERROR]', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch campaigns' },
      { status: 500 }
    );
  }
}
