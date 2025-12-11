'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  FaTimes,
  FaRocket,
  FaChevronLeft,
  FaChevronRight,
  FaFolder,
  FaVideo,
  FaGlobe,
  FaTag,
  FaClock,
} from 'react-icons/fa';

// Import components
import StepIndicator from './components/StepIndicator';
import Step1CampaignSelect from './components/Step1CampaignSelect';
import Step2VideoSelect from './components/Step2VideoSelect';
import Step3PlatformSelect from './components/Step3PlatformSelect';
import Step4ContentCreation from './components/Step4ContentCreation';
import Step5Scheduling from './components/Step5Scheduling';

// Import utils
import { platformsConfig, getDefaultPlatformSpecificData } from './utils/platformConfig';

const CreatePostModal = ({
  isOpen,
  onClose,
  preSelectedCampaignId = null,
  preSelectedVideos = [],
  onSuccess,
}) => {
  const [currentStep, setCurrentStep] = useState(preSelectedCampaignId ? 2 : 1);
  const [loading, setLoading] = useState(false);
  const [campaignLoading, setCampaignLoading] = useState(false);
  const [videoLoading, setVideoLoading] = useState(false);
  const [connectedAccounts, setConnectedAccounts] = useState([]);

  // Data
  const [campaigns, setCampaigns] = useState([]);
  const [availableVideos, setAvailableVideos] = useState([]);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [selectedVideos, setSelectedVideos] = useState(preSelectedVideos || []);

  // Unified form state
  const [formData, setFormData] = useState({
    campaignId: preSelectedCampaignId || '',
    title: '',
    content: '',
    scheduledFor: '',
    publishNow: false,
    isDraft: false,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
    tags: '',
    hashtags: '',
    mentions: '',
  });

  // Platform configurations (replaces old platformCustomization)
  const [platformConfigs, setPlatformConfigs] = useState([]);

  const steps = [
    { number: 1, title: 'Select Campaign', icon: FaFolder },
    { number: 2, title: 'Select Videos', icon: FaVideo },
    { number: 3, title: 'Choose Platforms', icon: FaGlobe },
    { number: 4, title: 'Create Content', icon: FaTag },
    { number: 5, title: 'Schedule', icon: FaClock },
  ];

  // Fetch data on mount
  useEffect(() => {
    if (!isOpen) return;

    fetchConnectedAccounts();
    if (!preSelectedCampaignId) {
      fetchCampaigns();
    } else {
      fetchCampaignVideos(preSelectedCampaignId);
      setFormData((prev) => ({ ...prev, campaignId: preSelectedCampaignId }));
    }
  }, [isOpen, preSelectedCampaignId]);

  const fetchConnectedAccounts = async () => {
    try {
      const res = await fetch('/api/social/posts/create');
      if (!res.ok) throw new Error('Failed to fetch accounts');
      const data = await res.json();
      setConnectedAccounts((data.connectedPlatforms || []).filter((a) => a.isActive));
    } catch (err) {
      console.error(err);
      toast.error('Failed to load connected accounts');
    }
  };

  const fetchCampaigns = async () => {
    try {
      setCampaignLoading(true);
      const res = await fetch('/api/employees/campaign');
      if (!res.ok) throw new Error('Failed to fetch campaigns');
      const data = await res.json();
      setCampaigns(data.campaigns || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load campaigns');
    } finally {
      setCampaignLoading(false);
    }
  };

  const fetchCampaignVideos = async (campaignId) => {
    try {
      setVideoLoading(true);
      const res = await fetch(`/api/campaigns/${campaignId}/videos`);
      if (!res.ok) throw new Error('Failed to fetch videos');
      const data = await res.json();
      setAvailableVideos(data.data || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load campaign videos');
    } finally {
      setVideoLoading(false);
    }
  };

  // Campaign selection
  const selectCampaign = (campaign) => {
    setSelectedCampaign(campaign);
    setFormData((prev) => ({ ...prev, campaignId: campaign.id }));
    fetchCampaignVideos(campaign.id);
    setSelectedVideos([]);
  };

  // Video selection
  const toggleVideo = (video) => {
    setSelectedVideos((prev) => {
      const exists = prev.find((v) => v.id === video.id);
      if (exists) return prev.filter((v) => v.id !== video.id);
      return [...prev, video];
    });
  };

  const removeVideo = (videoId) => {
    setSelectedVideos((prev) => prev.filter((v) => v.id !== videoId));
  };

  // Platform selection
  const togglePlatform = (platformValue) => {
    const account = connectedAccounts.find(
      (acc) => acc.platform.toLowerCase() === platformValue.toLowerCase()
    );

    if (!account) {
      toast.error(`Please connect your ${platformValue} account first`);
      return;
    }

    setPlatformConfigs((prev) => {
      const exists = prev.find((p) => p.platform === platformValue);
      
      if (exists) {
        // Remove platform
        return prev.filter((p) => p.platform !== platformValue);
      }

      // Add platform with default settings
      return [
        ...prev,
        {
          platform: platformValue,
          accountId: account.accountId, // Use accountId from connected account
          customContent: null,
          scheduledFor: null,
          platformSpecificData: getDefaultPlatformSpecificData(platformValue),
        },
      ];
    });
  };

  // Update global form fields
  const updateGlobalField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Update platform-specific fields
  const updatePlatformField = (platform, field, value) => {
    setPlatformConfigs((prev) =>
      prev.map((p) =>
        p.platform === platform
          ? { ...p, [field]: value }
          : p
      )
    );
  };

  // Validation
  const validateStep = (step) => {
    switch (step) {
      case 1:
        if (!formData.campaignId) {
          toast.error('Please select a campaign');
          return false;
        }
        return true;
      case 2:
        if (selectedVideos.length === 0) {
          toast.error('Please select at least one video');
          return false;
        }
        return true;
      case 3:
        if (platformConfigs.length === 0) {
          toast.error('Please select at least one platform');
          return false;
        }
        return true;
      case 4:
        if (!formData.content && !formData.title) {
          toast.error('Please provide content or title');
          return false;
        }
        return true;
      case 5:
        if (!formData.publishNow && !formData.isDraft && !formData.scheduledFor) {
          toast.error('Please choose when to publish');
          return false;
        }
        // Validate TikTok privacy level
        const tiktokConfig = platformConfigs.find((p) => p.platform === 'tiktok');
        if (tiktokConfig && !tiktokConfig.platformSpecificData?.privacy_level) {
          toast.error('TikTok requires privacy level selection');
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  const nextStep = () => {
    if (!validateStep(currentStep)) return;
    setCurrentStep((s) => Math.min(s + 1, 5));
  };

  const prevStep = () => {
    setCurrentStep((s) => Math.max(s - 1, 1));
  };

  // Submit
  const handleSubmit = async () => {
    if (!validateStep(5)) return;

    try {
      setLoading(true);

      const payload = {
        videoIds: selectedVideos.map((v) => v.id),
        title: formData.title || undefined,
        content: formData.content || undefined,
        platforms: platformConfigs.map((p) => ({
          platform: p.platform,
          accountId: p.accountId,
          ...(p.customContent && { customContent: p.customContent }),
          ...(p.scheduledFor && { scheduledFor: p.scheduledFor }),
          platformSpecificData: p.platformSpecificData,
        })),
        scheduledFor: formData.scheduledFor || undefined,
        publishNow: formData.publishNow,
        isDraft: formData.isDraft,
        timezone: formData.timezone,
        tags: formData.tags
          ? formData.tags.split(',').map((t) => t.trim()).filter(Boolean)
          : undefined,
        hashtags: formData.hashtags
          ? formData.hashtags.split(',').map((h) => h.trim()).filter(Boolean)
          : undefined,
        mentions: formData.mentions
          ? formData.mentions.split(',').map((m) => m.trim()).filter(Boolean)
          : undefined,
      };

      const res = await fetch('/api/social/posts/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || err.message || 'Failed to create post');
      }

      const result = await res.json();
      toast.success(result.message || 'Post created successfully', { duration: 5000 });

      if (onSuccess) onSuccess(result);
      resetForm();
      onClose();
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Failed to create post');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      campaignId: '',
      title: '',
      content: '',
      scheduledFor: '',
      publishNow: false,
      isDraft: false,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
      tags: '',
      hashtags: '',
      mentions: '',
    });
    setSelectedCampaign(null);
    setSelectedVideos([]);
    setAvailableVideos([]);
    setPlatformConfigs([]);
    setCurrentStep(1);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="relative bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <FaTimes className="text-xl" />
            </button>

            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <FaRocket className="text-2xl" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Create Social Post</h2>
                <p className="text-blue-100 text-sm mt-1">
                  Share your campaign content across multiple platforms
                </p>
              </div>
            </div>

            <StepIndicator steps={steps} currentStep={currentStep} />
          </div>

          {/* Body */}
          <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 280px)' }}>
            <AnimatePresence mode="wait">
              {currentStep === 1 && (
                <Step1CampaignSelect
                  campaigns={campaigns}
                  selectedCampaign={selectedCampaign}
                  onSelectCampaign={selectCampaign}
                  loading={campaignLoading}
                />
              )}

              {currentStep === 2 && (
                <Step2VideoSelect
                  availableVideos={availableVideos}
                  selectedVideos={selectedVideos}
                  onToggleVideo={toggleVideo}
                  onRemoveVideo={removeVideo}
                  onClearAll={() => setSelectedVideos([])}
                  campaignName={selectedCampaign?.name}
                  loading={videoLoading}
                />
              )}

              {currentStep === 3 && (
                <Step3PlatformSelect
                  selectedPlatforms={platformConfigs}
                  connectedAccounts={connectedAccounts}
                  onTogglePlatform={togglePlatform}
                />
              )}

              {currentStep === 4 && (
                <Step4ContentCreation
                  formData={formData}
                  selectedPlatforms={platformConfigs}
                  platformConfigs={platformConfigs}
                  onUpdateGlobal={updateGlobalField}
                  onUpdatePlatform={updatePlatformField}
                />
              )}

              {currentStep === 5 && (
                <Step5Scheduling
                  formData={formData}
                  selectedPlatforms={platformConfigs}
                  platformConfigs={platformConfigs}
                  onUpdateGlobal={updateGlobalField}
                  onUpdatePlatform={updatePlatformField}
                />
              )}
            </AnimatePresence>
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 p-4 bg-gray-50">
            <div className="flex items-center justify-between">
              <button
                onClick={prevStep}
                disabled={currentStep === 1}
                className="flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200"
              >
                <FaChevronLeft />
                Previous
              </button>

              <div className="text-sm text-gray-500">
                Step {currentStep} of {steps.length}
              </div>

              {currentStep < 5 ? (
                <button
                  onClick={nextStep}
                  className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-all"
                >
                  Next
                  <FaChevronRight />
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-all disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                        className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                      />
                      Creating...
                    </>
                  ) : (
                    <>
                      <FaRocket />
                      {formData.publishNow ? 'Publish Now' : formData.isDraft ? 'Save Draft' : 'Schedule Post'}
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default CreatePostModal;
