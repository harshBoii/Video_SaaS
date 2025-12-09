"use client"
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast';
import { 
  FaFacebook, 
  FaInstagram, 
  FaLinkedin, 
  FaTwitter, 
  FaYoutube, 
  FaPinterest, 
  FaReddit,
  FaGoogle,
  FaCheckCircle,
  FaExclamationTriangle,
  FaRocket,
  FaTrash
} from 'react-icons/fa';
import { SiThreads } from 'react-icons/si';
import { MdBusiness, MdClose } from 'react-icons/md';
import { HiLightningBolt } from 'react-icons/hi';

const SocialConnector = ({ redirectUrl }) => {
  const [profileStatus, setProfileStatus] = useState('loading');
  const [profile, setProfile] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [creatingProfile, setCreatingProfile] = useState(false);
  const [connecting, setConnecting] = useState(null);
  const [error, setError] = useState(null);
  const [deletingProfile, setDeletingProfile] = useState(false);

  const platforms = [
    { 
      name: 'Twitter', 
      value: 'twitter', 
      icon: FaTwitter, 
      color: 'from-[#1DA1F2] to-[#0d8bd9]',
      hoverColor: 'hover:shadow-[#1DA1F2]/50'
    },
    { 
      name: 'Instagram', 
      value: 'instagram', 
      icon: FaInstagram, 
      color: 'from-[#E4405F] to-[#9C27B0]',
      hoverColor: 'hover:shadow-[#E4405F]/50'
    },
    { 
      name: 'Facebook', 
      value: 'facebook', 
      icon: FaFacebook, 
      color: 'from-[#1877F2] to-[#0c5ecf]',
      hoverColor: 'hover:shadow-[#1877F2]/50'
    },
    { 
      name: 'LinkedIn', 
      value: 'linkedin', 
      icon: FaLinkedin, 
      color: 'from-[#0A66C2] to-[#004182]',
      hoverColor: 'hover:shadow-[#0A66C2]/50'
    },
    { 
      name: 'YouTube', 
      value: 'youtube', 
      icon: FaYoutube, 
      color: 'from-[#FF0000] to-[#cc0000]',
      hoverColor: 'hover:shadow-[#FF0000]/50'
    },
    { 
      name: 'Pinterest', 
      value: 'pinterest', 
      icon: FaPinterest, 
      color: 'from-[#E60023] to-[#bd001c]',
      hoverColor: 'hover:shadow-[#E60023]/50'
    },
    { 
      name: 'Reddit', 
      value: 'reddit', 
      icon: FaReddit, 
      color: 'from-[#FF4500] to-[#d63a00]',
      hoverColor: 'hover:shadow-[#FF4500]/50'
    },
    { 
      name: 'Threads', 
      value: 'threads', 
      icon: SiThreads, 
      color: 'from-[#000000] to-[#333333]',
      hoverColor: 'hover:shadow-gray-700/50'
    },
    { 
      name: 'Google Business', 
      value: 'googlebusiness', 
      icon: ({ className }) => (
        <div className={className}>
          <FaGoogle className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-2xl" />
          <MdBusiness className="absolute bottom-0 right-0 text-sm" />
        </div>
      ),
      color: 'from-[#4285F4] to-[#34a853]',
      hoverColor: 'hover:shadow-[#4285F4]/50'
    }
  ];

  // ✅ Wrapped in useCallback to prevent dependency issues
  const checkProfileStatus = useCallback(async () => {
    try {
      const response = await fetch('/api/social/profile', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (data.hasProfile) {
        setProfileStatus('ready');
        setProfile(data.profile);
      } else {
        setProfileStatus('needsSetup');
        setShowModal(true);
      }
    } catch (error) {
      console.error('Failed to check profile:', error);
      toast.error('Failed to load profile status');
      setError('Failed to load profile status');
      setProfileStatus('needsSetup');
    }
  }, []);


  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const success = params.get('success');
    const error = params.get('error');
    const message = params.get('message');

    if (success) {
      const platform = params.get('platform');
      const account = params.get('account');
      
      toast.success(`Successfully connected ${platform}: ${account || 'Account'}`, {
        duration: 5000,
        icon: '🎉',
      });
      setError(null);
      checkProfileStatus();
      window.history.replaceState({}, '', '/admin/integration');
    }

    if (error) {
      const errorMsg = decodeURIComponent(message || 'Connection failed');
      toast.error(errorMsg, { duration: 6000 });
      setError(errorMsg);
      window.history.replaceState({}, '', '/admin/integration');
    }
  }, [checkProfileStatus]);

  // Initial profile check
  useEffect(() => {
    checkProfileStatus();
  }, [checkProfileStatus]);

  const createProfile = async () => {
    setCreatingProfile(true);
    setError(null);

    try {
      const response = await fetch('/api/social/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create profile');
      }

      const data = await response.json();
      
      setProfile(data.profile);
      setProfileStatus('ready');
      setShowModal(false);
      toast.success('Profile created successfully! 🚀', { duration: 4000 });
    } catch (error) {
      console.error('Profile creation error:', error);
      setError(error.message);
      toast.error(error.message);
    } finally {
      setCreatingProfile(false);
    }
  };

  // ✅ Added confirmation dialog
  const deleteProfile = async () => {
    const confirmed = window.confirm(
      '⚠️ Are you sure you want to delete your profile?\n\nThis will disconnect all social accounts and cannot be undone.'
    );
    
    if (!confirmed) return;

    setDeletingProfile(true);
    setError(null);

    try {
      const response = await fetch('/api/social/profile', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete profile');
      }

      setProfile(null);
      setProfileStatus('needsSetup');
      setShowModal(true);
      toast.success('Profile deleted successfully', { icon: '✅' });
    } catch (error) {
      console.error('Profile deletion error:', error);
      setError(error.message);
      toast.error(error.message);
    } finally {
      setDeletingProfile(false);
    }
  };

  const handleConnect = async (platform) => {
    if (profileStatus !== 'ready') {
      toast.error('Please create a profile first');
      setShowModal(true);
      return;
    }
    
    setConnecting(platform);
    setError(null);
    
    try {
      const params = new URLSearchParams();
      // const platformsWithRedirect = [
      //                                 'facebook',
      //                                 'instagram',
      //                                 'linkedin',
      //                                 'twitter',
      //                                 'tiktok',
      //                                 'youtube',
      //                                 'threads',
      //                                 'reddit',
      //                                 'pinterest',
      //                                 'bluesky',
      //                                 'googlebusiness'
      //                               ];
      
      // if (redirectUrl && platformsWithRedirect.includes(platform.toLowerCase())) {
      //   params.append('redirect_url', redirectUrl);
      // }

      const response = await fetch(
        `/api/social/connect/${platform}${params.toString() ? `?${params}` : ''}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to initiate connection');
      }

      const data = await response.json();
      
      if (data.authorizationUrl) {
        toast.loading(`Redirecting to ${platform}...`, { duration: 2000 });
        setTimeout(() => {
          window.location.href = data.authorizationUrl;
        }, 500);
      } else {
        throw new Error('No authorization URL returned');
      }
    } catch (error) {
      console.error('Connection error:', error);
      setError(error.message);
      toast.error(error.message);
      setConnecting(null);
    }
  };

  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 }
  };

  const modalVariants = {
    hidden: { 
      opacity: 0,
      scale: 0.8,
      y: 50
    },
    visible: { 
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30
      }
    },
    exit: {
      opacity: 0,
      scale: 0.8,
      y: 50,
      transition: {
        duration: 0.2
      }
    }
  };

  if (profileStatus === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-4 sm:px-6 lg:px-8">
      {/* ✅ Toast Notifications */}
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
            borderRadius: '10px',
            padding: '16px',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
            duration: 5000,
          },
        }}
      />

      {/* Setup Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => !creatingProfile && setShowModal(false)}
          >
            <motion.div
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="relative bg-gradient-to-r from-blue-600 to-purple-600 p-8 text-white">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring" }}
                  className="absolute top-4 right-4"
                >
                  <FaRocket className="text-4xl text-yellow-300" />
                </motion.div>
                
                {!creatingProfile && (
                  <button
                    onClick={() => setShowModal(false)}
                    className="absolute top-4 left-4 p-2 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <MdClose className="text-2xl" />
                  </button>
                )}

                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="text-center mt-4"
                >
                  <h2 className="text-3xl font-bold mb-2">
                    Welcome Aboard!
                  </h2>
                  <p className="text-blue-100">
                    Let's set up your social media hub
                  </p>
                </motion.div>
              </div>

              {/* Modal Body */}
              <div className="p-8">
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="space-y-6"
                >
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <FaCheckCircle className="text-2xl text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">
                        Initialize Your Social Profile
                      </h3>
                      <p className="text-sm text-gray-600">
                        To begin connecting your social media accounts, we need to create 
                        a centralized profile that will serve as your content management hub.
                      </p>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 border border-blue-200">
                    <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                      <HiLightningBolt className="mr-2 text-purple-600" />
                      What you'll get:
                    </h4>
                    <ul className="space-y-2 text-sm text-gray-700">
                      <li className="flex items-start">
                        <span className="text-green-500 mr-2">✓</span>
                        Unified dashboard for all social platforms
                      </li>
                      <li className="flex items-start">
                        <span className="text-green-500 mr-2">✓</span>
                        Streamlined content scheduling and publishing
                      </li>
                      <li className="flex items-start">
                        <span className="text-green-500 mr-2">✓</span>
                        Cross-platform analytics and insights
                      </li>
                    </ul>
                  </div>

                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3"
                    >
                      <FaExclamationTriangle className="text-red-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-red-900">Setup Failed</p>
                        <p className="text-sm text-red-700">{error}</p>
                      </div>
                    </motion.div>
                  )}

                  <button
                    onClick={createProfile}
                    disabled={creatingProfile}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 px-6 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                  >
                    {creatingProfile ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                          className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                        />
                        <span>Setting up your profile...</span>
                      </>
                    ) : (
                      <>
                        <FaRocket className="text-xl" />
                        <span>Initialize Social Profile</span>
                      </>
                    )}
                  </button>

                  <p className="text-xs text-center text-gray-500">
                    This process is secure and takes just a moment
                  </p>
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            Connect Your Social Accounts
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Link your social media platforms to streamline your content management and scheduling
          </p>
          
          <div className="mt-6 flex items-center justify-center gap-4">
            {profile ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="inline-flex items-center space-x-2 bg-green-50 text-green-700 px-4 py-2 rounded-full border border-green-200"
              >
                <FaCheckCircle />
                <span className="text-sm font-medium">Profile Active: {profile.name}</span>
              </motion.div>
            ) : (
              <motion.button
                onClick={() => setShowModal(true)}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <FaRocket />
                <span className="text-sm font-semibold">Initialize Social Profile</span>
              </motion.button>
            )}

            {/* ✅ Delete Profile Button with Loading State */}
            {profileStatus === 'ready' && (
              <motion.button
                onClick={deleteProfile}
                disabled={deletingProfile}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: deletingProfile ? 1 : 1.05 }}
                whileTap={{ scale: deletingProfile ? 1 : 0.95 }}
                className="inline-flex items-center space-x-2 bg-white text-red-600 px-4 py-2 rounded-full border border-red-300 shadow-sm hover:shadow-md hover:bg-red-50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Delete Profile"
              >
                {deletingProfile ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                      className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full"
                    />
                    <span className="text-sm font-medium">Deleting...</span>
                  </>
                ) : (
                  <>
                    <FaTrash className="text-sm" />
                    <span className="text-sm font-medium">Delete Profile</span>
                  </>
                )}
              </motion.button>
            )}
          </div>
        </motion.div>

        {/* Connected Accounts Section */}
        {profile?.socialAccounts && profile.socialAccounts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12 bg-white rounded-xl p-6 shadow-md"
          >
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Connected Accounts</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {profile.socialAccounts.map((account) => (
                <div
                  key={account.id}
                  className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  {account.avatarUrl && (
                    <img 
                      src={account.avatarUrl} 
                      alt={account.username}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {account.displayName || account.username}
                    </p>
                    <p className="text-xs text-gray-500 capitalize">
                      {account.platform.toLowerCase()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Platform Grid */}
        <motion.div
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: { staggerChildren: 0.08 }
            }
          }}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {platforms.map((platform) => {
            const Icon = platform.icon;
            const isConnecting = connecting === platform.value;
            const isConnected = profile?.socialAccounts?.some(
              acc => acc.platform.toLowerCase() === platform.value.toLowerCase()
            );

            return (
              <motion.div
                key={platform.value}
                variants={{
                  hidden: { y: 20, opacity: 0 },
                  visible: {
                    y: 0,
                    opacity: 1,
                    transition: {
                      type: "spring",
                      stiffness: 100,
                      damping: 12
                    }
                  }
                }}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                className="group relative"
              >
                <button
                  onClick={() => handleConnect(platform.value)}
                  disabled={isConnecting || profileStatus !== 'ready'}
                  className={`
                    w-full bg-white rounded-xl p-6 
                    shadow-md hover:shadow-xl 
                    ${platform.hoverColor}
                    transition-all duration-300
                    border border-gray-200
                    disabled:opacity-70 disabled:cursor-not-allowed
                    relative overflow-hidden
                    ${isConnected ? 'ring-2 ring-green-500' : ''}
                  `}
                >
                  {isConnected && (
                    <div className="absolute top-2 right-2 bg-green-500 rounded-full p-1">
                      <FaCheckCircle className="text-white text-sm" />
                    </div>
                  )}

                  <div className={`
                    absolute inset-0 bg-gradient-to-r ${platform.color} 
                    opacity-0 group-hover:opacity-5 transition-opacity duration-300
                  `} />

                  <div className="relative z-10 flex flex-col items-center space-y-4">
                    <motion.div
                      whileHover={{ rotate: [0, -10, 10, -10, 0] }}
                      transition={{ duration: 0.5 }}
                      className={`
                        w-16 h-16 rounded-full 
                        bg-gradient-to-r ${platform.color}
                        flex items-center justify-center
                        shadow-lg relative
                      `}
                    >
                      <Icon className="text-white text-3xl" />
                    </motion.div>

                    <div className="text-center">
                      <h3 className="text-xl font-semibold text-gray-800 mb-1">
                        {platform.name}
                      </h3>
                      
                      <div className="flex items-center justify-center space-x-2">
                        {isConnecting ? (
                          <>
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ 
                                repeat: Infinity, 
                                duration: 1, 
                                ease: "linear" 
                              }}
                              className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full"
                            />
                            <span className="text-sm text-gray-500">
                              Connecting...
                            </span>
                          </>
                        ) : isConnected ? (
                          <span className="text-sm font-medium text-green-600">
                            Connected
                          </span>
                        ) : (
                          <span className={`
                            text-sm font-medium bg-gradient-to-r ${platform.color}
                            bg-clip-text text-transparent
                            group-hover:underline
                          `}>
                            Connect Account
                          </span>
                        )}
                      </div>
                    </div>

                    {!isConnected && (
                      <motion.div
                        initial={{ x: 0 }}
                        whileHover={{ x: 5 }}
                        className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <svg 
                          className="w-5 h-5 text-gray-400" 
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                            strokeWidth={2} 
                            d="M9 5l7 7-7 7" 
                          />
                        </svg>
                      </motion.div>
                    )}
                  </div>
                </button>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Info Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="mt-12 bg-blue-50 border border-blue-200 rounded-lg p-6"
        >
          <div className="flex items-start space-x-3">
            <svg 
              className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" 
              fill="currentColor" 
              viewBox="0 0 20 20"
            >
              <path 
                fillRule="evenodd" 
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" 
                clipRule="evenodd" 
              />
            </svg>
            <div>
              <h4 className="text-sm font-semibold text-blue-900 mb-1">
                Enterprise-Grade Security
              </h4>
              <p className="text-sm text-blue-700">
                Your credentials are encrypted and securely stored using industry-standard protocols. 
                You maintain full control and can disconnect any account at any time from your settings dashboard.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default SocialConnector;
