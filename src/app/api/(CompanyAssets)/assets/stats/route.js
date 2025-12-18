// app/api/assets/stats/route.js
import { NextResponse } from 'next/server';
import { authenticateRequest, isAdmin } from '@/app/lib/auth';
import prisma from '@/app/lib/prisma';

export async function GET(request) {
  try {
    const authResult = await authenticateRequest(request);
    
    if (!authResult.authenticated) {
      return authResult.error;
    }

    const user = authResult.user;

    // ✅ Check admin access
    if (!isAdmin(user)) {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }

    const companyId = user.companyId;

    // Total videos
    const totalVideos = await prisma.video.count({
      where: { companyId }
    });

    // Total documents
    const totalDocuments = await prisma.document.count({
      where: { companyId }
    });

    // Videos by status
    const videosByStatus = await prisma.video.groupBy({
      by: ['status'],
      where: { companyId },
      _count: { id: true }
    });

    // Documents by status
    const documentsByStatus = await prisma.document.groupBy({
      by: ['status'],
      where: { companyId },
      _count: { id: true }
    });

    // Combine status counts
    const statusMap = {};
    videosByStatus.forEach(item => {
      statusMap[item.status] = (statusMap[item.status] || 0) + item._count.id;
    });
    documentsByStatus.forEach(item => {
      statusMap[item.status] = (statusMap[item.status] || 0) + item._count.id;
    });

    // Assets by campaign
    const videosByCampaign = await prisma.video.groupBy({
      by: ['campaignId'],
      where: { companyId, campaignId: { not: null } },
      _count: { id: true }
    });

    const documentsByCampaign = await prisma.document.groupBy({
      by: ['campaignId'],
      where: { companyId, campaignId: { not: null } },
      _count: { id: true }
    });

    // Combine campaign counts
    const campaignMap = new Map();
    videosByCampaign.forEach(item => {
      campaignMap.set(item.campaignId, (campaignMap.get(item.campaignId) || 0) + item._count.id);
    });
    documentsByCampaign.forEach(item => {
      campaignMap.set(item.campaignId, (campaignMap.get(item.campaignId) || 0) + item._count.id);
    });

    // Fetch campaign names
    const campaignIds = Array.from(campaignMap.keys());
    const campaigns = await prisma.campaign.findMany({
      where: { id: { in: campaignIds } },
      select: { id: true, name: true }
    });

    const assetsByCampaign = campaigns.map(campaign => ({
      campaignId: campaign.id,
      campaignName: campaign.name,
      count: campaignMap.get(campaign.id) || 0
    }));

    // Company assets (no campaign)
    const companyVideos = await prisma.video.count({
      where: { companyId, campaignId: null }
    });
    const companyDocuments = await prisma.document.count({
      where: { companyId, campaignId: null }
    });

    // Total storage
    const videoStorage = await prisma.video.aggregate({
      where: { companyId },
      _sum: { originalSize: true }
    });

    const documentStorage = await prisma.document.aggregate({
      where: { companyId },
      _sum: { fileSize: true }
    });

    const totalStorage = 
      BigInt(videoStorage._sum.originalSize || 0) + 
      BigInt(documentStorage._sum.fileSize || 0);

    // Recent uploads (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentVideos = await prisma.video.count({
      where: { 
        companyId, 
        createdAt: { gte: sevenDaysAgo } 
      }
    });

    const recentDocuments = await prisma.document.count({
      where: { 
        companyId, 
        createdAt: { gte: sevenDaysAgo } 
      }
    });

    return NextResponse.json({
      success: true,
      stats: {
        totalAssets: totalVideos + totalDocuments,
        totalVideos,
        totalDocuments,
        companyAssets: companyVideos + companyDocuments,
        totalStorage: totalStorage.toString(),
        assetsByStatus: statusMap,
        assetsByCampaign,
        recentUploads: {
          last7Days: recentVideos + recentDocuments,
          videos: recentVideos,
          documents: recentDocuments
        }
      }
    });

  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch statistics', details: error.message },
      { status: 500 }
    );
  }
}
