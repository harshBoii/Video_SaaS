'use client';

import { useState, useEffect } from 'react';
import { getSlackOAuthUrl } from '@/app/lib/integrations/slack-oauth';

export default function IntegrationsPage() {
  const [companyId, setCompanyId] = useState(''); // Get from auth session
  const [integrations, setIntegrations] = useState(null);
  const [loading, setLoading] = useState(true);

useEffect(() => {
  const fetchUser = async () => {
    try {
      const response = await fetch('/api/auth/me', {
        credentials: 'include', // Include JWT cookie
      });

      if (!response.ok) {
        throw new Error('Not authenticated');
      }

      const data = await response.json();
      
      if (data.success && data.employee) {
        setCompanyId(data.employee.companyId);
      }
    } catch (error) {
      console.error('Error fetching user:', error);
    }
  };

  fetchUser();
}, []);

useEffect(() => {
  if (!companyId) return; // wait until companyId exists
  fetchIntegrationStatus();
}, [companyId]);


  const fetchIntegrationStatus = async () => {
    try {
      const response = await fetch(`/api/messages/notifications/send?companyId=${companyId}`);
      const data = await response.json();
      setIntegrations(data);
    } catch (error) {
      console.error('Error fetching status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnectSlack = () => {
    window.location.href = getSlackOAuthUrl(companyId);
  };

  const handleDisconnectSlack = async () => {
    if (!confirm('Disconnect Slack integration?')) return;

    try {
      await fetch(`/api/messages/integrations/slack/channels?companyId=${companyId}`, {
        method: 'DELETE',
      });
      fetchIntegrationStatus();
    } catch (error) {
      console.error('Error disconnecting Slack:', error);
    }
  };

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Notification Integrations</h1>

      {/* Statistics */}
      {integrations?.statistics && (
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-lg font-semibold mb-4">Statistics</h2>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-gray-600 text-sm">Total Notifications</p>
              <p className="text-2xl font-bold">{integrations.statistics.totalNotifications}</p>
            </div>
            <div>
              <p className="text-gray-600 text-sm">Success Rate</p>
              <p className="text-2xl font-bold text-green-600">{integrations.statistics.successRate}</p>
            </div>
            <div>
              <p className="text-gray-600 text-sm">Failed</p>
              <p className="text-2xl font-bold text-red-600">{integrations.statistics.failedNotifications}</p>
            </div>
          </div>
        </div>
      )}

      {/* Integrations Grid */}
      <div className="grid gap-6">
        {/* Slack */}
        <IntegrationCard
          title="Slack"
          description="Send notifications to your Slack workspace"
          icon="💬"
          isActive={integrations?.integrations?.slack?.isActive}
          channelName={integrations?.integrations?.slack?.channelName}
          onConnect={handleConnectSlack}
          onDisconnect={handleDisconnectSlack}
          onTest={() => window.location.href = `/dashboard/integrations/test?channel=slack`}
        />

        {/* Email */}
        <IntegrationCard
          title="Email"
          description="Send notifications via email"
          icon="📧"
          isActive={integrations?.integrations?.email?.isActive}
          channelName={integrations?.integrations?.email?.fromEmail}
          onConnect={() => window.location.href = '/dashboard/integrations/email/setup'}
          onTest={() => window.location.href = `/dashboard/integrations/test?channel=email`}
        />

        {/* Microsoft Teams */}
        <IntegrationCard
          title="Microsoft Teams"
          description="Send notifications to Teams channels"
          icon="👥"
          isActive={integrations?.integrations?.teams?.isActive}
          channelName={integrations?.integrations?.teams?.channelName}
          onConnect={() => window.location.href = '/dashboard/integrations/teams/setup'}
          onTest={() => window.location.href = `/dashboard/integrations/test?channel=teams`}
        />
      </div>

      {/* Recent Logs */}
      {integrations?.recentLogs && integrations.recentLogs.length > 0 && (
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Recent Notifications</h2>
          <div className="space-y-2">
            {integrations.recentLogs.map((log) => (
              <div
                key={log.id}
                className={`p-3 rounded border ${
                  log.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium">{log.notificationType}</p>
                    <p className="text-sm text-gray-600">Channel: {log.channels}</p>
                    {log.error && <p className="text-sm text-red-600">{log.error}</p>}
                  </div>
                  <span className={`text-sm ${log.success ? 'text-green-600' : 'text-red-600'}`}>
                    {log.success ? '✓ Success' : '✗ Failed'}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(log.createdAt).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Reusable Integration Card Component
function IntegrationCard({ title, description, icon, isActive, channelName, onConnect, onDisconnect, onTest }) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="text-4xl">{icon}</div>
          <div>
            <h3 className="text-xl font-semibold">{title}</h3>
            <p className="text-gray-600 text-sm">{description}</p>
            {isActive && channelName && (
              <p className="text-sm text-green-600 mt-1">
                ✓ Connected: {channelName}
              </p>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          {isActive ? (
            <>
              <button
                onClick={onTest}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
              >
                Test
              </button>
              {onDisconnect && (
                <button
                  onClick={onDisconnect}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-sm"
                >
                  Disconnect
                </button>
              )}
            </>
          ) : (
            <button
              onClick={onConnect}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Connect
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
