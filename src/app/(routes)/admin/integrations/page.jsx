'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getSlackOAuthUrl } from '@/app/lib/integrations/slack-oauth';

export default function IntegrationsPage() {
  const [companyId, setCompanyId] = useState('');
  const [integrations, setIntegrations] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch('/api/auth/me', {
          credentials: 'include',
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
    if (!companyId) return;
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-zinc-50 to-stone-100">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-12 h-12 border-4 border-zinc-300 border-t-zinc-800 rounded-full"
          />
          <p className="text-zinc-600 font-medium">Loading integrations...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 via-stone-50 to-zinc-100">
      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Header with marker-style underline */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-12"
        >
          <h1 className="text-5xl font-bold text-zinc-900 mb-2 inline-block relative">
            Notification Integrations
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: '100%' }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="absolute -bottom-2 left-0 h-3 bg-gradient-to-r from-zinc-800 via-zinc-600 to-zinc-400 opacity-20"
              style={{ 
                clipPath: 'polygon(0 20%, 100% 0%, 98% 80%, 2% 100%)',
                transform: 'skewX(-2deg)'
              }}
            />
          </h1>
          <p className="text-zinc-600 mt-4 text-lg">Manage your notification channels and monitor delivery status</p>
        </motion.div>

        {/* Statistics with asymmetric design */}
        {integrations?.statistics && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative mb-12"
          >
            <div className="bg-gradient-to-br from-zinc-900 to-zinc-800 rounded-2xl shadow-2xl p-8 overflow-hidden">
              {/* Asymmetric accent border */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-zinc-700 opacity-30 rounded-bl-full" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-zinc-700 opacity-20" 
                   style={{ clipPath: 'polygon(0 0, 100% 100%, 0 100%)' }} />
              
              <h2 className="text-xl font-semibold mb-6 text-white relative z-10">Performance Overview</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
                <StatCard
                  label="Total Notifications"
                  value={integrations.statistics.totalNotifications}
                  delay={0.3}
                />
                <StatCard
                  label="Success Rate"
                  value={integrations.statistics.successRate}
                  valueColor="text-emerald-400"
                  delay={0.4}
                />
                <StatCard
                  label="Failed"
                  value={integrations.statistics.failedNotifications}
                  valueColor="text-rose-400"
                  delay={0.5}
                />
              </div>
            </div>
          </motion.div>
        )}

        {/* Integrations Grid */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="grid gap-6 mb-12"
        >
          <IntegrationCard
            title="Slack"
            description="Send notifications to your Slack workspace"
            icon="💬"
            isActive={integrations?.integrations?.slack?.isActive}
            channelName={integrations?.integrations?.slack?.channelName}
            onConnect={handleConnectSlack}
            onDisconnect={handleDisconnectSlack}
            onTest={() => window.location.href = `/dashboard/integrations/test?channel=slack`}
            delay={0.5}
          />

          <IntegrationCard
            title="Email"
            description="Send notifications via email"
            icon="📧"
            isActive={integrations?.integrations?.email?.isActive}
            channelName={integrations?.integrations?.email?.fromEmail}
            onConnect={() => window.location.href = '/dashboard/integrations/email/setup'}
            onTest={() => window.location.href = `/dashboard/integrations/test?channel=email`}
            delay={0.6}
          />

          <IntegrationCard
            title="Microsoft Teams"
            description="Send notifications to Teams channels"
            icon="👥"
            isActive={integrations?.integrations?.teams?.isActive}
            channelName={integrations?.integrations?.teams?.channelName}
            onConnect={() => window.location.href = '/dashboard/integrations/teams/setup'}
            onTest={() => window.location.href = `/dashboard/integrations/test?channel=teams`}
            delay={0.7}
          />
        </motion.div>

        {/* Recent Logs */}
        {integrations?.recentLogs && integrations.recentLogs.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="relative"
          >
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-zinc-200">
              {/* Decorative corner accent */}
              <div className="absolute top-0 left-0 w-20 h-1 bg-gradient-to-r from-zinc-800 to-transparent" />
              
              <h2 className="text-2xl font-semibold mb-6 text-zinc-900">Recent Activity</h2>
              <div className="space-y-3">
                <AnimatePresence>
                  {integrations.recentLogs.map((log, index) => (
                    <LogEntry key={log.id} log={log} index={index} />
                  ))}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

// Stat Card Component
function StatCard({ label, value, valueColor = "text-white", delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ scale: 1.05, y: -5 }}
      className="relative"
    >
      <div className="bg-zinc-800/50 backdrop-blur-sm rounded-xl p-6 border border-zinc-700/50">
        <p className="text-zinc-400 text-sm font-medium mb-2 uppercase tracking-wide">{label}</p>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: delay + 0.2 }}
          className={`text-4xl font-bold ${valueColor}`}
        >
          {value}
        </motion.p>
      </div>
    </motion.div>
  );
}

// Integration Card Component
function IntegrationCard({ title, description, icon, isActive, channelName, onConnect, onDisconnect, onTest, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ scale: 1.02, x: 8 }}
      className="relative group"
    >
      <div className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-shadow duration-300 p-8 border border-zinc-200 overflow-hidden">
        {/* Asymmetric accent line */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.6, delay: delay + 0.2 }}
          className="absolute top-0 left-0 h-1 bg-gradient-to-r from-zinc-800 via-zinc-600 to-transparent origin-left"
          style={{ width: '70%', clipPath: 'polygon(0 0, 98% 0, 100% 100%, 0 100%)' }}
        />
        
        {/* Subtle corner decoration */}
        <div className="absolute bottom-0 right-0 w-32 h-32 bg-zinc-100 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
             style={{ clipPath: 'polygon(100% 0, 100% 100%, 0 100%)' }} />

        <div className="flex items-start justify-between relative z-10">
          <div className="flex items-center gap-6">
            <motion.div
              whileHover={{ rotate: [0, -10, 10, -10, 0], scale: 1.2 }}
              transition={{ duration: 0.5 }}
              className="text-5xl"
            >
              {icon}
            </motion.div>
            <div>
              <h3 className="text-2xl font-bold text-zinc-900 mb-1">{title}</h3>
              <p className="text-zinc-600 text-sm mb-2">{description}</p>
              {isActive && channelName && (
                <motion.p
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-sm text-emerald-600 font-medium mt-2 flex items-center gap-2"
                >
                  <span className="inline-block w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                  Connected: {channelName}
                </motion.p>
              )}
            </div>
          </div>

          <div className="flex gap-3">
            {isActive ? (
              <>
                <motion.button
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onTest}
                  className="px-6 py-3 bg-zinc-900 text-white rounded-xl hover:bg-zinc-800 transition-colors text-sm font-semibold shadow-lg"
                >
                  Test
                </motion.button>
                {onDisconnect && (
                  <motion.button
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onDisconnect}
                    className="px-6 py-3 bg-zinc-100 text-zinc-700 rounded-xl hover:bg-zinc-200 transition-colors text-sm font-semibold border border-zinc-300"
                  >
                    Disconnect
                  </motion.button>
                )}
              </>
            ) : (
              <motion.button
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={onConnect}
                className="px-8 py-3 bg-gradient-to-r from-zinc-900 to-zinc-700 text-white rounded-xl hover:from-zinc-800 hover:to-zinc-600 transition-all font-semibold shadow-lg"
              >
                Connect
              </motion.button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// Log Entry Component
function LogEntry({ log, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      whileHover={{ x: 4 }}
      className={`relative p-5 rounded-xl border-l-4 ${
        log.success
          ? 'border-l-emerald-500 bg-emerald-50/50 hover:bg-emerald-50'
          : 'border-l-rose-500 bg-rose-50/50 hover:bg-rose-50'
      } transition-all duration-200`}
    >
      {/* Subtle asymmetric background accent */}
      <div
        className={`absolute top-0 right-0 w-20 h-full ${
          log.success ? 'bg-emerald-100' : 'bg-rose-100'
        } opacity-0 hover:opacity-30 transition-opacity`}
        style={{ clipPath: 'polygon(50% 0, 100% 0, 100% 100%, 70% 100%)' }}
      />

      <div className="flex justify-between items-start relative z-10">
        <div className="flex-1">
          <p className="font-semibold text-zinc-900 mb-1">{log.notificationType}</p>
          <p className="text-sm text-zinc-600 mb-1">
            <span className="font-medium">Channel:</span> {log.channels}
          </p>
          {log.error && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-sm text-rose-600 font-medium mt-2 p-2 bg-white/60 rounded"
            >
              {log.error}
            </motion.p>
          )}
        </div>
        <div className="flex flex-col items-end gap-2">
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
            className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold ${
              log.success
                ? 'bg-emerald-500 text-white'
                : 'bg-rose-500 text-white'
            }`}
          >
            {log.success ? '✓ Success' : '✗ Failed'}
          </motion.span>
          <p className="text-xs text-zinc-500 font-medium">
            {new Date(log.createdAt).toLocaleString()}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
