import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { fetchSlackChannels } from '@/app/lib/integrations/slack-handler';
import { decrypt } from '@/app/lib/integrations/encryption';

/**
 * Fetch Slack channels for company
 * GET /api/integrations/slack/channels?companyId=xxx
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

    // TODO: Add authentication check here
    // Verify the requesting user has access to this company
    // const session = await getServerSession();
    // if (!session || session.user.companyId !== companyId) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    // Fetch Slack integration
    const slackIntegration = await prisma.slackIntegration.findUnique({
      where: { companyId: companyId },
    });

    if (!slackIntegration) {
      return NextResponse.json(
        { error: 'Slack integration not found. Please connect Slack first.' },
        { status: 404 }
      );
    }

    // Decrypt bot token
    const botToken = decrypt(slackIntegration.botToken);

    // Fetch channels from Slack
    const channels = await fetchSlackChannels(botToken);

    // Filter to only show channels where bot is a member or can be invited
    const availableChannels = channels.map(channel => ({
      id: channel.id,
      name: channel.name,
      isPrivate: channel.isPrivate,
      isMember: channel.isMember,
      displayName: channel.isPrivate ? `🔒 ${channel.name}` : `# ${channel.name}`,
    }));

    return NextResponse.json({
      success: true,
      channels: availableChannels,
      currentChannelId: slackIntegration.channelId || null,
    });
  } catch (error) {
    console.error('Error fetching Slack channels:', error);

    return NextResponse.json(
      {
        error: 'Failed to fetch channels',
        message: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * Update selected Slack channel
 * POST /api/integrations/slack/channels
 * Body: { companyId, channelId, channelName }
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { companyId, channelId, channelName } = body;

    // Validate input
    if (!companyId || !channelId) {
      return NextResponse.json(
        { error: 'Company ID and Channel ID are required' },
        { status: 400 }
      );
    }

    // TODO: Add authentication check
    // const session = await getServerSession();
    // if (!session || session.user.companyId !== companyId) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    // Update Slack integration with selected channel
    const updatedIntegration = await prisma.slackIntegration.update({
      where: { companyId: companyId },
      data: {
        channelId: channelId,
        channelName: channelName || null,
        isActive: true, // Activate integration now that channel is selected
      },
    });

    // Enable Slack notifications in preferences
    await prisma.notificationPreference.upsert({
      where: { companyId: companyId },
      update: {
        slackEnabled: true,
      },
      create: {
        companyId: companyId,
        slackEnabled: true,
        emailEnabled: true,
        teamsEnabled: false,
      },
    });

    console.log(`Slack channel selected for company ${companyId}: ${channelName}`);

    return NextResponse.json({
      success: true,
      message: 'Slack channel configured successfully',
      integration: {
        channelId: updatedIntegration.channelId,
        channelName: updatedIntegration.channelName,
        isActive: updatedIntegration.isActive,
      },
    });
  } catch (error) {
    console.error('Error updating Slack channel:', error);

    return NextResponse.json(
      {
        error: 'Failed to update channel',
        message: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * Remove Slack integration
 * DELETE /api/integrations/slack/channels?companyId=xxx
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
    // const session = await getServerSession();
    // if (!session || session.user.companyId !== companyId) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    // Delete Slack integration
    await prisma.slackIntegration.delete({
      where: { companyId: companyId },
    });

    // Disable Slack notifications
    await prisma.notificationPreference.update({
      where: { companyId: companyId },
      data: {
        slackEnabled: false,
      },
    });

    console.log(`Slack integration removed for company ${companyId}`);

    return NextResponse.json({
      success: true,
      message: 'Slack integration removed successfully',
    });
  } catch (error) {
    console.error('Error removing Slack integration:', error);

    return NextResponse.json(
      {
        error: 'Failed to remove integration',
        message: error.message,
      },
      { status: 500 }
    );
  }
}
