// app/api/assets/[assetId]/route.js
import { NextResponse } from 'next/server';
import { authenticateRequest, isAdmin } from '@/app/lib/auth';
import prisma from '@/app/lib/prisma';

export async function DELETE(request, { params }) {
  try {
    const authResult = await authenticateRequest(request);
    
    if (!authResult.authenticated) {
      return authResult.error;
    }

    const user = authResult.user;
    const { assetId } = params;
    const { searchParams } = new URL(request.url);
    const assetType = searchParams.get('assetType');
    const hardDelete = searchParams.get('hardDelete') === 'true';

    if (!assetType) {
      return NextResponse.json(
        { success: false, error: 'assetType query parameter required' },
        { status: 400 }
      );
    }

    // Fetch asset to verify ownership/permissions
    let asset;
    if (assetType === 'VIDEO') {
      asset = await prisma.video.findUnique({
        where: { id: assetId },
        select: { 
          id: true, 
          companyId: true, 
          uploadedBy: true,
          r2Key: true,
          r2Bucket: true 
        }
      });
    } else {
      asset = await prisma.document.findUnique({
        where: { id: assetId },
        select: { 
          id: true, 
          companyId: true, 
          uploadedBy: true,
          r2Key: true,
          r2Bucket: true 
        }
      });
    }

    if (!asset) {
      return NextResponse.json(
        { success: false, error: 'Asset not found' },
        { status: 404 }
      );
    }

    // ✅ Check permissions: Admin or uploader
    const isAuthorized = isAdmin(user) || asset.uploadedBy === user.id;
    
    if (!isAuthorized) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    if (hardDelete) {
      // TODO: Delete from R2 storage
      // await deleteFromR2(asset.r2Bucket, asset.r2Key);

      // Delete from database (cascades will handle relations)
      if (assetType === 'VIDEO') {
        await prisma.video.delete({ where: { id: assetId } });
      } else {
        await prisma.document.delete({ where: { id: assetId } });
      }

      return NextResponse.json({
        success: true,
        message: 'Asset permanently deleted'
      });
    } else {
      // Soft delete - update status
      if (assetType === 'VIDEO') {
        await prisma.video.update({
          where: { id: assetId },
          data: { status: 'archived' }
        });
      } else {
        await prisma.document.update({
          where: { id: assetId },
          data: { status: 'archived' }
        });
      }

      return NextResponse.json({
        success: true,
        message: 'Asset archived'
      });
    }

  } catch (error) {
    console.error('Error deleting asset:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete asset', details: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(request, { params }) {
  try {
    const authResult = await authenticateRequest(request);
    
    if (!authResult.authenticated) {
      return authResult.error;
    }

    const user = authResult.user;
    const { assetId } = params;
    const body = await request.json();
    const { title, tags, campaignId, assetType } = body;

    if (!assetType) {
      return NextResponse.json(
        { success: false, error: 'assetType is required in body' },
        { status: 400 }
      );
    }

    // Fetch asset to verify ownership
    let asset;
    if (assetType === 'VIDEO') {
      asset = await prisma.video.findUnique({
        where: { id: assetId },
        select: { uploadedBy: true, companyId: true }
      });
    } else {
      asset = await prisma.document.findUnique({
        where: { id: assetId },
        select: { uploadedBy: true, companyId: true }
      });
    }

    if (!asset) {
      return NextResponse.json(
        { success: false, error: 'Asset not found' },
        { status: 404 }
      );
    }

    // ✅ Check permissions
    const isAuthorized = isAdmin(user) || asset.uploadedBy === user.id;
    
    if (!isAuthorized) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Build update data
    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (tags !== undefined) updateData.tags = tags;
    if (campaignId !== undefined) {
      // Verify campaign belongs to same company
      if (campaignId) {
        const campaign = await prisma.campaign.findUnique({
          where: { id: campaignId },
          select: { companyId: true }
        });

        if (!campaign || campaign.companyId !== asset.companyId) {
          return NextResponse.json(
            { success: false, error: 'Invalid campaign' },
            { status: 400 }
          );
        }
      }
      updateData.campaignId = campaignId;
    }

    // Update asset
    let updatedAsset;
    if (assetType === 'VIDEO') {
      updatedAsset = await prisma.video.update({
        where: { id: assetId },
        data: updateData,
        include: {
          campaign: { select: { id: true, name: true } }
        }
      });
    } else {
      updatedAsset = await prisma.document.update({
        where: { id: assetId },
        data: updateData,
        include: {
          campaign: { select: { id: true, name: true } }
        }
      });
    }

    // Convert BigInt to string
    if (updatedAsset.fileSize) updatedAsset.fileSize = updatedAsset.fileSize.toString();
    if (updatedAsset.originalSize) updatedAsset.originalSize = updatedAsset.originalSize.toString();

    return NextResponse.json({
      success: true,
      asset: { ...updatedAsset, assetType }
    });

  } catch (error) {
    console.error('Error updating asset:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update asset', details: error.message },
      { status: 500 }
    );
  }
}
