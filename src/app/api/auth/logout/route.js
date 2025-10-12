import { NextResponse } from 'next/server';

export async function POST(request) {
  const response = NextResponse.json({ 
    message: 'Logged out successfully' 
  });

  // Clear the token cookie
  response.cookies.set('token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 0, // Expire immediately
  });

  return response;
}
