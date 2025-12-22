'use client';

import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { BsMicrosoft } from 'react-icons/bs';
import { 
  HiArrowLeft,
  HiCheckCircle,
  HiClipboardCopy,
  HiExternalLink,
  HiLightningBolt,
  HiCog,
  HiLink,
  HiSparkles
} from 'react-icons/hi';
import { IoRocket, IoCreate } from 'react-icons/io5';
import { useState } from 'react';

export default function TeamsHelpPage() {
  const router = useRouter();
  const [copiedStep, setCopiedStep] = useState(null);

  const exampleWebhookUrl = "https://yourcompany.webhook.office.com/webhookb2/abc123-def-456.../IncomingWebhook/...";

  const handleCopy = (step) => {
    navigator.clipboard.writeText(exampleWebhookUrl);
    setCopiedStep(step);
    setTimeout(() => setCopiedStep(null), 2000);
  };

  const steps = [
    { number: 1, title: "Open Microsoft Teams", description: "Navigate to the channel where you want to receive notifications", icon: <BsMicrosoft className="w-8 h-8" />, iconColor: "text-[#5059C9]", iconBg: "bg-[#5059C9]/10", delay: 0.2 },
    { number: 2, title: "Access Connectors", description: "Click the three dots (...) next to the channel name, then select Connectors or Manage channel", icon: <HiCog className="w-8 h-8" />, iconColor: "text-purple-600", iconBg: "bg-purple-600/10", delay: 0.3 },
    { number: 3, title: "Add Incoming Webhook", description: "Configure your webhook connector", icon: <IoCreate className="w-8 h-8" />, iconColor: "text-blue-600", iconBg: "bg-blue-600/10", delay: 0.4, substeps: ["Search for 'Incoming Webhook'", "Click 'Configure' or 'Add'", "Give it a name (e.g., 'MyApp Notifications')", "Upload a logo (optional)", "Click 'Create'"] },
    { number: 4, title: "Copy Webhook URL", description: "Save your unique webhook URL securely", icon: <HiLink className="w-8 h-8" />, iconColor: "text-emerald-600", iconBg: "bg-emerald-600/10", delay: 0.5 },
    { number: 5, title: "Connect in Your App", description: "Return to the setup page and paste your webhook URL", icon: <IoRocket className="w-8 h-8" />, iconColor: "text-orange-600", iconBg: "bg-orange-600/10", delay: 0.6 }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 via-slate-50 to-stone-100 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.03, 0.06, 0.03] }} transition={{ duration: 8, repeat: Infinity }} className="absolute -top-1/2 -right-1/2 w-full h-full bg-gradient-to-br from-[#5059C9] to-transparent rounded-full blur-3xl" />
      </div>

      <div className="max-w-5xl mx-auto px-6 py-12 relative z-10">
        <motion.button initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }} onClick={() => router.back()} className="group flex items-center gap-2 text-zinc-600 hover:text-zinc-900 mb-8 transition-colors">
          <motion.div whileHover={{ x: -4 }} transition={{ duration: 0.2 }}><HiArrowLeft className="w-5 h-5" /></motion.div>
          <span className="font-semibold">Back</span>
        </motion.button>

        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="mb-12">
          <div className="flex items-center gap-4 mb-4">
            <motion.div initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }} transition={{ duration: 0.5, delay: 0.2, type: "spring", stiffness: 200 }} className="p-4 bg-gradient-to-br from-[#5059C9] to-[#4049B9] rounded-2xl shadow-xl">
              <BsMicrosoft className="w-10 h-10 text-white" />
            </motion.div>
            <div>
              <h1 className="text-5xl font-bold text-zinc-900">Teams Setup Guide</h1>
              <p className="text-zinc-600 text-lg mt-2">Connect Microsoft Teams to receive notifications</p>
            </div>
          </div>
        </motion.div>

        <div className="space-y-6">
          {steps.map((step, index) => (
            <StepCard key={step.number} step={step} isLast={index === steps.length - 1} onCopy={handleCopy} copied={copiedStep === step.number} />
          ))}
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.8 }} className="mt-12 bg-gradient-to-br from-[#5059C9] to-[#4049B9] rounded-3xl p-10 text-white relative overflow-hidden shadow-2xl">
          <motion.div animate={{ opacity: [0.1, 0.2, 0.1] }} transition={{ duration: 3, repeat: Infinity }} className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent" />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <HiSparkles className="w-8 h-8" />
              <h2 className="text-3xl font-bold">Ready to Connect?</h2>
            </div>
            <p className="text-white/90 mb-6 text-lg">Once you have your webhook URL, head to the setup page to complete the integration</p>
            <motion.button whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.98 }} onClick={() => router.push('/integrations/teams/setup')} className="group px-8 py-4 bg-white text-[#5059C9] rounded-xl font-bold shadow-lg hover:shadow-xl transition-all flex items-center gap-3">
              Go to Setup Page
              <HiExternalLink className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </motion.button>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.9 }} className="mt-8 p-6 bg-blue-50/50 backdrop-blur-sm rounded-2xl border border-blue-200/60">
          <div className="flex items-start gap-3">
            <HiLightningBolt className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-bold text-zinc-900 mb-1">Need Help?</h3>
              <p className="text-sm text-zinc-600">If you encounter any issues during setup, check Microsoft Teams documentation or contact your IT administrator for assistance with webhook permissions.</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function StepCard({ step, isLast, onCopy, copied }) {
  return (
    <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: step.delay }} className="relative">
      <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-lg hover:shadow-xl transition-all duration-300 p-8 border border-zinc-200/60 overflow-hidden relative group">
        <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 0.8, delay: step.delay + 0.2 }} className={`absolute top-0 left-0 h-1.5 bg-gradient-to-r ${step.iconBg.replace('/10', '')} to-transparent origin-left`} style={{ width: '50%', clipPath: 'polygon(0 0, 96% 0, 100% 100%, 0 100%)' }} />
        <motion.div initial={{ opacity: 0 }} whileHover={{ opacity: 1 }} transition={{ duration: 0.4 }} className="absolute bottom-0 right-0 w-48 h-48 bg-gradient-to-tl from-zinc-50 to-transparent rounded-tl-full" />

        <div className="relative z-10">
          <div className="flex items-start gap-6 mb-4">
            <motion.div whileHover={{ scale: 1.1, rotate: 5 }} className={`${step.iconBg} ${step.iconColor} p-5 rounded-2xl shadow-md relative`}>
              {step.icon}
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-zinc-900 text-white rounded-full flex items-center justify-center text-sm font-bold shadow-lg">{step.number}</div>
            </motion.div>

            <div className="flex-1">
              <h2 className="text-2xl font-bold text-zinc-900 mb-2">{step.title}</h2>
              <p className="text-zinc-600 leading-relaxed">{step.description}</p>

              {step.substeps && (
                <motion.ol initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: step.delay + 0.3 }} className="mt-4 space-y-2">
                  {step.substeps.map((substep, idx) => (
                    <motion.li key={idx} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: step.delay + 0.4 + (idx * 0.1) }} className="flex items-start gap-3 text-sm">
                      <div className="flex-shrink-0 w-6 h-6 bg-zinc-900 text-white rounded-full flex items-center justify-center text-xs font-bold mt-0.5">{idx + 1}</div>
                      <span className="text-zinc-700 leading-relaxed pt-0.5">{substep}</span>
                    </motion.li>
                  ))}
                </motion.ol>
              )}

              {step.number === 4 && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: step.delay + 0.3 }} className="mt-6">
                  <p className="text-sm font-semibold text-zinc-700 mb-3">The webhook URL will look like this:</p>
                  <div className="relative group/code">
                    <code className="block bg-zinc-900 text-zinc-100 p-4 rounded-xl text-xs break-all font-mono leading-relaxed">https://yourcompany.webhook.office.com/webhookb2/abc123-def-456.../IncomingWebhook/...</code>
                    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => onCopy(step.number)} className="absolute top-3 right-3 p-2.5 bg-white/10 hover:bg-white/20 rounded-lg transition-all backdrop-blur-sm">
                      {copied ? <HiCheckCircle className="w-5 h-5 text-emerald-400" /> : <HiClipboardCopy className="w-5 h-5 text-white" />}
                    </motion.button>
                  </div>
                  <p className="text-xs text-zinc-500 mt-2 flex items-center gap-1.5">
                    <HiLightningBolt className="w-4 h-4" />
                    Click the copy button and save it somewhere safe
                  </p>
                </motion.div>
              )}
            </div>
          </div>
        </div>

        {!isLast && <div className="absolute -bottom-6 left-14 w-0.5 h-6 bg-gradient-to-b from-zinc-300 to-transparent" />}
      </div>
    </motion.div>
  );
}
