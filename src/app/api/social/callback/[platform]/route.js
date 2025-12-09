import { NextResponse } from 'next/server';
import { verify } from 'jsonwebtoken';
import prisma from '@/app/lib/prisma';
import { cookies } from 'next/headers';

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

// GET: Handle OAuth callback
export async function GET(request, { params }) {
  try {
    const companyId = await getCompanyFromToken(request);
    
    if (!companyId) {
      // Redirect to login if not authenticated
      return NextResponse.redirect(new URL('/login?error=unauthorized', request.url));
    }

    const { platform } = params;
    const { searchParams } = new URL(request.url);
    
    // Get OAuth response parameters
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');

    // Handle OAuth errors
    if (error) {
      console.error('OAuth error:', error, errorDescription);
      return NextResponse.redirect(
        new URL(`/admin/integration?error=${error}&message=${encodeURIComponent(errorDescription || 'OAuth failed')}`, request.url)
      );
    }

    // Validate required parameters
    if (!code || !state) {
      return NextResponse.redirect(
        new URL('/admin/integration?error=missing_params&message=Missing code or state', request.url)
      );
    }

    // Get profile from database
    const profile = await prisma.lateProfile.findUnique({
      where: { companyId },
      select: { lateId: true, id: true }
    });

    if (!profile) {
      return NextResponse.redirect(
        new URL('/admin/integration?error=no_profile&message=Profile not found', request.url)
      );
    }

    // Complete OAuth exchange with Late API
    const lateResponse = await fetch(
      `https://getlate.dev/api/v1/connect/${platform}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.LATE_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          code: code,
          state: state,
          profileId: profile.lateId
        })
      }
    );

    if (!lateResponse.ok) {
      const errorData = await lateResponse.json().catch(() => ({}));
      console.error('Late API error:', errorData);
      return NextResponse.redirect(
        new URL(`/admin/integration?error=api_error&message=${encodeURIComponent(errorData.message || 'Failed to connect account')}`, request.url)
      );
    }

    const connectionData = await lateResponse.json();
    console.log('Connection successful:', connectionData);

    // Save connected account to database
    const savedAccount = await prisma.socialAccount.create({
      data: {
        lateProfileId: profile.id,
        platform: platform.toUpperCase(),
        accountId: connectionData.account?.id || connectionData.accountId,
        username: connectionData.account?.username || connectionData.username,
        displayName: connectionData.account?.displayName || connectionData.displayName || connectionData.account?.name,
        avatarUrl: connectionData.account?.avatarUrl || connectionData.account?.profilePictureUrl,
        accessToken: connectionData.accessToken,
        refreshToken: connectionData.refreshToken,
        tokenExpiresAt: connectionData.expiresAt ? new Date(connectionData.expiresAt) : null,
        isActive: true,
        metadata: connectionData.account || {}
      }
    });

    console.log('Account saved to database:', savedAccount);

    // Redirect to success page
    return NextResponse.redirect(
      new URL(`/admin/integration?success=true&platform=${platform}&account=${savedAccount.username}`, request.url)
    );

  } catch (error) {
    console.error('Callback error:', error);
    return NextResponse.redirect(
      new URL(`/admin/integration?error=server_error&message=${encodeURIComponent(error.message)}`, request.url)
    );
  }
}
