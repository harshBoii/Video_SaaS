import { NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';
import { getCompanyFromToken } from '@/app/lib/auth'; // Your auth helper
import { verify } from 'jsonwebtoken';
export async function GET(request) {
  try {
    const companyId = await getCompanyFromToken(request);
    
    if (!companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get Late profile for this company
    const profile = await prisma.lateProfile.findUnique({
      where: { companyId },
      select: { lateId: true }
    });

    if (!profile) {
      return NextResponse.json(
        { error: 'Profile not found. Please create a Late profile first.' },
        { status: 404 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const queryParams = {
      page: searchParams.get('page') || '1',
      limit: searchParams.get('limit') || '10',
      status: searchParams.get('status'),
      platform: searchParams.get('platform'),
      profileId: profile.lateId, // Always filter by user's profile
      createdBy: searchParams.get('createdBy'),
      dateFrom: searchParams.get('dateFrom'),
      dateTo: searchParams.get('dateTo'),
      includeHidden: searchParams.get('includeHidden') || 'false'
    };

    // Remove null/undefined values
    Object.keys(queryParams).forEach(key => {
      if (queryParams[key] === null || queryParams[key] === undefined) {
        delete queryParams[key];
      }
    });

    // Build query string
    const queryString = new URLSearchParams(queryParams).toString();

    // Fetch posts from Late API
    const response = await fetch(
      `https://getlate.dev/api/v1/posts?${queryString}`,
      {
        headers: {
          'Authorization': `Bearer ${process.env.LATE_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to fetch posts');
    }

    const data = await response.json();
    console.log("Data is :",data)
    return NextResponse.json({
      success: true,
      posts: data.posts || [],
      pagination: data.pagination || {
        page: parseInt(queryParams.page),
        limit: parseInt(queryParams.limit),
        total: 0,
        pages: 0
      }
    });

  } catch (error) {
    console.error('Failed to fetch posts:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch posts' },
      { status: 500 }
    );
  }
}
