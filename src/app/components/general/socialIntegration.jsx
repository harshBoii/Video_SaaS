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
  FaTrash,
  FaTimes
} from 'react-icons/fa';
import { SiThreads } from 'react-icons/si';
import { MdBusiness, MdClose } from 'react-icons/md';
import { HiLightningBolt } from 'react-icons/hi';
import Link from 'next/link';
import { showConfirm } from '@/app/lib/swal';
import customSwal from '@/app/lib/swal';

const SocialConnector = ({ redirectUrl }) => {
  const [profileStatus, setProfileStatus] = useState('loading');
  const [profile, setProfile] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [creatingProfile, setCreatingProfile] = useState(false);
  const [connecting, setConnecting] = useState(null);
  const [error, setError] = useState(null);
  const [deletingProfile, setDeletingProfile] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(null);

  const platforms = [
    { 
      name: 'Twitter', 
      value: 'twitter', 
      icon: FaTwitter, 
      color: 'from-[#1DA1F2] to-[#0d8bd9]',
      hoverColor: 'hover:shadow-[#1DA1F2]/50',
      link:"/socials/twitter"
    },
    { 
      name: 'Instagram', 
      value: 'instagram', 
      icon: FaInstagram, 
      color: 'from-[#E4405F] to-[#9C27B0]',
      hoverColor: 'hover:shadow-[#E4405F]/50',
      link:"/socials/instagram"
    },
    { 
      name: 'Facebook', 
      value: 'facebook', 
      icon: FaFacebook, 
      color: 'from-[#1877F2] to-[#0c5ecf]',
      hoverColor: 'hover:shadow-[#1877F2]/50',
      link:"/socials/facebook"
    },
    { 
      name: 'LinkedIn', 
      value: 'linkedin', 
      icon: FaLinkedin, 
      color: 'from-[#0A66C2] to-[#004182]',
      hoverColor: 'hover:shadow-[#0A66C2]/50',
      link:"/socials/linkedin"
    },
    { 
      name: 'YouTube', 
      value: 'youtube', 
      icon: FaYoutube, 
      color: 'from-[#FF0000] to-[#cc0000]',
      hoverColor: 'hover:shadow-[#FF0000]/50',
      link:"/socials/youtube"
    },
    { 
      name: 'Pinterest', 
      value: 'pinterest', 
      icon: FaPinterest, 
      color: 'from-[#E60023] to-[#bd001c]',
      hoverColor: 'hover:shadow-[#E60023]/50',
      link:"/socials/pinterest"
    },
    { 
      name: 'Reddit', 
      value: 'reddit', 
      icon: FaReddit, 
      color: 'from-[#FF4500] to-[#d63a00]',
      hoverColor: 'hover:shadow-[#FF4500]/50',
      link:"/socials/reddit"
    },
    { 
      name: 'Threads', 
      value: 'threads', 
      icon: SiThreads, 
      color: 'from-[#000000] to-[#333333]',
      hoverColor: 'hover:shadow-gray-700/50',
      link:"/socials/threads"
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
      hoverColor: 'hover:shadow-[#4285F4]/50',
      link:"/socials/google"
    }
  ];

  const checkProfileStatus = useCallback(async () => {
    try {
      const response = await fetch('/api/social/profile', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      fetch('/api/social/accounts/sync',{
        method:'POST',
        headers:{
          'Content-Type': 'application/json',
        },
        credentials:'include',
      })


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

      fetch('api/social/accounts/sync',{
        method:'POST',
        headers:{
          'Content-Type': 'application/json',
        },
        credentials:'include',
      })

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

  const deleteProfile = async () => {
    const confirmed = await showConfirm(
    '⚠️ Are you sure you want to delete your profile?',
    'This will disconnect all social accounts and cannot be undone.',
    'Yes, delete',
    'No'
  );
    
    if (!confirmed.isConfirmed) return;

    setDeletingProfile(true);
    setError(null);

    try {
      customSwal.fire({
                        title: 'Deleting...',
                        allowOutsideClick: false,
                        didOpen: () => customSwal.showLoading()
                      });

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
      customSwal.close()
      setProfile(null);
      setProfileStatus('needsSetup');
      setShowModal(true);
      toast.success('Profile deleted successfully', { icon: '✅' });
    } catch (error) {
      customSwal.close()
      console.error('Profile deletion error:', error);
      setError(error.message);
      toast.error(error.message);
    } finally {
      setDeletingProfile(false);
    }
  };

  const deleteAccount = async (accountId, platform, username) => {
    const confirmed = await showConfirm(
      `⚠️ Are you sure you want to disconnect ${platform} (@${username})?`,
      'You can reconnect it later.',
      'Disconnect',
      'Keep Connected'
    );
    
    if (!confirmed.isConfirmed) return;

    setDeletingAccount(accountId);
    setError(null);

    try {
      customSwal.fire({
                  title: 'Deleting...',
                  allowOutsideClick: false,
                  didOpen: () => customSwal.showLoading()
                });

      const response = await fetch(`/api/social/accounts/${accountId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to disconnect account');
      }

      await checkProfileStatus();
      customSwal.close()
      toast.success(`${platform} account disconnected successfully`, {
        icon: '✅',
        duration: 4000
      });
    } catch (error) {
      customSwal.close()
      console.error('Account deletion error:', error);
      setError(error.message);
      toast.error(error.message);
    } finally {
      setDeletingAccount(null);
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
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
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

      <AnimatePresence>
        {showModal && (
          <motion.div
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4"
            style={{ zIndex: 99999 }}
            onClick={() => !creatingProfile && setShowModal(false)}
          >
            <motion.div
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="glass-card rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative bg-gradient-to-r from-primary to-violet-500 p-8 text-white">
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
                    Let&apos;s set up your social media hub
                  </p>
                </motion.div>
              </div>

              <div className="p-8">
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="space-y-6"
                >
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                      <FaCheckCircle className="text-2xl text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-1">
                        Initialize Your Social Profile
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        To begin connecting your social media accounts, we need to create 
                        a centralized profile that will serve as your content management hub.
                      </p>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-primary/10 to-violet-500/10 rounded-xl p-4 border border-primary/20">
                    <h4 className="font-medium text-foreground mb-2 flex items-center">
                      <HiLightningBolt className="mr-2 text-violet-500" />
                      What you&apos;ll get:
                    </h4>
                    <ul className="space-y-2 text-sm text-foreground">
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
                    className="w-full bg-gradient-to-r from-primary to-violet-500 text-primary-foreground py-4 px-6 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
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

                  <p className="text-xs text-center text-muted-foreground">
                    This process is secure and takes just a moment
                  </p>
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Section with Gradient Background */}
      <div className="relative overflow-hidden">
        {/* Animated Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 via-primary/10 to-violet-500/20" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent" />
        
        {/* Floating Shapes */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-br from-blue-500/30 to-cyan-500/30 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-gradient-to-br from-violet-500/20 to-primary/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />

        <div className="relative max-w-6xl mx-auto px-6 pt-8 pb-12">
          {/* Headline */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-4">
              <span className="bg-gradient-to-r from-blue-500 via-primary to-violet-500 bg-clip-text text-transparent">
                Connect Your
              </span>
              <span className="text-foreground"> Social World</span>
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Link your social media platforms to streamline your content management and scheduling
            </p>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex items-center justify-center gap-4 flex-wrap"
          >
            {profile ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="inline-flex items-center space-x-2 glass-card px-5 py-2.5 rounded-full border-2 border-emerald-500/50"
              >
                <FaCheckCircle className="text-emerald-500" />
                <span className="text-sm font-medium text-foreground">Profile Active: {profile.name}</span>
              </motion.div>
            ) : (
              <motion.button
                onClick={() => setShowModal(true)}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                className="inline-flex items-center space-x-2 bg-gradient-to-r from-primary to-violet-500 text-primary-foreground px-6 py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <FaRocket />
                <span className="text-sm font-semibold">Initialize Social Profile</span>
              </motion.button>
            )}

            {profileStatus === 'ready' && (
              <motion.button
                onClick={deleteProfile}
                disabled={deletingProfile}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: deletingProfile ? 1 : 1.05, y: deletingProfile ? 0 : -2 }}
                whileTap={{ scale: deletingProfile ? 1 : 0.95 }}
                className="inline-flex items-center space-x-2 glass-card text-destructive px-4 py-2 rounded-full border border-destructive/30 shadow-sm hover:shadow-md hover:bg-destructive/10 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Delete Profile"
              >
                {deletingProfile ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                      className="w-4 h-4 border-2 border-destructive border-t-transparent rounded-full"
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
          </motion.div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {profile?.socialAccounts && profile.socialAccounts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12 glass-card p-6"
          >
            <h3 className="text-xl font-semibold text-foreground mb-4">Connected Accounts</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {profile.socialAccounts.map((account) => (
                <div
                  key={account.id}
                  className="relative flex items-center space-x-3 p-3 bg-[var(--glass-hover)] rounded-xl hover:bg-[var(--glass-active)] transition-colors group"
                >
                  {account.profilePicture && (
                    <img 
                      src={account.profilePicture} 
                      alt={account.username}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {account.displayName || account.username}
                    </p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {account.platform.toLowerCase()}
                    </p>
                  </div>
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteAccount(
                        account.accountId,
                        account.platform,
                        account.username
                      );
                    }}
                    disabled={deletingAccount === account.lateAccountId}
                    className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                    title={`Disconnect ${account.platform}`}
                  >
                    {deletingAccount === account.lateAccountId ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                        className="w-3 h-3 border-2 border-white border-t-transparent rounded-full"
                      />
                    ) : (
                      <FaTimes className="text-xs" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          </motion.div>
        )}

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
            const connectedAccount = profile?.socialAccounts?.find(
              acc => acc.platform.toLowerCase() === platform.value.toLowerCase()
            );
            const isConnected = !!connectedAccount;

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
                {isConnected ? (
                  <Link
                    href={''}
                    className={`
                      w-full glass-card rounded-xl p-6 
                      hover:shadow-2xl 
                      ${platform.hoverColor}
                      transition-all duration-300
                      relative overflow-hidden
                      ring-2 ring-emerald-500
                      flex flex-col items-center
                      cursor-pointer
                    `}
                  >
                    <div className="absolute top-2 right-2 bg-emerald-500 rounded-full p-1">
                      <FaCheckCircle className="text-white text-sm" />
                    </div>

                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        deleteAccount(
                          connectedAccount.accountId,
                          platform.name,
                          connectedAccount.username
                        );
                      }}
                      disabled={deletingAccount === connectedAccount.lateAccountId}
                      className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity bg-red-500 hover:bg-red-600 text-white rounded-full p-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed z-10"
                      title={`Disconnect ${platform.name}`}
                    >
                      {deletingAccount === connectedAccount.lateAccountId ? (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                          className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                        />
                      ) : (
                        <FaTrash className="text-sm" />
                      )}
                    </button>

                    <div className={`
                      absolute inset-0 bg-gradient-to-r ${platform.color} 
                      opacity-0 group-hover:opacity-5 transition-opacity duration-300
                    `} />
                    <div className="relative z-10 flex flex-col items-center space-y-4 w-full">
                      <motion.div
                        whileHover={{ rotate: [0, -10, 10, -10, 0] }}
                        transition={{ duration: 0.5 }}
                        className={`
                          w-16 h-16 rounded-full 
                          bg-gradient-to-r ${platform.color}
                          flex items-center justify-center
                          shadow-lg relative
                        `}>
                        <Icon className="text-white text-3xl" />
                      </motion.div>

                      <div className="text-center">
                        <h3 className="text-xl font-semibold text-foreground mb-1">
                          {platform.name}
                        </h3>
                        
                        <div className="flex items-center justify-center space-x-2">
                          <span className="text-sm font-medium text-emerald-600">
                            Connected
                          </span>
                        </div>
                      </div>

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
                    </div>
                  </Link>
                ) : (
                  <button
                    onClick={() => handleConnect(platform.value)}
                    disabled={isConnecting || profileStatus !== 'ready'}
                    className={`
                      w-full glass-card rounded-xl p-6 
                      hover:shadow-2xl 
                      ${platform.hoverColor}
                      transition-all duration-300
                      disabled:opacity-70 disabled:cursor-not-allowed
                      relative overflow-hidden
                    `}
                  >
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
                        <h3 className="text-xl font-semibold text-foreground mb-1">
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
                    </div>
                  </button>
                )}
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </div>
  );
};

export default SocialConnector;
