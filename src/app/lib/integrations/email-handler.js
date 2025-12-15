import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Send email notification
 */
export async function sendEmailNotification({ fromEmail, toEmail, replyTo, notificationType, data }) {
  try {
    const { subject, html, text } = formatEmailMessage(notificationType, data);
    
    const result = await resend.emails.send({
      from: fromEmail,
      to: toEmail,
      replyTo: replyTo || fromEmail,
      subject: subject,
      html: html,
      text: text,
    });

    return {
      success: true,
      emailId: result.id,
    };
  } catch (error) {
    console.error('Email notification error:', error);
    
    // Handle specific email errors
    if (error.message.includes('validation_error')) {
      throw new Error('Invalid email address format');
    }
    if (error.message.includes('rate_limit')) {
      throw new Error('Email rate limit exceeded');
    }
    
    throw new Error(`Email error: ${error.message}`);
  }
}

/**
 * Send bulk email notifications
 */
export async function sendBulkEmailNotifications({ fromEmail, recipients, replyTo, notificationType, data }) {
  try {
    const { subject, html, text } = formatEmailMessage(notificationType, data);
    
    const emailPromises = recipients.map(toEmail =>
      resend.emails.send({
        from: fromEmail,
        to: toEmail,
        replyTo: replyTo || fromEmail,
        subject: subject,
        html: html,
        text: text,
      })
    );

    const results = await Promise.allSettled(emailPromises);
    
    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    return {
      success: failed === 0,
      successful,
      failed,
      total: recipients.length,
    };
  } catch (error) {
    console.error('Bulk email error:', error);
    throw new Error(`Bulk email error: ${error.message}`);
  }
}

/**
 * Verify email configuration
 */
export async function verifyEmailConfig(fromEmail) {
  try {
    // Send a test email to verify
    const result = await resend.emails.send({
      from: fromEmail,
      to: fromEmail, // Send to itself
      subject: 'Email Integration Test',
      html: '<p>Your email integration is working correctly!</p>',
    });

    return { valid: true, emailId: result.id };
  } catch (error) {
    return { valid: false, error: error.message };
  }
}

/**
 * Format notification into email HTML and text
 */
function formatEmailMessage(notificationType, data) {
  const templates = {
    campaign_completed: {
      subject: `Campaign Completed: ${data.campaignName}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: #10b981; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
              .content { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
              .stats { display: flex; justify-content: space-around; margin: 20px 0; }
              .stat { text-align: center; }
              .stat-value { font-size: 24px; font-weight: bold; color: #10b981; }
              .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 20px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🎉 Campaign Completed</h1>
              </div>
              <div class="content">
                <h2>${data.campaignName}</h2>
                <p><strong>Status:</strong> ${data.status}</p>
                <div class="stats">
                  <div class="stat">
                    <div class="stat-value">${data.stats?.videosProcessed || 0}</div>
                    <div>Videos Processed</div>
                  </div>
                  <div class="stat">
                    <div class="stat-value">${data.stats?.totalViews || 0}</div>
                    <div>Total Views</div>
                  </div>
                </div>
                <p>Completed at ${new Date().toLocaleString()}</p>
              </div>
              <div class="footer">
                <p>This is an automated notification from your workflow system.</p>
              </div>
            </div>
          </body>
        </html>
      `,
      text: `Campaign Completed: ${data.campaignName}\n\nStatus: ${data.status}\nVideos Processed: ${data.stats?.videosProcessed || 0}\nTotal Views: ${data.stats?.totalViews || 0}\n\nCompleted at ${new Date().toLocaleString()}`,
    },
    
    video_published: {
      subject: `Video Published: ${data.videoTitle}`,
      html: `
        <!DOCTYPE html>
        <html>
          <body style="font-family: Arial, sans-serif; line-height: 1.6;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
              <h1 style="color: #10b981;">📹 Video Published</h1>
              <p><strong>${data.videoTitle}</strong> has been published successfully.</p>
              <p><strong>Platform:</strong> ${data.platform}</p>
              <p><strong>Duration:</strong> ${data.duration}</p>
            </div>
          </body>
        </html>
      `,
      text: `Video Published: ${data.videoTitle}\n\nPlatform: ${data.platform}\nDuration: ${data.duration}`,
    },
    
    workflow_failed: {
      subject: `⚠️ Workflow Failed: ${data.workflowName}`,
      html: `
        <!DOCTYPE html>
        <html>
          <body style="font-family: Arial, sans-serif; line-height: 1.6;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 2px solid #ef4444; border-radius: 8px;">
              <h1 style="color: #ef4444;">⚠️ Workflow Failed</h1>
              <p><strong>Workflow:</strong> ${data.workflowName}</p>
              <p><strong>Error:</strong> ${data.error}</p>
              <p style="color: #6b7280; font-size: 14px;">Failed at ${new Date().toLocaleString()}</p>
            </div>
          </body>
        </html>
      `,
      text: `Workflow Failed: ${data.workflowName}\n\nError: ${data.error}\n\nFailed at ${new Date().toLocaleString()}`,
    },
  };

  return templates[notificationType] || {
    subject: `Notification: ${notificationType}`,
    html: `<p>${notificationType}</p><pre>${JSON.stringify(data, null, 2)}</pre>`,
    text: `${notificationType}\n\n${JSON.stringify(data, null, 2)}`,
  };
}
