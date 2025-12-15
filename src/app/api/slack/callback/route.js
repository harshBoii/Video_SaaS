import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { exchangeSlackCode, verifySlackToken } from '@/app/lib/integrations/slack-handler';
import { encrypt } from '@/app/lib/integrations/encryption';

/**
 * Slack OAuth Callback Handler
 * GET /api/integrations/slack/callback?code=xxx&state=companyId
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state'); // companyId
    const error = searchParams.get('error');

    // Handle OAuth errors
    if (error) {
      console.error('Slack OAuth error:', error);
      return NextResponse.redirect(
        new URL(`/dashboard/integrations?error=slack_denied`, process.env.NEXT_PUBLIC_APP_URL)
      );
    }

    // Validate required parameters
    if (!code || !state) {
      return NextResponse.json(
        { error: 'Missing code or state parameter' },
        { status: 400 }
      );
    }

    const companyId = state;

    // Verify company exists
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      include: {
        slackIntegration: true,
        notificationPreference: true,
      },
    });

    if (!company) {
      return NextResponse.json(
        { error: 'Company not found' },
        { status: 404 }
      );
    }

    // Exchange code for bot token
    const tokenData = await exchangeSlackCode(code);

    if (!tokenData.botToken) {
      throw new Error('Failed to obtain bot token from Slack');
    }

    // Verify the token is valid
    const verification = await verifySlackToken(tokenData.botToken);
    
    if (!verification.valid) {
      throw new Error('Invalid Slack bot token');
    }

    // Encrypt the bot token
    const encryptedToken = encrypt(tokenData.botToken);

    // Check if integration already exists
    if (company.slackIntegration) {
      // Update existing integration
      await prisma.slackIntegration.update({
        where: { companyId: companyId },
        data: {
          slackTeamId: verification.teamId,
          botToken: encryptedToken,
          isActive: true,
          installedAt: new Date(),
        },
      });
    } else {
      // Create new integration
      await prisma.slackIntegration.create({
        data: {
          companyId: companyId,
          slackTeamId: verification.teamId,
          botToken: encryptedToken,
          channelId: '', // Will be set when user selects channel
          isActive: false, // Inactive until channel is selected
        },
      });
    }

    // Create notification preference if doesn't exist
    if (!company.notificationPreference) {
      await prisma.notificationPreference.create({
        data: {
          companyId: companyId,
          slackEnabled: false, // Will enable after channel selection
        },
      });
    }

    console.log('Slack integration successful for company:', companyId);

    // Redirect to channel selection page
    return NextResponse.redirect(
      new URL(
        `/dashboard/integrations/slack/select-channel?success=true`,
        process.env.NEXT_PUBLIC_APP_URL
      )
    );
  } catch (error) {
    console.error('Slack OAuth callback error:', error);

    // Redirect with error
    return NextResponse.redirect(
      new URL(
        `/dashboard/integrations?error=slack_failed&message=${encodeURIComponent(error.message)}`,
        process.env.NEXT_PUBLIC_APP_URL
      )
    );
  }
}
