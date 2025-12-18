import { NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';

export async function GET(request, { params }) {
  try {
    const { videoId } = await params;

    // Fetch video basic info
    const video = await prisma.video.findUnique({
      where: { id: videoId },
      select: { 
        id: true, 
        title: true, 
        duration: true,
        createdAt: true
      }
    });

    if (!video) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 });
    }

    // 1. Overall Stats
    const totalViews = await prisma.videoView.count({
      where: { videoId }
    });

    const viewStats = await prisma.videoView.aggregate({
      where: { videoId },
      _avg: { percentage: true, watchDuration: true },
      _sum: { watchDuration: true }
    });

    const completedViews = await prisma.videoView.count({
      where: { videoId, completed: true }
    });

    // 2. Heatmap Data (most watched segments)
    const heatmapData = await prisma.videoHeatmap.groupBy({
      by: ['startTime', 'endTime'],
      where: { videoId },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } }
    });

    // 3. Device Breakdown
    const deviceStats = await prisma.videoView.groupBy({
      by: ['deviceType'],
      where: { videoId },
      _count: { id: true }
    });

    // 4. Location Stats
    const locationStats = await prisma.videoView.groupBy({
      by: ['location'],
      where: { videoId },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 10
    });

    // 5. Views over time (last 30 days) - ✅ Fixed column names
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const viewsOverTime = await prisma.$queryRaw`
      SELECT 
        DATE("createdAt") as date,
        COUNT(*)::int as views,
        AVG(percentage)::float as avg_completion
      FROM "VideoView"
      WHERE "videoId" = ${videoId}
        AND "createdAt" >= ${thirtyDaysAgo}
      GROUP BY DATE("createdAt")
      ORDER BY date ASC
    `;

    // 6. Engagement by segment (divide video into 10 segments)
    const segmentSize = Math.ceil((video.duration || 100) / 10);
    const segments = Array.from({ length: 10 }, (_, i) => ({
      start: i * segmentSize,
      end: Math.min((i + 1) * segmentSize, video.duration || 100),
      views: 0
    }));

    // Count views for each segment
    for (const heatmap of heatmapData) {
      for (let i = 0; i < segments.length; i++) {
        const seg = segments[i];
        // Check if heatmap overlaps with segment
        if (heatmap.startTime < seg.end && heatmap.endTime > seg.start) {
          segments[i].views += heatmap._count.id;
        }
      }
    }

    return NextResponse.json({
      success: true,
      video: {
        id: video.id,
        title: video.title,
        duration: video.duration
      },
      stats: {
        totalViews,
        completedViews,
        completionRate: totalViews > 0 ? (completedViews / totalViews * 100).toFixed(1) : 0,
        avgWatchTime: Math.round(viewStats._avg.watchDuration || 0),
        avgCompletion: Number((viewStats._avg.percentage || 0).toFixed(1)),
        totalWatchTime: Number(viewStats._sum.watchDuration || 0)
      },
      heatmap: heatmapData.slice(0, 50),
      segments,
      devices: deviceStats,
      locations: locationStats.filter(l => l.location),
      timeline: viewsOverTime.map(v => ({
        date: v.date instanceof Date ? v.date.toISOString().split('T')[0] : v.date,
        views: Number(v.views),
        avgCompletion: Number((v.avg_completion || 0).toFixed(1))
      }))
    });

  } catch (error) {
    console.error('Analytics Error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch analytics',
      details: error.message 
    }, { status: 500 });
  }
}
