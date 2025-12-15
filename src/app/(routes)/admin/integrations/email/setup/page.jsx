'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  HiMail, 
  HiReply, 
  HiCheckCircle,
  HiExclamationCircle,
  HiInformationCircle,
  HiArrowLeft,
  HiLightningBolt,
  HiSparkles
} from 'react-icons/hi';
import { IoMailOpen, IoSend } from 'react-icons/io5';
import { AnimatePresence } from 'framer-motion';

export default function EmailSetupPage() {
  const router = useRouter();
  const [companyId, setCompanyId] = useState('');
  const [companyEmail, setCompanyEmail] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [replyTo, setReplyTo] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [focusedField, setFocusedField] = useState('');

  useEffect(() => {
    const fetchUser = async () => {
      const response = await fetch('/api/auth/me', {
        credentials: 'include',
      });
      const data = await response.json();
      if (data.success) {
        setCompanyId(data.employee.companyId);
        setCompanyEmail(data.employee.company.email || '');
        setRecipientEmail(data.employee.company.email || '');
        setReplyTo(data.employee.company.email || '');
      }
    };
    fetchUser();
  }, []);

  const handleSave = async () => {
    setError('');
    
    // Validate email
    if (!recipientEmail || !recipientEmail.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    setSaving(true);

    try {
      const response = await fetch('/api/integrations/email/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          companyId,
          recipientEmail,
          replyTo: replyTo || recipientEmail,
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert('Test email sent! Check your inbox.');
        router.push('/dashboard/integrations?success=email_connected');
      } else {
        setError(data.error || 'Failed to setup email');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 via-slate-50 to-stone-100 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.03, 0.06, 0.03],
          }}
          transition={{ duration: 8, repeat: Infinity }}
          className="absolute -top-1/2 -right-1/2 w-full h-full bg-gradient-to-br from-zinc-900 to-transparent rounded-full blur-3xl"
        />
      </div>

      <div className="max-w-3xl mx-auto px-6 py-12 relative z-10">
        {/* Back Button */}
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          onClick={() => router.push('/dashboard/integrations')}
          className="group flex items-center gap-2 text-zinc-600 hover:text-zinc-900 mb-8 transition-colors"
        >
          <motion.div
            whileHover={{ x: -4 }}
            transition={{ duration: 0.2 }}
          >
            <HiArrowLeft className="w-5 h-5" />
          </motion.div>
          <span className="font-semibold">Back to Integrations</span>
        </motion.button>

        {/* Main Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl p-10 border border-zinc-200/60 relative overflow-hidden"
        >
          {/* Top accent bar */}
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="absolute top-0 left-0 h-2 bg-gradient-to-r from-blue-600 via-blue-500 to-transparent origin-left"
            style={{ 
              width: '60%', 
              clipPath: 'polygon(0 0, 97% 0, 100% 100%, 0 100%)',
            }}
          />

          {/* Decorative corner */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 opacity-40 rounded-bl-[100px]" />

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mb-8 relative z-10"
          >
            <div className="flex items-center gap-4 mb-3">
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ duration: 0.5, delay: 0.4, type: "spring", stiffness: 200 }}
                className="p-4 bg-gradient-to-br from-blue-600 to-blue-500 rounded-2xl shadow-lg"
              >
                <IoMailOpen className="w-8 h-8 text-white" />
              </motion.div>
              <div>
                <h1 className="text-4xl font-bold text-zinc-900 relative inline-block">
                  Email Notifications
                  <motion.div
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 0.6, delay: 0.6 }}
                    className="absolute -bottom-1 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-600 to-transparent origin-left opacity-20"
                    style={{ clipPath: 'polygon(0 20%, 100% 0%, 95% 80%, 5% 100%)' }}
                  />
                </h1>
                <p className="text-zinc-600 mt-2">
                  Configure where you want to receive notifications
                </p>
              </div>
            </div>
          </motion.div>

          {/* Form */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="space-y-6 relative z-10"
          >
            {/* Recipient Email Input */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
            >
              <label className="block text-sm font-bold text-zinc-900 mb-3 flex items-center gap-2">
                <HiMail className="w-5 h-5 text-blue-600" />
                Recipient Email
                <span className="text-rose-500">*</span>
              </label>
              <motion.div
                animate={{
                  scale: focusedField === 'recipient' ? 1.01 : 1,
                }}
                transition={{ duration: 0.2 }}
                className="relative"
              >
                <input
                  type="email"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  onFocus={() => setFocusedField('recipient')}
                  onBlur={() => setFocusedField('')}
                  placeholder="notifications@yourcompany.com"
                  className="w-full px-5 py-4 pl-12 border-2 border-zinc-200 rounded-xl bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all duration-200 text-zinc-900 font-medium placeholder:text-zinc-400"
                />
                <HiMail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                {focusedField === 'recipient' && (
                  <motion.div
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-600 to-transparent origin-left"
                  />
                )}
              </motion.div>
              <p className="text-xs text-zinc-500 mt-2 flex items-center gap-1.5">
                <HiInformationCircle className="w-4 h-4" />
                All notifications will be sent to this email address
              </p>
            </motion.div>

            {/* Reply-To Email Input */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.7 }}
            >
              <label className="block text-sm font-bold text-zinc-900 mb-3 flex items-center gap-2">
                <HiReply className="w-5 h-5 text-zinc-600" />
                Reply-To Email
                <span className="text-zinc-400 text-xs font-normal">(Optional)</span>
              </label>
              <motion.div
                animate={{
                  scale: focusedField === 'replyTo' ? 1.01 : 1,
                }}
                transition={{ duration: 0.2 }}
                className="relative"
              >
                <input
                  type="email"
                  value={replyTo}
                  onChange={(e) => setReplyTo(e.target.value)}
                  onFocus={() => setFocusedField('replyTo')}
                  onBlur={() => setFocusedField('')}
                  placeholder="support@yourcompany.com"
                  className="w-full px-5 py-4 pl-12 border-2 border-zinc-200 rounded-xl bg-white focus:border-zinc-500 focus:ring-4 focus:ring-zinc-500/10 transition-all duration-200 text-zinc-900 font-medium placeholder:text-zinc-400"
                />
                <HiReply className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                {focusedField === 'replyTo' && (
                  <motion.div
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-zinc-600 to-transparent origin-left"
                  />
                )}
              </motion.div>
              <p className="text-xs text-zinc-500 mt-2 flex items-center gap-1.5">
                <HiInformationCircle className="w-4 h-4" />
                Email address for replies (defaults to recipient email)
              </p>
            </motion.div>

            {/* Info Box */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.8 }}
              className="relative p-5 bg-gradient-to-r from-blue-50/80 to-blue-50/40 border-l-4 border-blue-500 rounded-xl overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-blue-100 opacity-30 rounded-bl-full" />
              <div className="flex items-start gap-3 relative z-10">
                <div className="p-2 bg-blue-500 rounded-lg">
                  <HiLightningBolt className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-bold text-blue-900 mb-1">
                    Sender Information
                  </p>
                  <p className="text-sm text-blue-800">
                    Emails will be sent from{' '}
                    <code className="bg-blue-100 px-2 py-0.5 rounded font-semibold text-blue-900">
                      notifications@yourdomain.com
                    </code>
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Error Message */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: 'auto' }}
                  exit={{ opacity: 0, y: -10, height: 0 }}
                  className="relative p-4 bg-gradient-to-r from-rose-50 to-rose-50/40 border-l-4 border-rose-500 rounded-xl overflow-hidden"
                >
                  <div className="flex items-start gap-3">
                    <HiExclamationCircle className="w-6 h-6 text-rose-600 flex-shrink-0 mt-0.5" />
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
              transition={{ duration: 0.5, delay: 0.9 }}
              className="flex gap-4 pt-4"
            >
              <motion.button
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSave}
                disabled={!recipientEmail || saving}
                className="group flex-1 px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl hover:from-blue-700 hover:to-blue-600 disabled:from-zinc-300 disabled:to-zinc-300 disabled:cursor-not-allowed transition-all font-bold shadow-lg hover:shadow-xl disabled:shadow-none flex items-center justify-center gap-3 relative overflow-hidden"
              >
                {saving ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                      <HiSparkles className="w-5 h-5" />
                    </motion.div>
                    Sending Test Email...
                  </>
                ) : (
                  <>
                    <IoSend className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    Save & Send Test
                    <motion.div
                      initial={{ scaleX: 0 }}
                      whileHover={{ scaleX: 1 }}
                      className="absolute bottom-0 left-0 right-0 h-1 bg-white/30 origin-left"
                    />
                  </>
                )}
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => router.push('/dashboard/integrations')}
                className="px-8 py-4 bg-zinc-100 text-zinc-700 rounded-xl hover:bg-zinc-200 transition-all font-bold border-2 border-zinc-200 hover:border-zinc-300 shadow-sm"
              >
                Cancel
              </motion.button>
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Features Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8"
        >
          <FeatureCard
            icon={<HiCheckCircle className="w-6 h-6" />}
            title="Instant Delivery"
            description="Get notifications in real-time"
            delay={1.1}
          />
          <FeatureCard
            icon={<HiLightningBolt className="w-6 h-6" />}
            title="Reliable"
            description="99.9% delivery success rate"
            delay={1.2}
          />
          <FeatureCard
            icon={<HiSparkles className="w-6 h-6" />}
            title="Customizable"
            description="Tailor to your preferences"
            delay={1.3}
          />
        </motion.div>
      </div>
    </div>
  );
}

// Feature Card Component
function FeatureCard({ icon, title, description, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ y: -4, scale: 1.02 }}
      className="p-5 bg-white/80 backdrop-blur-sm rounded-2xl border border-zinc-200/60 shadow-md hover:shadow-lg transition-all relative overflow-hidden group"
    >
      {/* Hover gradient */}
      <motion.div
        initial={{ opacity: 0 }}
        whileHover={{ opacity: 1 }}
        className="absolute inset-0 bg-gradient-to-br from-zinc-50 to-transparent"
      />
      
      <div className="relative z-10">
        <div className="p-2.5 bg-zinc-900 text-white rounded-xl w-fit mb-3 group-hover:scale-110 transition-transform">
          {icon}
        </div>
        <h3 className="font-bold text-zinc-900 mb-1">{title}</h3>
        <p className="text-sm text-zinc-600">{description}</p>
      </div>
      
      {/* Corner accent */}
      <div className="absolute bottom-0 right-0 w-16 h-16 bg-zinc-100 opacity-0 group-hover:opacity-100 transition-opacity" 
           style={{ clipPath: 'polygon(100% 50%, 100% 100%, 50% 100%)' }} />
    </motion.div>
  );
}
