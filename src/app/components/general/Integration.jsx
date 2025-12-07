// app/components/IntegrationModule.js
'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const sections = [
  {
    id: 'slack',
    title: 'Slack',
    description: 'Connect Slack to send alerts, approvals, and workflow notifications.',
    items: [
      {
        name: 'Slack Workspace',
        description: 'Install the Slack app and grant permissions for your workspace.',
        href: 'https://slack.com/oauth/v2/authorize', // Slack OAuth base URL [web:22]
        pill: 'OAuth 2.0',
      },
    ],
  },
  {
    id: 'comms',
    title: 'SMTP + Twilio',
    description: 'Connect email, WhatsApp, and SMS providers for messaging workflows.',
    items: [
      {
        name: 'Google SMTP (Gmail)',
        description:
          'Use your Google Workspace / Gmail SMTP credentials for transactional email.',
        href: 'https://console.cloud.google.com/apis/credentials', // Google Cloud credentials [web:30][web:35]
        pill: 'SMTP + OAuth',
      },
      {
        name: 'Twilio SMS',
        description: 'Send SMS and WhatsApp notifications via Twilio Programmable Messaging.',
        href: 'https://console.twilio.com/us1/develop/sms/settings', // Twilio console [web:32]
        pill: 'SMS + WhatsApp',
      },
      {
        name: 'Custom SMTP',
        description: 'Connect any SMTP provider using host, port, and credentials.',
        href: 'mailto:support@example.com?subject=Configure%20Custom%20SMTP',
        pill: 'Generic SMTP',
      },
    ],
  },
  {
    id: 'creative',
    title: 'Creative Tools',
    description: 'Connect your design and editing tools for streamlined asset workflows.',
    items: [
      {
        name: 'Adobe Lightroom',
        description: 'Connect Lightroom via plugin and API key to sync and manage assets.',
        href: 'https://account.adobe.com/apps',
        pill: 'Plugin + API Key',
      },
      {
        name: 'Adobe Premiere Pro',
        description: 'Manage video project integrations and export workflows.',
        href: 'https://account.adobe.com/apps',
        pill: 'Desktop App',
      },
      {
        name: 'Canva',
        description: 'Connect Canva apps to import/export designs programmatically.',
        href: 'https://www.canva.dev/docs/apps/authenticating-users/oauth/',
        pill: 'OAuth App',
      },
    ],
  },
];

const cardVariants = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
};

export default function IntegrationModule() {
  const [loading, setLoading] = useState(false);
  const [pendingHref, setPendingHref] = useState(null);

  // After 60 seconds, open the link and hide loader
  useEffect(() => {
    if (!loading || !pendingHref) return;
    const timer = setTimeout(() => {
      window.open(pendingHref, '_blank', 'noopener,noreferrer');
      setLoading(false);
      setPendingHref(null);
    }, 60000); // 60,000 ms = 1 minute

    return () => clearTimeout(timer);
  }, [loading, pendingHref]);

  const handleConnectClick = (href) => {
    setPendingHref(href);
    setLoading(true);
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-slate-50 via-white to-sky-50 py-10 px-4 sm:px-6 lg:px-10">
      {/* Loading Overlay */}
      <AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.9, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 10, opacity: 0 }}
              className="flex flex-col items-center gap-4 rounded-2xl border border-slate-200 bg-white px-8 py-6 shadow-xl max-w-sm text-center"
            >
              <div className="relative inline-flex h-12 w-12 items-center justify-center">
                <span className="absolute inline-flex h-12 w-12 animate-ping rounded-full bg-sky-300/60" />
                <span className="relative inline-flex h-10 w-10 rounded-full bg-sky-500" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  Preparing secure connection…
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  This may take up to 1 minute while we initialize the provider session.
                </p>
              </div>
              <p className="text-[11px] text-slate-400">
                Do not close this window. You’ll be redirected automatically.
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-6xl mx-auto space-y-8">
        {/* Page Header */}
        <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-semibold text-slate-900 tracking-tight">
              Integration Hub
            </h1>
            <p className="mt-2 text-sm md:text-base text-slate-600 max-w-2xl">
              Connect your communication channels and creative tools. Each integration opens a
              secure authentication or configuration flow in a separate tab.
            </p>
          </div>
          <div className="flex gap-2 text-xs text-slate-500">
            <span className="px-2.5 py-1 rounded-full border border-emerald-300 bg-emerald-50 text-emerald-700">
              Live workspace
            </span>
            <span className="px-2.5 py-1 rounded-full border border-slate-200 bg-white text-slate-600">
              OAuth & API based
            </span>
          </div>
        </header>

        {/* Sections */}
        <div className="grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,1.1fr)]">
          <div className="space-y-8">
            {sections.map((section, idx) => (
              <motion.section
                key={section.id}
                variants={cardVariants}
                initial="initial"
                animate="animate"
                transition={{ duration: 0.35, delay: idx * 0.08 }}
                className="rounded-2xl border border-slate-200 bg-white/80 shadow-[0_14px_40px_rgba(15,23,42,0.08)] overflow-hidden"
              >
                <div className="border-b border-slate-200 px-5 sm:px-6 py-4 flex items-center justify-between bg-slate-50/70">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                      {section.title}
                      <span className="inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.7)]" />
                    </h2>
                    <p className="mt-1 text-xs text-slate-500">{section.description}</p>
                  </div>
                </div>

                <div className="divide-y divide-slate-100">
                  {section.items.map((item) => (
                    <div
                      key={item.name}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 sm:px-6 py-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-slate-900">{item.name}</p>
                          {item.pill && (
                            <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-slate-600 border border-slate-200">
                              {item.pill}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 max-w-md">{item.description}</p>
                      </div>

                      <div className="flex items-center gap-2 sm:justify-end">
                        <motion.button
                          type="button"
                          whileHover={{ scale: loading ? 1 : 1.02, y: loading ? 0 : -1 }}
                          whileTap={{ scale: loading ? 1 : 0.97, y: 0 }}
                          disabled={loading}
                          onClick={() => handleConnectClick(item.href)}
                          className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-50 transition-colors ${
                            loading
                              ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                              : 'bg-sky-500 text-white hover:bg-sky-400'
                          }`}
                        >
                          {loading ? 'Preparing…' : 'Connect'}
                          {!loading && (
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-3.5 w-3.5"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path d="M12.293 2.293a1 1 0 0 1 1.414 0l4 4A1 1 0 0 1 17 8h-4a1 1 0 1 1 0-2h1.586L11 2.414a1 1 0 0 1 0-1.414z" />
                              <path d="M5 4a1 1 0 0 1 1-1h3a1 1 0 1 1 0 2H7v10h6v-2a1 1 0 1 1 2 0v3a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1z" />
                            </svg>
                          )}
                        </motion.button>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.section>
            ))}
          </div>

          {/* Right rail – helper / status */}
            <motion.aside
            variants={cardVariants}
            initial="initial"
            animate="animate"
            transition={{ duration: 0.4, delay: 0.15 }}
            className="space-y-4"
            >
            <div className="rounded-2xl border border-slate-200 bg-white/80 p-5 shadow-[0_14px_40px_rgba(15,23,42,0.08)]">
                <div className="flex items-start gap-3 mb-3">
                <div className="flex-shrink-0 pt-0.5">
                    <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                </div>
                <h3 className="text-sm font-semibold text-slate-900 flex-1">
                    Integration Status
                </h3>
                </div>
                <div className="space-y-2">
                <div className="flex items-center justify-between py-1">
                    <span className="text-xs text-slate-500">Slack Workspace</span>
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-medium rounded-full">Pending</span>
                </div>
                <div className="flex items-center justify-between py-1">
                    <span className="text-xs text-slate-500">Google SMTP</span>
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-medium rounded-full">Connected</span>
                </div>
                <div className="flex items-center justify-between py-1">
                    <span className="text-xs text-slate-500">Twilio SMS</span>
                    <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-medium rounded-full">Configure</span>
                </div>
                <div className="flex items-center justify-between py-1">
                    <span className="text-xs text-slate-500">Creative Tools</span>
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-medium rounded-full">Pending</span>
                </div>
                </div>
                <button className="mt-3 w-full text-xs bg-slate-50 hover:bg-slate-100 text-slate-700 font-medium py-1.5 px-3 rounded-lg border border-slate-200 transition-colors">
                View All Connections
                </button>
            </div>

            <div className="rounded-2xl border border-indigo-200 bg-indigo-50/80 p-5 shadow-[0_8px_25px_rgba(99,102,241,0.12)]">
                <div className="flex items-start gap-3 mb-3">
                <div className="flex-shrink-0 pt-0.5">
                    <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                    </svg>
                </div>
                <h3 className="text-sm font-semibold text-slate-900">
                    Quick Start Guide
                </h3>
                </div>
                <div className="space-y-1.5">
                <div className="flex items-start gap-2 text-xs text-slate-700">
                    <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full mt-1.5 flex-shrink-0" />
                    <span>Start with Slack for team notifications</span>
                </div>
                <div className="flex items-start gap-2 text-xs text-slate-700">
                    <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full mt-1.5 flex-shrink-0" />
                    <span>Configure Twilio SMS for customer alerts</span>
                </div>
                <div className="flex items-start gap-2 text-xs text-slate-700">
                    <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full mt-1.5 flex-shrink-0" />
                    <span>Connect creative tools last for asset workflows</span>
                </div>
                </div>
            </div>

            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                <div className="flex items-center gap-2 text-xs">
                <svg className="w-4 h-4 text-emerald-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-emerald-800 font-medium">Google SMTP is ready. Test connection now.</span>
                </div>
            </div>
            </motion.aside>
        </div>
      </div>
    </div>
  );
}
