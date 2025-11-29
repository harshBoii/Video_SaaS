// app/api/videos/[videoId]/analytics/route.js
import { NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';

export async function GET(request, { params }) {
  try {
    const { videoId } = params;

    // 1. Fetch Overview Stats
    const views = await prisma.videoView.findMany({
      where: { videoId },
      select: {
        id: true,
        watchDuration: true,
        percentage: true,
        completed: true,
        createdAt: true,
        deviceType: true,
        browser: true,
        location: true,
      }
    });

    const totalViews = views.length;
    const uniqueViewers = new Set(views.map(v => v.viewerId || v.anonymousId)).size;
    const completionRate = totalViews > 0 
      ? Math.round((views.filter(v => v.completed).length / totalViews) * 100) 
      : 0;
    const avgWatchTime = totalViews > 0
      ? Math.round(views.reduce((acc, v) => acc + v.watchDuration, 0) / totalViews)
      : 0;

    // 2. Build Heatmap Data (Aggregation)
    // We fetch all segments and "bucket" them into seconds to see overlap
    const heatmapSegments = await prisma.videoHeatmap.findMany({
      where: { videoId },
      select: { startTime: true, endTime: true }
    });

    // Create a frequency map: Second 1 -> 50 views, Second 2 -> 48 views...
    // This is CPU intensive for massive datasets, ideally done in SQL/ClickHouse for scale
    // But perfectly fine for typical SaaS usage.
    const engagementMap = {}; 
    let maxDuration = 0;

    heatmapSegments.forEach(seg => {
      if (seg.endTime > maxDuration) maxDuration = seg.endTime;
      for (let i = seg.startTime; i <= seg.endTime; i++) {
        engagementMap[i] = (engagementMap[i] || 0) + 1;
      }
    });

    const engagementGraph = [];
    for (let i = 0; i <= maxDuration; i++) {
      engagementGraph.push({
        second: i,
        count: engagementMap[i] || 0,
        retention: totalViews > 0 ? Math.round(((engagementMap[i] || 0) / totalViews) * 100) : 0
      });
    }

    // 3. Device Breakdown
    const devices = views.reduce((acc, v) => {
      acc[v.deviceType || 'desktop'] = (acc[v.deviceType || 'desktop'] || 0) + 1;
      return acc;
    }, {});

    return NextResponse.json({
      success: true,
      stats: {
        totalViews,
        uniqueViewers,
        completionRate,
        avgWatchTime,
      },
      engagementGraph, // Array for your chart (Recharts/Chart.js)
      devices,
    });

  } catch (error) {
    console.error('Analytics Fetch Error:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}
