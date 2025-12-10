'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  FaInstagram,
  FaTwitter,
  FaFacebook,
  FaLinkedin,
  FaYoutube,
  FaPinterest,
  FaTimes,
  FaCalendarAlt,
  FaClock,
  FaTag,
  FaHashtag,
  FaAt,
  FaCheck,
  FaVideo,
  FaPlay,
  FaChevronLeft,
  FaChevronRight,
  FaRocket,
  FaSave,
  FaGlobe,
  FaCheckCircle,
  FaFolder,
  FaUsers,
  FaTrash,
} from 'react-icons/fa';
import { SiTiktok, SiThreads } from 'react-icons/si';

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

  // Form state
  const [formData, setFormData] = useState({
    campaignId: preSelectedCampaignId || '',
    title: '',
    content: '',
    selectedPlatforms: [], // [{ platform, profileId }]
    scheduledFor: '',
    publishNow: false,
    isDraft: false,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
    tags: '',
    hashtags: '',
    mentions: '',
    tiktokSettings: {
      privacy_level: '',
      allow_comment: true,
      allow_duet: false,
      allow_stitch: false,
      content_preview_confirmed: true,
      express_consent_given: true,
    },
  });

  // Optional per‑platform overrides (content / schedule)
  const [platformCustomization, setPlatformCustomization] = useState({});

  const platformsConfig = [
    {
      name: 'Instagram',
      value: 'instagram',
      icon: FaInstagram,
      gradient: 'from-[#E4405F] via-[#DD2A7B] to-[#9C27B0]',
      requiresMedia: true,
      description: 'Posts, Reels & Stories',
    },
    {
      name: 'TikTok',
      value: 'tiktok',
      icon: SiTiktok,
      gradient: 'from-[#000000] to-[#69C9D0]',
      requiresMedia: true,
      description: 'Short-form videos',
    },
    {
      name: 'YouTube',
      value: 'youtube',
      icon: FaYoutube,
      gradient: 'from-[#FF0000] to-[#cc0000]',
      requiresMedia: true,
      description: 'Videos & Shorts',
    },
    {
      name: 'Facebook',
      value: 'facebook',
      icon: FaFacebook,
      gradient: 'from-[#1877F2] to-[#0c5ecf]',
      requiresMedia: false,
      description: 'Posts & Stories',
    },
    {
      name: 'Twitter',
      value: 'twitter',
      icon: FaTwitter,
      gradient: 'from-[#1DA1F2] to-[#0d8bd9]',
      requiresMedia: false,
      description: 'Tweets & Videos',
    },
    {
      name: 'LinkedIn',
      value: 'linkedin',
      icon: FaLinkedin,
      gradient: 'from-[#0A66C2] to-[#004182]',
      requiresMedia: false,
      description: 'Professional content',
    },
    {
      name: 'Threads',
      value: 'threads',
      icon: SiThreads,
      gradient: 'from-[#000000] to-[#666666]',
      requiresMedia: false,
      description: 'Text conversations',
    },
    {
      name: 'Pinterest',
      value: 'pinterest',
      icon: FaPinterest,
      gradient: 'from-[#E60023] to-[#bd001c]',
      requiresMedia: true,
      description: 'Pins & Boards',
    },
  ];

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

  // GET /api/social/posts/create -> connectedPlatforms[]
  const fetchConnectedAccounts = async () => {
    try {
      const res = await fetch('/api/social/posts/create');
      if (!res.ok) throw new Error('Failed to fetch accounts');
      const data = await res.json();

      // Expecting: { connectedPlatforms: [{ platform, username, profileId, isActive }] }
      setConnectedAccounts((data.connectedPlatforms || []).filter((a) => a.isActive));
    } catch (err) {
      console.error(err);
      toast.error('Failed to load connected accounts');
    }
  };

  // GET /api/employees/campaign -> campaigns the employee is part of
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

  // GET /api/campaigns/[id]/videos -> videos for that campaign
  const fetchCampaignVideos = async (campaignId) => {
    try {
      setVideoLoading(true);
      const res = await fetch(`/api/campaigns/${campaignId}/videos`);
      if (!res.ok) throw new Error('Failed to fetch videos');
      const data = await res.json();
      // Expecting: { data: videos[] }
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
    setSelectedVideos([]); // reset selections when campaign changes
  };

  // Multi‑video selection
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

  // Platform selection; use profileId from connectedAccounts
  const togglePlatform = (platformValue) => {
    const account = connectedAccounts.find(
      (acc) => acc.platform.toLowerCase() === platformValue.toLowerCase(),
    );

    if (!account) {
      toast.error(`Please connect your ${platformValue} account first`);
      return;
    }

    setFormData((prev) => {
      const exists = prev.selectedPlatforms.find((p) => p.platform === platformValue);
      if (exists) {
        // Remove platform + its customization
        setPlatformCustomization((prevCustom) => {
          const clone = { ...prevCustom };
          delete clone[platformValue];
          return clone;
        });

        return {
          ...prev,
          selectedPlatforms: prev.selectedPlatforms.filter(
            (p) => p.platform !== platformValue,
          ),
        };
      }

      return {
        ...prev,
        selectedPlatforms: [
          ...prev.selectedPlatforms,
          {
            platform: platformValue,
            profileId: account.profileId, // IMPORTANT: use profileId here
          },
        ],
      };
    });
  };

  const updatePlatformCustomization = (platform, field, value) => {
    setPlatformCustomization((prev) => ({
      ...prev,
      [platform]: {
        ...(prev[platform] || {}),
        [field]: value,
      },
    }));
  };

  // Validation per step
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
        if (formData.selectedPlatforms.length === 0) {
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

  // Submit – builds Late‑compatible payload
  const handleSubmit = async () => {
    if (!validateStep(5)) return;

    const hasTikTok = formData.selectedPlatforms.some((p) => p.platform === 'tiktok');
    if (hasTikTok && !formData.tiktokSettings.privacy_level) {
      toast.error('TikTok requires privacy level selection');
      return;
    }

    try {
      setLoading(true);

      // Frontend only needs to send videoIds; backend will build mediaItems[]
      const payload = {
        videoIds: selectedVideos.map((v) => v.id),
        title: formData.title || undefined,
        content: formData.content || undefined,
        platforms: formData.selectedPlatforms.map((p) => ({
          platform: p.platform,
          profileId: p.accountId, // Late expects account identifier here
          ...(platformCustomization[p.platform]?.customContent && {
            customContent: platformCustomization[p.platform].customContent,
          }),
          ...(platformCustomization[p.platform]?.scheduledFor && {
            scheduledFor: platformCustomization[p.platform].scheduledFor,
          }),
          ...(p.platform === 'tiktok' && {
            platformSpecificData: formData.tiktokSettings,
          }),
        })),
        scheduledFor: formData.scheduledFor || undefined,
        publishNow: formData.publishNow,
        isDraft: formData.isDraft,
        timezone: formData.timezone,
        tags: formData.tags
          ? formData.tags
              .split(',')
              .map((t) => t.trim())
              .filter(Boolean)
          : undefined,
        hashtags: formData.hashtags
          ? formData.hashtags
              .split(',')
              .map((h) => h.trim())
              .filter(Boolean)
          : undefined,
        mentions: formData.mentions
          ? formData.mentions
              .split(',')
              .map((m) => m.trim())
              .filter(Boolean)
          : undefined,
        ...(hasTikTok && { tiktokSettings: formData.tiktokSettings }),
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
      selectedPlatforms: [],
      scheduledFor: '',
      publishNow: false,
      isDraft: false,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
      tags: '',
      hashtags: '',
      mentions: '',
      tiktokSettings: {
        privacy_level: '',
        allow_comment: true,
        allow_duet: false,
        allow_stitch: false,
        content_preview_confirmed: true,
        express_consent_given: true,
      },
    });
    setSelectedCampaign(null);
    setSelectedVideos([]);
    setAvailableVideos([]);
    setPlatformCustomization({});
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

            {/* Steps */}
            <div className="flex items-center justify-between">
              {steps.map((step, index) => {
                const Icon = step.icon;
                const isActive = currentStep === step.number;
                const isCompleted = currentStep > step.number;

                return (
                  <React.Fragment key={step.number}>
                    <div className="flex flex-col items-center gap-2 flex-1">
                      <motion.div
                        animate={{
                          scale: isActive ? 1.1 : 1,
                          backgroundColor: isActive
                            ? '#ffffff'
                            : isCompleted
                            ? '#10b981'
                            : 'rgba(255,255,255,0.3)',
                        }}
                        className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${
                          isActive ? 'text-blue-600' : 'text-white'
                        }`}
                      >
                        {isCompleted ? <FaCheck className="text-sm" /> : <Icon className="text-sm" />}
                      </motion.div>
                      <span className="text-xs font-medium text-center hidden lg:block">
                        {step.title}
                      </span>
                    </div>
                    {index < steps.length - 1 && (
                      <div className="flex-1 h-1 mx-2 bg-white/30 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: '0%' }}
                          animate={{ width: currentStep > step.number ? '100%' : '0%' }}
                          transition={{ duration: 0.3 }}
                          className="h-full bg-green-400"
                        />
                      </div>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>

          {/* Body */}
          <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 280px)' }}>
            <AnimatePresence mode="wait">
              {/* Step 1: Campaign */}
              {currentStep === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <div className="text-center mb-6">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">Select a Campaign</h3>
                    <p className="text-gray-500">
                      Choose which campaign&apos;s content you want to share
                    </p>
                  </div>

                  {campaignLoading ? (
                    <div className="flex justify-center py-20">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                        className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full"
                      />
                    </div>
                  ) : campaigns.length === 0 ? (
                    <div className="text-center py-20">
                      <FaFolder className="text-6xl text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500 text-lg mb-2">No campaigns found</p>
                      <p className="text-gray-400 text-sm">
                        You need to be assigned to a campaign first
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {campaigns.map((c) => (
                        <motion.div
                          key={c.id}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => selectCampaign(c)}
                          className={`relative p-6 rounded-2xl border-2 cursor-pointer transition-all ${
                            selectedCampaign?.id === c.id
                              ? 'border-blue-600 bg-blue-50 shadow-lg'
                              : 'border-gray-200 hover:border-gray-300 bg-white'
                          }`}
                        >
                          {selectedCampaign?.id === c.id && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="absolute -top-2 -right-2 bg-blue-600 rounded-full p-2"
                            >
                              <FaCheckCircle className="text-white" />
                            </motion.div>
                          )}

                          <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
                              <FaFolder className="text-white text-xl" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-bold text-gray-900 text-lg mb-1 truncate">
                                {c.name}
                              </h4>
                              <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                                <span className="flex items-center gap-1">
                                  <FaUsers className="text-gray-400" />
                                  {c.members} members
                                </span>
                                <span className="flex items-center gap-1">
                                  <FaVideo className="text-gray-400" />
                                  {c.videos} videos
                                </span>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}

              {/* Step 2: Videos */}
              {currentStep === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <div className="text-center mb-6">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                      Select Videos to Post
                    </h3>
                    <p className="text-gray-500">
                      Choose from {selectedCampaign?.name || 'campaign'} videos
                    </p>
                    {selectedVideos.length > 0 && (
                      <p className="text-blue-600 font-medium mt-2">
                        {selectedVideos.length} video
                        {selectedVideos.length > 1 ? 's' : ''} selected
                      </p>
                    )}
                  </div>

                  {selectedVideos.length > 0 && (
                    <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 mb-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-gray-900">Selected Videos</h4>
                        <button
                          onClick={() => setSelectedVideos([])}
                          className="text-xs text-red-600 hover:text-red-700 font-medium"
                        >
                          Clear all
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {selectedVideos.map((v) => (
                          <div
                            key={v.id}
                            className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 border border-blue-300"
                          >
                            <FaVideo className="text-blue-600" />
                            <span className="text-sm font-medium text-gray-700 truncate max-w-[150px]">
                              {v.title}
                            </span>
                            <button
                              onClick={() => removeVideo(v.id)}
                              className="p-1 hover:bg-red-100 rounded"
                            >
                              <FaTrash className="text-xs text-red-500" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {videoLoading ? (
                    <div className="flex justify-center py-20">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                        className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full"
                      />
                    </div>
                  ) : availableVideos.length === 0 ? (
                    <div className="text-center py-20">
                      <FaVideo className="text-6xl text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500 text-lg mb-2">No videos available</p>
                      <p className="text-gray-400 text-sm">
                        Upload videos to this campaign first
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {availableVideos.map((v) => {
                        const isSelected = selectedVideos.some((sv) => sv.id === v.id);
                        return (
                          <motion.div
                            key={v.id}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => toggleVideo(v)}
                            className={`relative rounded-xl overflow-hidden cursor-pointer border-4 transition-all ${
                              isSelected
                                ? 'border-blue-600 shadow-lg'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <div className="aspect-video bg-gray-900 relative group">
                              {v.thumbnailUrl ? (
                                <img
                                  src={v.thumbnailUrl}
                                  alt={v.title}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <FaVideo className="text-4xl text-gray-600" />
                                </div>
                              )}
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <FaPlay className="text-white text-3xl" />
                              </div>
                              {isSelected && (
                                <div className="absolute top-2 right-2 bg-blue-600 rounded-full p-2">
                                  <FaCheckCircle className="text-white" />
                                </div>
                              )}
                            </div>
                            <div className="p-3 bg-white">
                              <p className="font-medium text-sm text-gray-900 truncate">
                                {v.title}
                              </p>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  )}
                </motion.div>
              )}

              {/* Step 3: Platforms */}
              {currentStep === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="text-center mb-6">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                      Choose Platforms
                    </h3>
                    <p className="text-gray-500">
                      Select where you want to publish this content
                    </p>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {platformsConfig.map((platform) => {
                      const Icon = platform.icon;
                      const account = connectedAccounts.find(
                        (acc) =>
                          acc.platform.toLowerCase() === platform.value.toLowerCase(),
                      );
                      const isConnected = !!account;
                      const isSelected = formData.selectedPlatforms.some(
                        (p) => p.platform === platform.value,
                      );

                      return (
                        <motion.button
                          key={platform.value}
                          whileHover={{ scale: isConnected ? 1.05 : 1 }}
                          whileTap={{ scale: isConnected ? 0.95 : 1 }}
                          onClick={() => togglePlatform(platform.value)}
                          disabled={!isConnected}
                          className={`relative p-4 rounded-2xl border-2 transition-all ${
                            isSelected
                              ? 'border-blue-600 bg-blue-50 shadow-lg'
                              : 'border-gray-200 hover:border-gray-300 bg-white'
                          } ${!isConnected && 'opacity-50 cursor-not-allowed'}`}
                        >
                          {isSelected && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="absolute -top-2 -right-2 bg-blue-600 rounded-full p-1.5"
                            >
                              <FaCheck className="text-white text-xs" />
                            </motion.div>
                          )}
                          <div
                            className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${platform.gradient} flex items-center justify-center mx-auto mb-3 shadow-lg`}
                          >
                            <Icon className="text-white text-2xl" />
                          </div>
                          <p className="font-semibold text-gray-900 text-sm mb-1">
                            {platform.name}
                          </p>
                          <p className="text-xs text-gray-500">{platform.description}</p>
                          {!isConnected && (
                            <div className="mt-2 text-xs text-red-500 font-medium">
                              Not connected
                            </div>
                          )}
                        </motion.button>
                      );
                    })}
                  </div>

                  {formData.selectedPlatforms.length > 0 && (
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
                      <p className="text-blue-800 font-medium">
                        {formData.selectedPlatforms.length} platform
                        {formData.selectedPlatforms.length > 1 ? 's' : ''} selected
                      </p>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Step 4: Content */}
              {currentStep === 4 && (
                <motion.div
                  key="step4"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="text-center mb-6">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                      Create Your Post
                    </h3>
                    <p className="text-gray-500">
                      Add engaging content for your audience
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Title (optional)
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, title: e.target.value }))
                      }
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="Give your post a catchy title..."
                      maxLength={100}
                    />
                    <p className="text-xs text-gray-500 mt-1 text-right">
                      {formData.title.length}/100
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Content *
                    </label>
                    <textarea
                      value={formData.content}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, content: e.target.value }))
                      }
                      rows={6}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all"
                      placeholder="Write your main caption or message..."
                      maxLength={2200}
                    />
                    <p className="text-xs text-gray-500 mt-1 text-right">
                      {formData.content.length}/2200
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                        <FaTag className="text-blue-600" /> Tags
                      </label>
                      <input
                        type="text"
                        value={formData.tags}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, tags: e.target.value }))
                        }
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder="tag1, tag2, tag3"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                        <FaHashtag className="text-purple-600" /> Hashtags
                      </label>
                      <input
                        type="text"
                        value={formData.hashtags}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, hashtags: e.target.value }))
                        }
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                        placeholder="#trending, #viral"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                        <FaAt className="text-green-600" /> Mentions
                      </label>
                      <input
                        type="text"
                        value={formData.mentions}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, mentions: e.target.value }))
                        }
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                        placeholder="@user1, @user2"
                      />
                    </div>
                  </div>

                  {/* TikTok settings shown only if TikTok selected */}
                  {formData.selectedPlatforms.some((p) => p.platform === 'tiktok') && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="bg-gradient-to-r from-black to-[#69C9D0] p-6 rounded-2xl text-white"
                    >
                      <div className="flex items-center gap-3 mb-4">
                        <SiTiktok className="text-2xl" />
                        <h4 className="text-lg font-bold">TikTok Settings</h4>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-2">
                            Privacy level *
                          </label>
                          <select
                            value={formData.tiktokSettings.privacy_level}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                tiktokSettings: {
                                  ...prev.tiktokSettings,
                                  privacy_level: e.target.value,
                                },
                              }))
                            }
                            className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:ring-2 focus:ring-white/50"
                          >
                            <option value="">Select privacy...</option>
                            <option value="PUBLIC_TO_EVERYONE">Public to everyone</option>
                            <option value="MUTUAL_FOLLOW_FRIENDS">Friends only</option>
                            <option value="SELF_ONLY">Private</option>
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={formData.tiktokSettings.allow_comment}
                              onChange={(e) =>
                                setFormData((prev) => ({
                                  ...prev,
                                  tiktokSettings: {
                                    ...prev.tiktokSettings,
                                    allow_comment: e.target.checked,
                                  },
                                }))
                              }
                              className="w-5 h-5 rounded accent-white"
                            />
                            <span className="text-sm">Allow comments</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={formData.tiktokSettings.allow_duet}
                              onChange={(e) =>
                                setFormData((prev) => ({
                                  ...prev,
                                  tiktokSettings: {
                                    ...prev.tiktokSettings,
                                    allow_duet: e.target.checked,
                                  },
                                }))
                              }
                              className="w-5 h-5 rounded accent-white"
                            />
                            <span className="text-sm">Allow duet</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={formData.tiktokSettings.allow_stitch}
                              onChange={(e) =>
                                setFormData((prev) => ({
                                  ...prev,
                                  tiktokSettings: {
                                    ...prev.tiktokSettings,
                                    allow_stitch: e.target.checked,
                                  },
                                }))
                              }
                              className="w-5 h-5 rounded accent-white"
                            />
                            <span className="text-sm">Allow stitch</span>
                          </label>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              )}

              {/* Step 5: Schedule */}
              {currentStep === 5 && (
                <motion.div
                  key="step5"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="text-center mb-6">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                      When to publish?
                    </h3>
                    <p className="text-gray-500">Choose your publishing schedule</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          publishNow: true,
                          isDraft: false,
                          scheduledFor: '',
                        }))
                      }
                      className={`p-6 border-2 rounded-2xl transition-all ${
                        formData.publishNow
                          ? 'border-green-500 bg-green-50 shadow-lg'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                        <FaRocket className="text-white text-2xl" />
                      </div>
                      <h4 className="font-bold text-gray-900 mb-2">Publish now</h4>
                      <p className="text-sm text-gray-500">
                        Post immediately to all selected platforms
                      </p>
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          publishNow: false,
                          isDraft: false,
                        }))
                      }
                      className={`p-6 border-2 rounded-2xl transition-all ${
                        !formData.publishNow && !formData.isDraft
                          ? 'border-blue-500 bg-blue-50 shadow-lg'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                        <FaCalendarAlt className="text-white text-2xl" />
                      </div>
                      <h4 className="font-bold text-gray-900 mb-2">Schedule</h4>
                      <p className="text-sm text-gray-500">
                        Choose a specific date and time
                      </p>
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          isDraft: true,
                          publishNow: false,
                          scheduledFor: '',
                        }))
                      }
                      className={`p-6 border-2 rounded-2xl transition-all ${
                        formData.isDraft
                          ? 'border-gray-500 bg-gray-50 shadow-lg'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <div className="w-16 h-16 bg-gradient-to-br from-gray-400 to-gray-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                        <FaSave className="text-white text-2xl" />
                      </div>
                      <h4 className="font-bold text-gray-900 mb-2">Save draft</h4>
                      <p className="text-sm text-gray-500">
                        Finalize and publish later
                      </p>
                    </motion.button>
                  </div>

                  {!formData.publishNow && !formData.isDraft && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Schedule date & time
                        </label>
                        <input
                          type="datetime-local"
                          value={formData.scheduledFor}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              scheduledFor: e.target.value,
                            }))
                          }
                          min={new Date().toISOString().slice(0, 16)}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Timezone
                        </label>
                        <select
                          value={formData.timezone}
                          onChange={(e) =>
                            setFormData((prev) => ({ ...prev, timezone: e.target.value }))
                          }
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        >
                          <option value="UTC">UTC</option>
                          <option value="Asia/Kolkata">IST (India)</option>
                          <option value="Europe/London">GMT (London)</option>
                          <option value="America/New_York">EST (New York)</option>
                          <option value="America/Los_Angeles">PST (Los Angeles)</option>
                        </select>
                      </div>
                    </div>
                  )}

                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 rounded-2xl p-6">
                    <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <FaCheckCircle className="text-blue-600" />
                      Summary
                    </h4>
                    <p className="text-sm text-gray-700">
                      Campaign:{' '}
                      <span className="font-medium">{selectedCampaign?.name || '-'}</span>
                    </p>
                    <p className="text-sm text-gray-700">
                      Videos:{' '}
                      <span className="font-medium">
                        {selectedVideos.map((v) => v.title).join(', ') || '-'}
                      </span>
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
            <button
              onClick={currentStep === 1 ? onClose : prevStep}
              className="flex items-center gap-2 px-6 py-3 text-gray-700 hover:bg-gray-200 rounded-xl transition-colors font-medium"
            >
              <FaChevronLeft />
              {currentStep === 1 ? 'Cancel' : 'Back'}
            </button>
            <div className="flex gap-3">
              {currentStep < 5 ? (
                <button
                  onClick={nextStep}
                  className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:shadow-lg transition-all font-medium"
                >
                  Continue
                  <FaChevronRight />
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-xl hover:shadow-lg disabled:opacity-50 transition-all font-medium"
                >
                  {loading ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{
                          repeat: Infinity,
                          duration: 1,
                          ease: 'linear',
                        }}
                        className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                      />
                      Creating...
                    </>
                  ) : formData.isDraft ? (
                    <>
                      <FaSave /> Save draft
                    </>
                  ) : formData.publishNow ? (
                    <>
                      <FaRocket /> Publish now
                    </>
                  ) : (
                    <>
                      <FaCalendarAlt /> Schedule post
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
