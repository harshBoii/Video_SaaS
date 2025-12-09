import { NextResponse } from 'next/server';
import { verify } from 'jsonwebtoken';
import prisma from '@/app/lib/prisma';
import { cookies } from 'next/headers';

// Helper function to extract company from JWT token
async function getCompanyFromToken(request) {
  try {
    const token = (await cookies()).get("token")?.value;
    
    if (!token) {
      return null;
    }
    
    const decoded = verify(token, process.env.JWT_SECRET);
    return decoded.companyId;
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}

// Platforms that support redirect_url and headless mode
const PLATFORMS_WITH_REDIRECT = ['facebook', 'linkedin', 'googlebusiness'];

// Valid platform values
const VALID_PLATFORMS = [
  'facebook',
  'instagram',
  'linkedin',
  'twitter',
  'tiktok',
  'youtube',
  'threads',
  'reddit',
  'pinterest',
  'bluesky',
  'googlebusiness'
];

// GET: Initiate OAuth connection for a platform
export async function GET(request, { params }) {
  try {
    const companyId = await getCompanyFromToken(request);
    
    if (!companyId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get platform from route params
    const { platform } = await params;

    // Validate platform
    if (!platform || !VALID_PLATFORMS.includes(platform.toLowerCase())) {
      return NextResponse.json(
        { 
          error: 'Invalid platform',
          validPlatforms: VALID_PLATFORMS
        },
        { status: 400 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const redirectUrl = searchParams.get('redirect_url');
    const headless = searchParams.get('headless');

    // Get company's Late profile from database
    const profile = await prisma.lateProfile.findUnique({
      where: { companyId },
      select: {
        lateId: true,
        name: true
      }
    });

    if (!profile) {
      return NextResponse.json(
        { error: 'Profile not found. Please create a profile first.' },
        { status: 404 }
      );
    }

    // Build query parameters for Late API
    const lateQueryParams = new URLSearchParams({
      profileId: profile.lateId
    });

    // Add redirect_url only for supported platforms
    if (redirectUrl && PLATFORMS_WITH_REDIRECT.includes(platform.toLowerCase())) {
      lateQueryParams.append('redirect_url', redirectUrl);
    }

    // Add headless mode if requested (only for Facebook, LinkedIn, Google Business)
    if (headless === 'true' && PLATFORMS_WITH_REDIRECT.includes(platform.toLowerCase())) {
      lateQueryParams.append('headless', 'true');
    }

    // Call Late API
    const lateApiUrl = `https://getlate.dev/api/v1/connect/${platform}?${lateQueryParams}`;
    
    const response = await fetch(lateApiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.LATE_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Failed to initiate ${platform} connection`);
    }

    const data = await response.json();

    // Return authorization URL to client
    return NextResponse.json({
      success: true,
      authorizationUrl: data.authUrl || data.authorizationUrl,
      platform: platform,
      profileId: profile.lateId
    });

  } catch (error) {
    console.error('Connection error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to initiate connection' },
      { status: 500 }
    );
  }
}
