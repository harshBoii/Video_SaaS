'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { BsMicrosoft } from 'react-icons/bs';
import { 
  HiArrowLeft,
  HiCheckCircle,
  HiExclamationCircle,
  HiInformationCircle,
  HiLightningBolt,
  HiSparkles,
  HiClipboardList,
  HiChevronDown,
  HiChevronUp
} from 'react-icons/hi';
import { 
  IoSend,
  IoAlertCircle,
  IoCheckmarkDone,
  IoLink
} from 'react-icons/io5';

export default function TeamsSetupPage() {
  const router = useRouter();
  const [companyId, setCompanyId] = useState('');
  const [webhookUrl, setWebhookUrl] = useState('');
  const [channelName, setChannelName] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [focusedField, setFocusedField] = useState('');
  const [showInstructions, setShowInstructions] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      const response = await fetch('/api/auth/me', {
        credentials: 'include',
      });
      const data = await response.json();
      if (data.success) {
        setCompanyId(data.employee.companyId);
      }
    };
    fetchUser();
  }, []);

  const handleSave = async () => {
    setError('');
    
    if (!webhookUrl.includes('webhook.office.com')) {
      setError('Invalid Teams webhook URL. Please check and try again.');
      return;
    }

    setSaving(true);

    try {
      const response = await fetch('/api/integrations/teams/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          companyId,
          webhookUrl,
          channelName,
        }),
      });

      const data = await response.json();

      if (data.success) {
        router.push('/admin/integrations?success=teams_connected');
      } else {
        setError(data.error || 'Failed to save Teams integration');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 via-slate-50 to-stone-100 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.03, 0.06, 0.03],
          }}
          transition={{ duration: 8, repeat: Infinity }}
          className="absolute -top-1/2 -right-1/2 w-full h-full bg-gradient-to-br from-[#5059C9] to-transparent rounded-full blur-3xl"
        />
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8 relative z-10">
        {/* Back Button */}
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          onClick={() => router.push('/admin/integrations')}
          className="group flex items-center gap-2 text-zinc-600 hover:text-zinc-900 mb-6 transition-colors"
        >
          <motion.div whileHover={{ x: -4 }} transition={{ duration: 0.2 }}>
            <HiArrowLeft className="w-5 h-5" />
          </motion.div>
          <span className="font-semibold">Back to Integrations</span>
        </motion.button>

        {/* Main Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl p-8 border border-zinc-200/60 relative overflow-hidden"
        >
          {/* Top accent bar */}
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="absolute top-0 left-0 h-2 bg-gradient-to-r from-[#5059C9] via-[#4049B9] to-transparent origin-left"
            style={{ width: '60%', clipPath: 'polygon(0 0, 97% 0, 100% 100%, 0 100%)' }}
          />

          {/* Decorative corner */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#5059C9]/5 opacity-40 rounded-bl-[100px]" />

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="mb-6 relative z-10"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ duration: 0.4, delay: 0.2, type: "spring", stiffness: 200 }}
                  className="p-3 bg-gradient-to-br from-[#5059C9] to-[#4049B9] rounded-2xl shadow-lg"
                >
                  <BsMicrosoft className="w-7 h-7 text-white" />
                </motion.div>
                <div>
                  <h1 className="text-3xl font-bold text-zinc-900 relative inline-block">
                    Setup Microsoft Teams
                    <motion.div
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{ duration: 0.4, delay: 0.3 }}
                      className="absolute -bottom-1 left-0 right-0 h-1 bg-gradient-to-r from-[#5059C9] to-transparent origin-left opacity-20"
                      style={{ clipPath: 'polygon(0 20%, 100% 0%, 95% 80%, 5% 100%)' }}
                    />
                  </h1>
                  <p className="text-zinc-600 text-sm mt-1">
                    Connect your Teams channel to receive notifications
                  </p>
                </div>
              </div>

              {/* Quick Help Link */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push('/admin/integrations/teams/help')}
                className="flex items-center gap-2 px-4 py-2 bg-[#5059C9]/10 hover:bg-[#5059C9]/20 rounded-xl transition-colors text-sm font-semibold text-[#5059C9]"
              >
                <HiInformationCircle className="w-5 h-5" />
                Detailed Guide
              </motion.button>
            </div>
          </motion.div>

          {/* Collapsible Instructions */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="mb-6 relative z-10"
          >
            <motion.button
              onClick={() => setShowInstructions(!showInstructions)}
              whileHover={{ x: 2 }}
              className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-[#5059C9]/5 to-[#5059C9]/10 border-l-4 border-[#5059C9] rounded-xl hover:from-[#5059C9]/10 hover:to-[#5059C9]/15 transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#5059C9] rounded-lg">
                  <HiClipboardList className="w-4 h-4 text-white" />
                </div>
                <span className="font-bold text-zinc-900">How to get your webhook URL</span>
                <span className="text-xs px-2 py-1 bg-[#5059C9]/20 text-[#5059C9] rounded-full font-semibold">
                  Quick Setup
                </span>
              </div>
              <motion.div
                animate={{ rotate: showInstructions ? 180 : 0 }}
                transition={{ duration: 0.3 }}
              >
                <HiChevronDown className="w-5 h-5 text-[#5059C9]" />
              </motion.div>
            </motion.button>

            <AnimatePresence>
              {showInstructions && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="p-4 bg-zinc-50/50 rounded-b-xl border-x border-b border-zinc-200">
                    <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm text-zinc-700">
                      {[
                        'Open Microsoft Teams',
                        'Go to the channel where you want notifications',
                        'Click the (...) next to channel name',
                        'Select Connectors or Manage channel',
                        'Search for "Incoming Webhook"',
                        'Click Configure',
                        'Give it a name and click Create',
                        'Copy the webhook URL and paste below'
                      ].map((step, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.03 }}
                          className="flex items-start gap-2"
                        >
                          <div className="flex-shrink-0 w-5 h-5 bg-[#5059C9] text-white rounded-full flex items-center justify-center text-xs font-bold mt-0.5">
                            {idx + 1}
                          </div>
                          <span className="leading-relaxed pt-0.5">{step}</span>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Form - Two Column Layout */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.3 }}
            className="relative z-10"
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Channel Name Input */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.35 }}
              >
                <label className="block text-sm font-bold text-zinc-900 mb-2 flex items-center gap-2">
                  <BsMicrosoft className="w-4 h-4 text-[#5059C9]" />
                  Channel Name
                  <span className="text-zinc-400 text-xs font-normal">(Optional)</span>
                </label>
                <motion.div
                  animate={{ scale: focusedField === 'channelName' ? 1.01 : 1 }}
                  transition={{ duration: 0.2 }}
                  className="relative"
                >
                  <input
                    type="text"
                    value={channelName}
                    onChange={(e) => setChannelName(e.target.value)}
                    onFocus={() => setFocusedField('channelName')}
                    onBlur={() => setFocusedField('')}
                    placeholder="e.g., Notifications"
                    className="w-full px-4 py-3 border-2 border-zinc-200 rounded-xl bg-white focus:border-[#5059C9] focus:ring-4 focus:ring-[#5059C9]/10 transition-all duration-200 text-zinc-900 font-medium placeholder:text-zinc-400"
                  />
                  {focusedField === 'channelName' && (
                    <motion.div
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#5059C9] to-transparent origin-left"
                    />
                  )}
                </motion.div>
                <p className="text-xs text-zinc-500 mt-1.5 flex items-center gap-1">
                  <HiInformationCircle className="w-3.5 h-3.5" />
                  Help you remember which channel this is
                </p>
              </motion.div>

              {/* Webhook URL Input */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.4 }}
                className="lg:col-span-2"
              >
                <label className="block text-sm font-bold text-zinc-900 mb-2 flex items-center gap-2">
                  <IoLink className="w-4 h-4 text-[#5059C9]" />
                  Webhook URL
                  <span className="text-rose-500">*</span>
                </label>
                <motion.div
                  animate={{ scale: focusedField === 'webhookUrl' ? 1.01 : 1 }}
                  transition={{ duration: 0.2 }}
                  className="relative"
                >
                  <textarea
                    value={webhookUrl}
                    onChange={(e) => setWebhookUrl(e.target.value)}
                    onFocus={() => setFocusedField('webhookUrl')}
                    onBlur={() => setFocusedField('')}
                    placeholder="https://yourcompany.webhook.office.com/webhookb2/..."
                    rows={2}
                    className="w-full px-4 py-3 border-2 border-zinc-200 rounded-xl bg-white focus:border-[#5059C9] focus:ring-4 focus:ring-[#5059C9]/10 transition-all duration-200 text-zinc-900 font-mono text-sm placeholder:text-zinc-400 resize-none"
                  />
                  {focusedField === 'webhookUrl' && (
                    <motion.div
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#5059C9] to-transparent origin-left"
                    />
                  )}
                </motion.div>
                <p className="text-xs text-zinc-500 mt-1.5 flex items-center gap-1">
                  <HiInformationCircle className="w-3.5 h-3.5" />
                  Should start with: https://...webhook.office.com/
                </p>
              </motion.div>
            </div>

            {/* Error Message */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: 'auto' }}
                  exit={{ opacity: 0, y: -10, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="mt-4 relative p-3 bg-gradient-to-r from-rose-50 to-rose-50/40 border-l-4 border-rose-500 rounded-xl overflow-hidden"
                >
                  <div className="flex items-start gap-2">
                    <HiExclamationCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm font-semibold text-rose-800 leading-relaxed">
                      {error}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.45 }}
              className="flex gap-3 mt-6"
            >
              <motion.button
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSave}
                disabled={!webhookUrl || saving}
                className="group flex-1 px-6 py-3 bg-gradient-to-r from-[#5059C9] to-[#4049B9] text-white rounded-xl hover:from-[#4049B9] hover:to-[#3039A9] disabled:from-zinc-300 disabled:to-zinc-300 disabled:cursor-not-allowed transition-all font-bold shadow-lg hover:shadow-xl disabled:shadow-none flex items-center justify-center gap-2 relative overflow-hidden"
              >
                {saving ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                      <HiSparkles className="w-5 h-5" />
                    </motion.div>
                    Saving & Testing...
                  </>
                ) : (
                  <>
                    <IoSend className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    Save & Test
                  </>
                )}
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => router.push('/admin/integrations')}
                className="px-6 py-3 bg-zinc-100 text-zinc-700 rounded-xl hover:bg-zinc-200 transition-all font-bold border-2 border-zinc-200 hover:border-zinc-300 shadow-sm"
              >
                Cancel
              </motion.button>
            </motion.div>
          </motion.div>

          {/* Compact Troubleshooting Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.5 }}
            className="mt-6 pt-6 border-t border-zinc-200 relative z-10"
          >
            <div className="flex items-center gap-2 mb-3">
              <IoAlertCircle className="w-5 h-5 text-amber-600" />
              <h4 className="font-bold text-zinc-900">Troubleshooting</h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div className="p-3 bg-zinc-50 rounded-lg border border-zinc-200">
                <p className="font-semibold text-zinc-900 mb-1 text-xs">Can't find Connectors?</p>
                <p className="text-xs text-zinc-600">Use a Standard channel, not Private.</p>
              </div>
              <div className="p-3 bg-zinc-50 rounded-lg border border-zinc-200">
                <p className="font-semibold text-zinc-900 mb-1 text-xs">Webhook not working?</p>
                <p className="text-xs text-zinc-600">The URL might be regenerated. Create a new one.</p>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Compact Features Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.6 }}
          className="grid grid-cols-3 gap-3 mt-6"
        >
          <FeatureCard
            icon={<HiCheckCircle className="w-5 h-5" />}
            title="Real-time"
            description="Instant notifications"
          />
          <FeatureCard
            icon={<HiLightningBolt className="w-5 h-5" />}
            title="Reliable"
            description="99.9% uptime"
          />
          <FeatureCard
            icon={<IoCheckmarkDone className="w-5 h-5" />}
            title="Easy Setup"
            description="5-min config"
          />
        </motion.div>
      </div>
    </div>
  );
}

// Compact Feature Card Component
function FeatureCard({ icon, title, description }) {
  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.03 }}
      transition={{ duration: 0.2 }}
      className="p-4 bg-white/80 backdrop-blur-sm rounded-xl border border-zinc-200/60 shadow-sm hover:shadow-md transition-all relative overflow-hidden group"
    >
      <motion.div
        initial={{ opacity: 0 }}
        whileHover={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
        className="absolute inset-0 bg-gradient-to-br from-[#5059C9]/5 to-transparent"
      />
      
      <div className="relative z-10">
        <div className="p-2 bg-[#5059C9] text-white rounded-lg w-fit mb-2 group-hover:scale-110 transition-transform">
          {icon}
        </div>
        <h3 className="font-bold text-zinc-900 text-sm mb-0.5">{title}</h3>
        <p className="text-xs text-zinc-600">{description}</p>
      </div>
    </motion.div>
  );
}
