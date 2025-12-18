// app/api/assets/route.js
import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/app/lib/auth';
import prisma from '@/app/lib/prisma';

export async function GET(request) {
  try {
    // ✅ Use your existing auth
    const authResult = await authenticateRequest(request);
    
    if (!authResult.authenticated) {
      return authResult.error;
    }

    const user = authResult.user;
    const { searchParams } = new URL(request.url);
    
    // Extract query parameters
    const assetType = searchParams.get('assetType') || 'all';
    const campaignId = searchParams.get('campaignId') || 'all';
    const status = searchParams.get('status') || 'all';
    const dateRange = searchParams.get('dateRange') || 'all';
    const search = searchParams.get('search') || '';
    const sortBy = searchParams.get('sortBy') || 'createdAt-desc';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    // Build base where clause
    let whereClause = await { companyId: user.companyId };

    

    // Authorization logic
    if (user.isAdmin) {
      // ✅ Admins see all company assets
      whereClause.companyId = user.companyId;
    } else {
      // ✅ Employees: Get their campaign IDs
      const userCampaigns = await prisma.campaignAssignment.findMany({
        where: { employeeId: user.id },
        select: { campaignId: true }
      });
      
      const userCampaignIds = userCampaigns.map(c => c.campaignId);

      whereClause = {
        companyId: user.companyId,
        OR: [
          // Assets from campaigns they're assigned to
          { campaignId: { in: userCampaignIds } },
          
          // Company assets (no campaign) with visibility rules
          {
            campaignId: null,
            assetVisibility: {
              some: {
                OR: [
                  { scope: 'COMPANY' },
                  { scope: 'ROLE', roleId: user.roleId },
                  { scope: 'EMPLOYEE', employeeId: user.id }
                ]
              }
            }
          }
        ]
      };
    }

    // Campaign filter
    if (campaignId !== 'all') {
      if (campaignId === 'none') {
        whereClause.campaignId = null;
      } else {
        whereClause.campaignId = campaignId;
      }
    }

    // Status filter
    if (status !== 'all') {
      whereClause.status = status;
    }

    // Date range filter
    if (dateRange !== 'all') {
      const now = new Date();
      let startDate;

      switch (dateRange) {
        case 'today':
          startDate = new Date(now.setHours(0, 0, 0, 0));
          break;
        case 'week':
          startDate = new Date(now.setDate(now.getDate() - 7));
          break;
        case 'month':
          startDate = new Date(now.setDate(now.getDate() - 30));
          break;
        case 'quarter':
          startDate = new Date(now.setDate(now.getDate() - 90));
          break;
      }

      if (startDate) {
        whereClause.createdAt = { gte: startDate };
      }
    }

    // Search filter
    if (search) {
      whereClause.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { filename: { contains: search, mode: 'insensitive' } },
        { tags: { has: search } }
      ];
    }

    // Fetch Videos
    let videos = [];
    if (assetType === 'all' || assetType === 'VIDEO') {
      videos = await prisma.video.findMany({
        where: whereClause,
        include: {
          campaign: {
            select: { id: true, name: true }
          },
          uploader: {
            select: { id: true, firstName: true, lastName: true }
          }
        },
        take: limit
      });

      videos = videos.map(v => ({ ...v, assetType: 'VIDEO' }));
    }

    // Fetch Documents
    let documents = [];
    if (assetType === 'all' || assetType === 'DOCUMENT') {
      documents = await prisma.document.findMany({
        where: whereClause,
        include: {
          campaign: {
            select: { id: true, name: true }
          },
          uploader: {
            select: { id: true, firstName: true, lastName: true }
          }
        },
        take: limit
      });

      documents = documents.map(d => ({ ...d, assetType: 'DOCUMENT' }));
    }

    // Combine and sort
    let assets = [...videos, ...documents];

    // Apply sorting
    const [sortField, sortOrder] = sortBy.split('-');
    assets.sort((a, b) => {
      let aVal, bVal;

      switch (sortField) {
        case 'createdAt':
          aVal = new Date(a.createdAt);
          bVal = new Date(b.createdAt);
          break;
        case 'title':
          aVal = a.title.toLowerCase();
          bVal = b.title.toLowerCase();
          break;
        case 'size':
          aVal = Number(a.fileSize || a.originalSize || 0);
          bVal = Number(b.fileSize || b.originalSize || 0);
          break;
        default:
          return 0;
      }

      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

    // Convert BigInt to string for JSON serialization
    assets = assets.map(asset => ({
      ...asset,
      fileSize: asset.fileSize ? asset.fileSize.toString() : undefined,
      originalSize: asset.originalSize ? asset.originalSize.toString() : undefined
    }));

    return NextResponse.json({
      success: true,
      assets,
      total: assets.length,
      page,
      limit
    });

  } catch (error) {
    console.error('Error fetching assets:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch assets', details: error.message },
      { status: 500 }
    );
  }
}
