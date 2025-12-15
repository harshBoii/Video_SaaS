import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendEmailNotification } from '@/lib/integrations/email-handler';

/**
 * Setup Email Integration
 * POST /api/integrations/email/setup
 */
export async function POST(request) {
  try {
    const { companyId, recipientEmail, replyTo } = await request.json();

    // Validate
    if (!companyId || !recipientEmail) {
      return NextResponse.json(
        { error: 'Company ID and recipient email are required' },
        { status: 400 }
      );
    }

    // TODO: Add authentication check

    // Your fixed "From" email (verified in Resend)
    const fromEmail = 'notifications@yourdomain.com'; // Your verified domain

    // Send test email immediately
    console.log('Sending test email...');
    const testResult = await sendEmailNotification({
      fromEmail: fromEmail,
      toEmail: recipientEmail,
      replyTo: replyTo || recipientEmail,
      notificationType: 'campaign_completed',
      data: {
        campaignName: 'Email Setup Test',
        status: 'Test Successful',
        stats: {
          videosProcessed: 0,
          totalViews: 0,
        },
        companyName: 'Test',
      },
    });

    if (!testResult.success) {
      return NextResponse.json(
        { error: 'Failed to send test email. Please check the email address.' },
        { status: 400 }
      );
    }

    // Save email integration
    const integration = await prisma.emailIntegration.upsert({
      where: { companyId },
      update: {
        fromEmail: fromEmail, // Your verified domain
        replyTo: replyTo || recipientEmail,
        isActive: true,
      },
      create: {
        companyId,
        fromEmail: fromEmail,
        replyTo: replyTo || recipientEmail,
        isActive: true,
      },
    });

    // Update company email if not set
    await prisma.company.update({
      where: { id: companyId },
      data: {
        email: recipientEmail, // Store where to send notifications
      },
    });

    // Enable email notifications
    await prisma.notificationPreference.upsert({
      where: { companyId },
      update: { emailEnabled: true },
      create: {
        companyId,
        emailEnabled: true,
        slackEnabled: false,
        teamsEnabled: false,
      },
    });

    console.log(`Email integration saved for company ${companyId}`);

    return NextResponse.json({
      success: true,
      message: 'Email integration configured and test email sent',
      emailId: testResult.emailId,
    });
  } catch (error) {
    console.error('Email setup error:', error);
    return NextResponse.json(
      { error: 'Failed to setup email integration', message: error.message },
      { status: 500 }
    );
  }
}

/**
 * Get email integration status
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');

    const integration = await prisma.emailIntegration.findUnique({
      where: { companyId },
      select: {
        fromEmail: true,
        replyTo: true,
        isActive: true,
      },
    });

    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: { email: true },
    });

    return NextResponse.json({
      success: true,
      integration,
      recipientEmail: company?.email,
      hasIntegration: !!integration,
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * Delete email integration
 */
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');

    await prisma.emailIntegration.delete({
      where: { companyId },
    });

    await prisma.notificationPreference.update({
      where: { companyId },
      data: { emailEnabled: false },
    });

    return NextResponse.json({
      success: true,
      message: 'Email integration removed',
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
