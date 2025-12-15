import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { encrypt } from '@/app/lib/integrations/encryption';
import { verifyTeamsWebhook } from '@/app/lib/integrations/teams-handler';

/**
 * Setup Microsoft Teams Integration
 * POST /api/integrations/teams/setup
 */
export async function POST(request) {
  try {
    const { companyId, webhookUrl, channelName } = await request.json();

    // Validate input
    if (!companyId || !webhookUrl) {
      return NextResponse.json(
        { error: 'Company ID and webhook URL are required' },
        { status: 400 }
      );
    }

    // Validate webhook URL format
    if (!webhookUrl.includes('webhook.office.com')) {
      return NextResponse.json(
        { error: 'Invalid Teams webhook URL format' },
        { status: 400 }
      );
    }

    // TODO: Add authentication check
    // Verify user has access to this company

    // Test webhook before saving
    console.log('Testing Teams webhook...');
    const testResult = await verifyTeamsWebhook(webhookUrl);

    if (!testResult.valid) {
      return NextResponse.json(
        { 
          error: 'Webhook verification failed. Please check the URL and try again.',
          details: testResult.error
        },
        { status: 400 }
      );
    }

    // Encrypt webhook URL
    const encryptedWebhook = encrypt(webhookUrl);

    // Save or update integration
    const integration = await prisma.teamsIntegration.upsert({
      where: { companyId },
      update: {
        webhookUrl: encryptedWebhook,
        channelName: channelName || null,
        isActive: true,
        installedAt: new Date(),
      },
      create: {
        companyId,
        webhookUrl: encryptedWebhook,
        channelName: channelName || null,
        isActive: true,
      },
    });

    // Enable Teams notifications
    await prisma.notificationPreference.upsert({
      where: { companyId },
      update: { teamsEnabled: true },
      create: {
        companyId,
        emailEnabled: true,
        slackEnabled: false,
        teamsEnabled: true,
      },
    });

    console.log(`Teams integration saved for company ${companyId}`);

    return NextResponse.json({
      success: true,
      message: 'Teams integration configured successfully',
      integration: {
        channelName: integration.channelName,
        isActive: integration.isActive,
      },
    });
  } catch (error) {
    console.error('Teams setup error:', error);
    return NextResponse.json(
      {
        error: 'Failed to setup Teams integration',
        message: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * Get Teams integration status
 * GET /api/integrations/teams/setup?companyId=xxx
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');

    if (!companyId) {
      return NextResponse.json(
        { error: 'Company ID is required' },
        { status: 400 }
      );
    }

    // TODO: Add authentication check

    const integration = await prisma.teamsIntegration.findUnique({
      where: { companyId },
      select: {
        channelName: true,
        isActive: true,
        installedAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      integration,
      hasIntegration: !!integration,
    });
  } catch (error) {
    console.error('Error fetching Teams integration:', error);
    return NextResponse.json(
      { error: 'Failed to fetch integration' },
      { status: 500 }
    );
  }
}

/**
 * Delete Teams integration
 * DELETE /api/integrations/teams/setup?companyId=xxx
 */
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');

    if (!companyId) {
      return NextResponse.json(
        { error: 'Company ID is required' },
        { status: 400 }
      );
    }

    // TODO: Add authentication check

    await prisma.teamsIntegration.delete({
      where: { companyId },
    });

    await prisma.notificationPreference.update({
      where: { companyId },
      data: { teamsEnabled: false },
    });

    return NextResponse.json({
      success: true,
      message: 'Teams integration removed',
    });
  } catch (error) {
    console.error('Error removing Teams integration:', error);
    return NextResponse.json(
      { error: 'Failed to remove integration' },
      { status: 500 }
    );
  }
}
