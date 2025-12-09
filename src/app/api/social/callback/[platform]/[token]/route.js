// /app/api/social/callback/[platform]/[token]/route.js

import { NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';

export async function GET(request, { params }) {
  try {
    const { platform, token } = await params;
    const { searchParams } = new URL(request.url);
    

    const connected = searchParams.get('connected');
    const profileId = searchParams.get('profileId');
    const username = searchParams.get('username');
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');

    console.log('📥 Callback received:', { platform, token, connected, profileId, username });

    // Validate token
    if (!token) {
      console.error('❌ No token in callback');
      return NextResponse.redirect(
        new URL('/admin/integration?error=missing_token', request.url)
      );
    }

    // Verify and get connection token
    const connectionToken = await prisma.connectionToken.findUnique({
      where: { token }
    });

    if (!connectionToken) {
      console.error('❌ Invalid token:', token);
      return NextResponse.redirect(
        new URL('/admin/integration?error=invalid_token', request.url)
      );
    }

    // Check if expired
    if (new Date() > connectionToken.expiresAt) {
      console.error('❌ Token expired');
      await prisma.connectionToken.delete({ where: { token } });
      return NextResponse.redirect(
        new URL('/admin/integration?error=token_expired', request.url)
      );
    }

    // Validate platform matches
    if (connectionToken.platform !== platform) {
      console.error('❌ Platform mismatch');
      return NextResponse.redirect(
        new URL('/admin/integration?error=platform_mismatch', request.url)
      );
    }

    const companyId = connectionToken.companyId;
    console.log('✅ Valid token for companyId:', companyId);

    // Handle OAuth errors
    if (error) {
      console.error('OAuth error:', error, errorDescription);
      await prisma.connectionToken.delete({ where: { token } });
      return NextResponse.redirect(
        new URL(`/admin/integration?error=${error}&message=${encodeURIComponent(errorDescription || 'OAuth failed')}`, request.url)
      );
    }

    // Get profile from database
    const profile = await prisma.lateProfile.findUnique({
      where: { companyId },
      select: { lateId: true, id: true }
    });

    if (!profile) {
      console.error('❌ Profile not found for companyId:', companyId);
      await prisma.connectionToken.delete({ where: { token } });
      return NextResponse.redirect(
        new URL('/admin/integration?error=no_profile&message=Profile not found', request.url)
      );
    }


// Connection completed by Late API
    if (username) {
    console.log('✅ Connection completed, saving account...');
    
    try {
        // ✅ Save with available info only
        const savedAccount = await prisma.socialAccount.upsert({
        where: {
            profileId_platform: {
            profileId: profile.id,
            platform: platform.toUpperCase()
            }
        },
        update: {
            username: username,
            displayName: username, // Fallback to username
            isActive: true
        },
        create: {
            profileId: profile.id,
            companyId: companyId,
            platform: platform.toUpperCase(),
            username: username,
            displayName: username, // Fallback to username
            isActive: true

        }
        });

        console.log('✅ Account saved:', savedAccount);


        await prisma.connectionToken.delete({ where: { token } });

        return NextResponse.redirect(
        new URL(`/admin/integration?success=true&platform=${platform}&account=${username}`, request.url)
        );

    } catch (error) {
        console.error('❌ Failed to save account:', error);
        
        await prisma.connectionToken.delete({ where: { token } }).catch(() => {});
        
        return NextResponse.redirect(
        new URL(`/admin/integration?error=save_failed&message=${encodeURIComponent(error.message)}`, request.url)
        );
    }
    }

    // Fallback success
    await prisma.connectionToken.delete({ where: { token } });
    return NextResponse.redirect(
      new URL(`/admin/integration?success=true&platform=${platform}`, request.url)
    );

  } catch (error) {
    console.error('❌ Callback error:', error);
    return NextResponse.redirect(
      new URL(`/admin/integration?error=server_error&message=${encodeURIComponent(error.message)}`, request.url)
    );
  }
}
