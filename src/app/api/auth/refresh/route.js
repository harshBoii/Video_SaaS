import { NextResponse } from 'next/server';
import { getAuthUser, generateToken } from '@/app/lib/auth';
import prisma from '@/app/lib/prisma';

export async function POST(request) {
  try {
    const user = await getAuthUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // Fetch fresh user data with permissions
    const freshUser = await prisma.employee.findUnique({
      where: { id: user.id },
      include: {
        role: {
          include: {
            permissions: { include: { permission: true } }
          }
        }
      }
    });

    if (!freshUser || freshUser.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'User not found or inactive' },
        { status: 401 }
      );
    }

    // Generate new token
    const newToken = generateToken(freshUser);

    const response = NextResponse.json({
      message: 'Token refreshed successfully',
      token: newToken,
    });

    // Set new token cookie
    response.cookies.set('token', newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 60 * 60, // 1 hour
    });

    return response;

  } catch (error) {
    console.error('Token refresh error:', error);
    return NextResponse.json(
      { error: 'Failed to refresh token' },
      { status: 500 }
    );
  }
}
