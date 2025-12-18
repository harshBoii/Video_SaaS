// app/api/assets/[assetId]/visibility/route.js
import { NextResponse } from 'next/server';
import { authenticateRequest, isAdmin } from '@/app/lib/auth';
import prisma from '@/app/lib/prisma';

export async function GET(request, { params }) {
  try {
    const authResult = await authenticateRequest(request);
    
    if (!authResult.authenticated) {
      return authResult.error;
    }

    const { assetId } = await params;

    // Fetch visibility settings
    const visibility = await prisma.assetVisibility.findMany({
      where: { assetId },
      include: {
        role: {
          select: { id: true, name: true, description: true }
        },
        employee: {
          select: { 
            id: true, 
            firstName: true, 
            lastName: true, 
            email: true 
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ 
      success: true,
      visibility 
    });

  } catch (error) {
    console.error('Error fetching visibility:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch visibility settings', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request, { params }) {
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

    const { assetId } = params;
    const body = await request.json();
    const { visibility } = body;

    if (!Array.isArray(visibility)) {
      return NextResponse.json(
        { success: false, error: 'Visibility must be an array' },
        { status: 400 }
      );
    }

    const assetType = body.assetType || visibility[0]?.assetType;

    // Verify asset exists and has no campaign
    let asset;
    if (assetType === 'VIDEO') {
      asset = await prisma.video.findUnique({
        where: { id: assetId },
        select: { campaignId: true, companyId: true }
      });
    } else {
      asset = await prisma.document.findUnique({
        where: { id: assetId },
        select: { campaignId: true, companyId: true }
      });
    }

    if (!asset) {
      return NextResponse.json(
        { success: false, error: 'Asset not found' },
        { status: 404 }
      );
    }

    if (asset.campaignId) {
      return NextResponse.json(
        { success: false, error: 'Cannot set visibility for campaign assets. Use campaign permissions instead.' },
        { status: 400 }
      );
    }

    // Verify user is from same company
    if (asset.companyId !== user.companyId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Delete existing visibility settings
    await prisma.assetVisibility.deleteMany({
      where: { assetId }
    });

    // Create new visibility settings
    await prisma.assetVisibility.createMany({
      data: visibility.map(v => ({
        assetId,
        assetType: v.assetType,
        scope: v.scope,
        roleId: v.roleId || null,
        employeeId: v.employeeId || null,
        companyId: asset.companyId
      }))
    });

    // Fetch and return updated visibility with relations
    const updatedVisibility = await prisma.assetVisibility.findMany({
      where: { assetId },
      include: {
        role: {
          select: { id: true, name: true, description: true }
        },
        employee: {
          select: { 
            id: true, 
            firstName: true, 
            lastName: true, 
            email: true 
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      visibility: updatedVisibility
    });

  } catch (error) {
    console.error('Error updating visibility:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update visibility', details: error.message },
      { status: 500 }
    );
  }
}
