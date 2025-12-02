import { NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';
import { cookies } from 'next/headers';
import { verify } from 'jsonwebtoken';

async function getUserFromToken() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    console.log('[PROFILE] Token exists:', !!token);
    if (!token) return null;
    const decoded = verify(token, process.env.JWT_SECRET);
    console.log('[PROFILE] Decoded user ID:', decoded.id);
    return decoded;
  } catch (err) {
    console.error('[PROFILE] Token error:', err.message);
    return null;
  }
}

// GET - Fetch profile
export async function GET() {
  try {
    console.log('[PROFILE] GET request started');
    
    const decoded = await getUserFromToken();
    if (!decoded || !decoded.id) {
      console.log('[PROFILE] Unauthorized - no valid token');
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const userId = decoded.id;
    console.log('[PROFILE] Fetching profile for user:', userId);

    const user = await prisma.employee.findUnique({
      where: { id: userId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        avatarUrl: true,
        status: true,
        isAdmin: true,
        lastLogin: true,
        // These might not exist in your schema - comment out if they don't
        // bio: true,
        // title: true,
        // phone: true,
        role: { select: { id: true, name: true } },
        department: { select: { id: true, name: true } },
        company: { select: { id: true, name: true } },
        _count: {
          select: {
            campaignAssignments: true,
            uploadedVideos: true,
            videoComments: true,
          }
        }
      }
    });

    console.log('[PROFILE] Query completed, user found:', !!user);

    if (!user) {
      return NextResponse.json({ success: false, error: 'Profile not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, profile: user });
  } catch (err) {
    console.error('[PROFILE] Error:', err);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error', 
      details: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    }, { status: 500 });
  }
}

// PATCH - Update profile
export async function PATCH(req) {
  try {
    const decoded = await getUserFromToken();
    if (!decoded || !decoded.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const userId = decoded.id;
    const body = await req.json();

    // Only update fields that exist in your schema
    const updateData = {};

    if (body.firstName !== undefined && body.firstName.trim()) {
      updateData.firstName = body.firstName.trim();
    }
    if (body.lastName !== undefined && body.lastName.trim()) {
      updateData.lastName = body.lastName.trim();
    }
    
    // Comment these out if they don't exist in your schema
    // if (body.phone !== undefined) updateData.phone = body.phone?.trim() || null;
    // if (body.bio !== undefined) updateData.bio = body.bio?.trim().slice(0, 500) || null;
    // if (body.title !== undefined) updateData.title = body.title?.trim() || null;
    if (body.avatarUrl !== undefined) updateData.avatarUrl = body.avatarUrl?.trim() || null;

    const updated = await prisma.employee.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        avatarUrl: true,
        status: true,
        isAdmin: true,
        lastLogin: true,
        // bio: true,
        // title: true,
        // phone: true,
        role: { select: { id: true, name: true } },
        department: { select: { id: true, name: true } },
        company: { select: { id: true, name: true, logoUrl: true } },
        _count: {
          select: {
            campaignAssignments: true,
            uploadedVideos: true,
            videoComments: true,
          }
        }
      }
    });

    return NextResponse.json({ success: true, profile: updated, message: 'Profile updated successfully' });
  } catch (err) {
    console.error('[PROFILE PATCH] Error:', err);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to update profile', 
      details: err.message 
    }, { status: 500 });
  }
}


// PATCH - Update profile. Only allow editing certain fields!
