// app/api/analytics/track/route.js
import { NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';
import { headers } from 'next/headers';

// Helper to detect device info from User-Agent (simplified)
const parseUserAgent = (uaString) => {
  const ua = uaString.toLowerCase();
  let browser = 'Unknown';
  let os = 'Unknown';
  let deviceType = 'desktop';

  if (ua.includes('firefox')) browser = 'Firefox';
  else if (ua.includes('chrome')) browser = 'Chrome';
  else if (ua.includes('safari')) browser = 'Safari';
  else if (ua.includes('edge')) browser = 'Edge';

  if (ua.includes('iphone') || ua.includes('android')) deviceType = 'mobile';
  else if (ua.includes('ipad')) deviceType = 'tablet';

  if (ua.includes('windows')) os = 'Windows';
  else if (ua.includes('mac os')) os = 'macOS';
  else if (ua.includes('linux')) os = 'Linux';
  else if (ua.includes('android')) os = 'Android';
  else if (ua.includes('ios')) os = 'iOS';

  return { browser, os, deviceType };
};

export async function POST(request) {
  try {
    const body = await request.json();
    const { 
      videoId, 
      viewId, // Existing session ID if update
      viewerId, // Optional: Logged in user ID
      viewerEmail, // Optional: From tracking link
      anonymousId, // Fingerprint for non-logged users
      watchDuration, // Total seconds watched so far
      percentage, // 0-100
      segment // { start: 0, end: 5 } - Currently watched segment
    } = body;

    if (!videoId) {
      return NextResponse.json({ error: 'Video ID required' }, { status: 400 });
    }

    // Get Request Context
    const headersList = await headers();
    const userAgent = headersList.get('user-agent') || '';
    const ip = headersList.get('x-forwarded-for') || '127.0.0.1'; // Simple IP extraction
    
    const { browser, os, deviceType } = parseUserAgent(userAgent);

    // 1. Create or Update View Session
    let currentView;

    if (viewId) {
      // Update existing session
      currentView = await prisma.videoView.update({
        where: { id: viewId },
        data: {
          watchDuration: { increment: 5 }, // Add heartbeat interval (approx)
          percentage: percentage > 0 ? percentage : undefined, // Only update if greater
          completed: percentage >= 95,
          updatedAt: new Date(),
        },
      });
    } else {
      // Create new session (First heartbeat)
      currentView = await prisma.videoView.create({
        data: {
          videoId,
          viewerId,
          viewerEmail,
          anonymousId,
          ipAddress: ip,
          userAgent,
          browser,
          os,
          deviceType,
          watchDuration: 0,
          percentage: 0,
        },
      });
    }

    // 2. Record Heatmap Segment (The "Where")
    // We store small chunks to build the heatmap later
    if (segment && segment.end > segment.start) {
      await prisma.videoHeatmap.create({
        data: {
          viewId: currentView.id,
          videoId,
          startTime: Math.floor(segment.start),
          endTime: Math.floor(segment.end),
        },
      });
    }

    return NextResponse.json({ 
      success: true, 
      viewId: currentView.id // Return ID so client sends it in next heartbeat
    });

  } catch (error) {
    console.error('Analytics Tracking Error:', error);
    return NextResponse.json({ error: 'Tracking failed' }, { status: 500 });
  }
}
