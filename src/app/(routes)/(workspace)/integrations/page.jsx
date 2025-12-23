'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { getSlackOAuthUrl } from '@/app/lib/integrations/slack-oauth';
import { SiSlack } from 'react-icons/si';
import { 
  HiMail, 
  HiCheckCircle, 
  HiArrowRight,
  HiBell
} from 'react-icons/hi';
import { BsMicrosoft } from 'react-icons/bs';

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

        if (!response.ok) throw new Error('Not authenticated');

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

  const handleConnectEmail = () => {
    window.location.href = '/integrations/email/setup';
  };

  const handleDisconnectEmail = async () => {
    if (!confirm('Disconnect email notifications?')) return;
    try {
      await fetch(`/api/integrations/email/setup?companyId=${companyId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      fetchIntegrationStatus();
    } catch (error) {
      console.error('Error disconnecting email:', error);
    }
  };

  const handleConnectTeams = () => {
    window.location.href = '/integrations/teams/setup';
  };

  const handleDisconnectTeams = async () => {
    if (!confirm('Disconnect Microsoft Teams integration?')) return;
    try {
      await fetch(`/api/integrations/teams/setup?companyId=${companyId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      fetchIntegrationStatus();
    } catch (error) {
      console.error('Error disconnecting Teams:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-12 h-12 border-4 border-[var(--glass-border)] border-t-primary rounded-full"
          />
          <p className="text-muted-foreground font-semibold">Loading integrations...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Subtle background gradient */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -right-1/2 w-full h-full bg-gradient-to-br from-zinc-900/3 to-transparent rounded-full blur-3xl" />
      </div>

      <div className="max-w-5xl mx-auto px-6 py-10 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-10"
        >
          <div className="flex items-center gap-3 mb-2">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.3, delay: 0.1, type: "spring" }}
              className="p-2.5 bg-gradient-to-br from-primary to-primary/70 rounded-xl shadow-lg"
            >
              <HiBell className="w-6 h-6 text-primary-foreground" />
            </motion.div>
            <h1 className="text-4xl font-bold text-foreground tracking-tight relative inline-block">
              Notification Integrations
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="absolute -bottom-1 left-0 w-3/4 h-1.5 bg-gradient-to-r from-primary via-primary/60 to-transparent origin-left opacity-30"
                style={{ clipPath: 'polygon(0 30%, 100% 0%, 97% 70%, 3% 100%)' }}
              />
            </h1>
          </div>
          <p className="text-muted-foreground ml-12">
            Connect your preferred notification channels
          </p>
        </motion.div>

        {/* Integration Cards */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="space-y-5"
        >
          <IntegrationCard
            title="Slack"
            description="Send real-time notifications to your Slack workspace"
            icon={<SiSlack className="w-10 h-10" />}
            iconColor="text-[#4A154B]"
            iconBg="bg-[#4A154B]/10"
            accentColor="from-[#4A154B]"
            isActive={integrations?.integrations?.slack?.isActive}
            channelName={integrations?.integrations?.slack?.channelName}
            onConnect={handleConnectSlack}
            onDisconnect={handleDisconnectSlack}
            onTest={() => window.location.href = `/integrations/test?channel=slack`}
            delay={0.4}
          />

          <IntegrationCard
            title="Email"
            description="Deliver notifications directly to team inboxes"
            icon={<HiMail className="w-10 h-10" />}
            iconColor="text-blue-600"
            iconBg="bg-blue-600/10"
            accentColor="from-blue-600"
            isActive={integrations?.integrations?.email?.isActive}
            channelName={integrations?.integrations?.email?.fromEmail}
            onConnect={handleConnectEmail}
            onDisconnect={handleDisconnectEmail}
            onTest={() => window.location.href = `/integrations/test?channel=email`}
            delay={0.5}
          />

          <IntegrationCard
            title="Microsoft Teams"
            description="Post notifications to Teams channels for collaboration"
            icon={<BsMicrosoft className="w-10 h-10" />}
            iconColor="text-[#5059C9]"
            iconBg="bg-[#5059C9]/10"
            accentColor="from-[#5059C9]"
            isActive={integrations?.integrations?.teams?.isActive}
            channelName={integrations?.integrations?.teams?.channelName}
            onConnect={handleConnectTeams}
            onDisconnect={handleDisconnectTeams}
            onTest={() => window.location.href = `/integrations/test?channel=teams`}
            delay={0.6}
          />
        </motion.div>
      </div>
    </div>
  );
}

function IntegrationCard({ 
  title, 
  description, 
  icon, 
  iconColor,
  iconBg,
  accentColor,
  isActive, 
  channelName, 
  onConnect, 
  onDisconnect, 
  onTest, 
  delay 
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, delay }}
      whileHover={{ scale: 1.01, x: 4 }}
      className="relative group"
    >
      <div className="glass-card hover:shadow-xl transition-all duration-300 p-6 overflow-hidden relative">
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.5, delay: delay + 0.1 }}
          className={`absolute top-0 left-0 h-1 bg-gradient-to-r ${accentColor} to-transparent origin-left`}
          style={{ width: '50%', clipPath: 'polygon(0 0, 96% 0, 100% 100%, 0 100%)' }}
        />
        
        <motion.div
          initial={{ opacity: 0 }}
          whileHover={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="absolute bottom-0 right-0 w-40 h-40 bg-gradient-to-tl from-zinc-50 to-transparent rounded-tl-full"
        />

        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-5 flex-1">
            <motion.div
              whileHover={{ rotate: [0, -10, 10, 0], scale: 1.1 }}
              transition={{ duration: 0.5 }}
              className={`${iconBg} ${iconColor} p-4 rounded-xl shadow-md relative`}
            >
              {icon}
              {isActive && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white shadow-md"
                >
                  <motion.div
                    animate={{ scale: [1, 1.4, 1], opacity: [0.7, 0, 0.7] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute inset-0 bg-emerald-500 rounded-full"
                  />
                </motion.div>
              )}
            </motion.div>
            
            <div className="flex-1 min-w-0">
              <h3 className="text-xl font-bold text-foreground mb-1">{title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
              
              {isActive && channelName && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-50 rounded-lg border border-emerald-200/60"
                >
                  <HiCheckCircle className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-semibold text-emerald-700">
                    Connected: <span className="font-bold">{channelName}</span>
                  </span>
                </motion.div>
              )}
            </div>
          </div>

          <div className="flex gap-2.5 ml-4 flex-shrink-0">
            {isActive ? (
              <>
                <motion.button
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onTest}
                  className="group px-5 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all text-sm font-bold shadow-md hover:shadow-lg flex items-center gap-1.5"
                >
                  Test
                  <HiArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </motion.button>
                {onDisconnect && (
                  <motion.button
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onDisconnect}
                    className="px-5 py-2.5 bg-[var(--glass-hover)] text-foreground rounded-lg hover:bg-[var(--glass-active)] transition-all text-sm font-bold border border-[var(--glass-border)]"
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
                className="group px-6 py-2.5 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground rounded-lg hover:from-primary/90 hover:to-primary/70 transition-all font-bold shadow-lg hover:shadow-xl flex items-center gap-1.5"
              >
                Connect
                <HiArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </motion.button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
