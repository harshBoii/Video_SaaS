/**
 * Generate Slack OAuth URL for company
 */
export function getSlackOAuthUrl(companyId) {
  const clientId = process.env.NEXT_PUBLIC_SLACK_CLIENT_ID;
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/slack/callback`;
  
  const scopes = [
    'chat:write',           // Send messages
    'channels:read',        // List public channels
    'groups:read',          // List private channels
    'im:write',             // Send DMs (optional)
    'chat:write.public',    // Post to channels without joining (optional)
  ].join(',');

  const params = new URLSearchParams({
    client_id: clientId,
    scope: scopes,
    redirect_uri: redirectUri,
    state: companyId, // Pass companyId as state for callback
  });

  return `https://slack.com/oauth/v2/authorize?${params.toString()}`;
}

/**
 * Check if Slack integration is active for company
 */
export async function checkSlackIntegration(companyId) {
  try {
    const response = await fetch(`/api/integrations/slack/status?companyId=${companyId}`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error checking Slack integration:', error);
    return { active: false, error: error.message };
  }
}
