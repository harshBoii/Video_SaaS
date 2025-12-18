// app/api/assets/bulk-visibility/route.js
import { NextResponse } from 'next/server';
import { authenticateRequest, isAdmin } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function POST(request) {
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

    const body = await request.json();
    const { assetIds, visibility, assetType } = body;

    if (!Array.isArray(assetIds) || assetIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'assetIds must be a non-empty array' },
        { status: 400 }
      );
    }

    if (!Array.isArray(visibility)) {
      return NextResponse.json(
        { success: false, error: 'visibility must be an array' },
        { status: 400 }
      );
    }

    if (!assetType) {
      return NextResponse.json(
        { success: false, error: 'assetType is required' },
        { status: 400 }
      );
    }

    // Verify all assets exist and have no campaign
    let assets;
    if (assetType === 'VIDEO') {
      assets = await prisma.video.findMany({
        where: { 
          id: { in: assetIds },
          companyId: user.companyId
        },
        select: { id: true, campaignId: true, companyId: true }
      });
    } else {
      assets = await prisma.document.findMany({
        where: { 
          id: { in: assetIds },
          companyId: user.companyId
        },
        select: { id: true, campaignId: true, companyId: true }
      });
    }

    if (assets.length !== assetIds.length) {
      return NextResponse.json(
        { success: false, error: 'Some assets not found' },
        { status: 404 }
      );
    }

    // Check if any asset has a campaign
    const hasCampaign = assets.some(a => a.campaignId !== null);
    if (hasCampaign) {
      return NextResponse.json(
        { success: false, error: 'Cannot set visibility for campaign assets' },
        { status: 400 }
      );
    }

    // Delete existing visibility for all assets
    await prisma.assetVisibility.deleteMany({
      where: { assetId: { in: assetIds } }
    });

    // Create new visibility settings for each asset
    const visibilityData = [];
    assetIds.forEach(assetId => {
      visibility.forEach(v => {
        visibilityData.push({
          assetId,
          assetType,
          scope: v.scope,
          roleId: v.roleId || null,
          employeeId: v.employeeId || null,
          companyId: user.companyId
        });
      });
    });

    await prisma.assetVisibility.createMany({
      data: visibilityData
    });

    return NextResponse.json({
      success: true,
      message: `Updated visibility for ${assetIds.length} assets`,
      updatedCount: assetIds.length
    });

  } catch (error) {
    console.error('Error bulk updating visibility:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update visibility', details: error.message },
      { status: 500 }
    );
  }
}
