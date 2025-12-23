'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiMenu,
  FiArrowLeft,
  FiArrowRight,
  FiMoreVertical,
  FiSettings,
  FiTrash2,
  FiDownload,
  FiShare2,
} from 'react-icons/fi';

import ChatSidebar from './components/ChatSidebar';
import ChatMessage from './components/ChatMessage';
import ChatInput from './components/ChatInput';
import CampaignSelector from './components/CampaignSelector';

// Mock messages data
const mockMessages = [
  {
    id: '1',
    role: 'user',
    content: 'I want to create a summer marketing campaign for our new product line. Can you help me brainstorm some ideas?',
    timestamp: new Date(Date.now() - 600000),
  },
  {
    id: '2',
    role: 'assistant',
    content: `I'd be happy to help you create an engaging summer marketing campaign! Here are some creative ideas tailored for a product launch:

**Campaign Theme: "Summer Vibes, Elevated"**

1. **Social Media Blitz**
   - Create a series of vibrant, summer-themed posts
   - Launch a user-generated content contest with branded hashtag
   - Partner with micro-influencers for authentic reach

2. **Video Content Strategy**
   - Lifestyle videos showcasing products in summer settings
   - Behind-the-scenes content of product development
   - Customer testimonial compilations

3. **Interactive Experiences**
   - Virtual summer event or product showcase
   - AR filters for social platforms
   - Gamified promotions with summer rewards

4. **Email Marketing**
   - "Summer Countdown" email series
   - Exclusive early access for subscribers
   - Personalized product recommendations

Would you like me to dive deeper into any of these strategies or help you create specific content for any of them?`,
    timestamp: new Date(Date.now() - 540000),
  },
  {
    id: '3',
    role: 'user',
    content: 'I love the video content strategy idea! Can you help me create a script outline for a 60-second promotional video?',
    timestamp: new Date(Date.now() - 480000),
  },
  {
    id: '4',
    role: 'assistant',
    content: `Here's a compelling 60-second promotional video script outline:

**Opening Hook (0-5 seconds)**
- Dynamic summer visuals with upbeat music
- Text overlay: "This Summer, Discover Something New"

**Problem Statement (5-15 seconds)**
- Quick cuts showing common summer frustrations
- Voiceover: "We know what you're looking for..."

**Product Reveal (15-30 seconds)**
- Cinematic product shots
- Highlight 2-3 key features with visual demonstrations
- Benefit-focused messaging

**Social Proof (30-40 seconds)**
- Quick testimonial clips or review highlights
- Trust badges and accolades

**Call to Action (40-55 seconds)**
- Special summer offer reveal
- Clear CTA: "Shop Now" or "Learn More"
- Website/social handles

**Closing (55-60 seconds)**
- Brand logo animation
- Campaign tagline

Shall I help you develop the full script with specific dialogue and shot descriptions?`,
    timestamp: new Date(Date.now() - 420000),
  },
];

const EmptyState = () => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="flex flex-col items-center justify-center h-full px-4"
  >
    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-clipfox-accent/20 flex items-center justify-center mb-6">
      <svg
        className="w-10 h-10 text-primary"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <path d="M12 2L2 7l10 5 10-5-10-5z" />
        <path d="M2 17l10 5 10-5" />
        <path d="M2 12l10 5 10-5" />
      </svg>
    </div>
    <h2 className="text-2xl font-heading font-semibold text-foreground mb-2">
      How can I help you today?
    </h2>
    <p className="text-muted-foreground text-center max-w-md mb-8">
      I can help you create campaigns, generate creative content, write scripts, 
      and much more. Just ask!
    </p>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-xl w-full">
      {[
        { title: 'Create a Campaign', desc: 'Start a new marketing campaign from scratch' },
        { title: 'Generate Video Ideas', desc: 'Get creative video concepts for your brand' },
        { title: 'Write Marketing Copy', desc: 'Craft compelling copy for ads and posts' },
        { title: 'Analyze Performance', desc: 'Review and optimize campaign metrics' },
      ].map((item, index) => (
        <motion.button
          key={index}
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
          className="p-4 rounded-xl glass-card hover:border-primary/30 text-left transition-all group"
        >
          <h3 className="text-sm font-medium text-foreground mb-1 group-hover:text-primary transition-colors">
            {item.title}
          </h3>
          <p className="text-xs text-muted-foreground">{item.desc}</p>
        </motion.button>
      ))}
    </div>
  </motion.div>
);

export default function Chat() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedChat, setSelectedChat] = useState('1');
  const [selectedCampaign, setSelectedCampaign] = useState('default');
  const [messages, setMessages] = useState(mockMessages);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (messageData) => {
    const newUserMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: messageData.content,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, newUserMessage]);
    setIsLoading(true);

    // Simulate AI response
    setTimeout(() => {
      const aiResponse = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `I understand you want to "${messageData.content}". Let me help you with that!\n\nBased on your request, here are my recommendations:\n\n1. **First Step** - Start by defining your goals and target audience\n2. **Second Step** - Create a content calendar for consistency\n3. **Third Step** - Develop engaging visual assets\n4. **Fourth Step** - Launch and monitor performance\n\nWould you like me to elaborate on any of these points or help you get started with implementation?`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiResponse]);
      setIsLoading(false);
    }, 1500);
  };

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden">
      {/* Chat History Sidebar */}
      <ChatSidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        selectedChat={selectedChat}
        onSelectChat={setSelectedChat}
      />

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Chat Header */}
        <header className="flex items-center justify-between px-4 md:px-6 py-3 border-b border-[var(--glass-border)] glass">
          <div className="flex items-center gap-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-[var(--glass-hover)] transition-colors"
            >
              {sidebarOpen ? (
                <FiArrowLeft className="w-5 h-5" />
              ) : (
                <FiArrowRight className="w-5 h-5" />
              )}
            </motion.button>

            <CampaignSelector
              selectedCampaign={selectedCampaign}
              onSelectCampaign={setSelectedCampaign}
            />
          </div>

          <div className="flex items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-[var(--glass-hover)] transition-colors"
            >
              <FiShare2 className="w-5 h-5" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-[var(--glass-hover)] transition-colors"
            >
              <FiDownload className="w-5 h-5" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-[var(--glass-hover)] transition-colors"
            >
              <FiMoreVertical className="w-5 h-5" />
            </motion.button>
          </div>
        </header>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto">
          {messages.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="divide-y divide-border/50">
              {messages.map((message) => (
                <ChatMessage key={message.id} message={message} />
              ))}
              
              {/* Loading indicator */}
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex gap-4 py-6 px-4 md:px-8 bg-[var(--glass-hover)]"
                >
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-clipfox-accent flex items-center justify-center">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                      className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                    />
                  </div>
                  <div className="flex items-center gap-1">
                    <motion.div
                      animate={{ opacity: [0.4, 1, 0.4] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                      className="w-2 h-2 rounded-full bg-muted-foreground"
                    />
                    <motion.div
                      animate={{ opacity: [0.4, 1, 0.4] }}
                      transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
                      className="w-2 h-2 rounded-full bg-muted-foreground"
                    />
                    <motion.div
                      animate={{ opacity: [0.4, 1, 0.4] }}
                      transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }}
                      className="w-2 h-2 rounded-full bg-muted-foreground"
                    />
                  </div>
                </motion.div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Chat Input */}
        <ChatInput onSend={handleSendMessage} isLoading={isLoading} />
      </div>
    </div>
  );
}
