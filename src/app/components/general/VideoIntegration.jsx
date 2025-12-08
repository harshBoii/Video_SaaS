"use client"
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  FaFacebook, 
  FaInstagram, 
  FaLinkedin, 
  FaTwitter, 
  FaYoutube, 
  FaPinterest, 
  FaReddit,
  FaGoogle
} from 'react-icons/fa';
import { SiThreads } from 'react-icons/si';
import { MdBusiness } from 'react-icons/md';

const SocialConnector = ({ apiKey, profileId, redirectUrl }) => {
  const [connecting, setConnecting] = useState(null);

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

  const handleConnect = async (platform) => {
    setConnecting(platform);
    
    try {
      const params = new URLSearchParams({
        profileId: profileId,
        ...(redirectUrl && { redirect_url: redirectUrl })
      });

      const response = await fetch(
        `https://api.getlate.dev/v1/connect/${platform}?${params}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const data = await response.json();
      
      if (data.authorizationUrl) {
        window.location.href = data.authorizationUrl;
      }
    } catch (error) {
      console.error('Connection error:', error);
    } finally {
      setConnecting(null);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08
      }
    }
  };

  const itemVariants = {
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
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-4 sm:px-6 lg:px-8">
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
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {platforms.map((platform) => {
            const Icon = platform.icon;
            const isConnecting = connecting === platform.value;

            return (
              <motion.div
                key={platform.value}
                variants={itemVariants}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                className="group relative"
              >
                <button
                  onClick={() => handleConnect(platform.value)}
                  disabled={isConnecting}
                  className={`
                    w-full bg-white rounded-xl p-6 
                    shadow-md hover:shadow-xl 
                    ${platform.hoverColor}
                    transition-all duration-300
                    border border-gray-200
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
              </motion.div>
            );
          })}
        </motion.div>

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
                Secure Connection
              </h4>
              <p className="text-sm text-blue-700">
                Your credentials are encrypted and securely stored. You can disconnect any account at any time from your settings.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default SocialConnector;
