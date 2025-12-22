'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiChevronDown,
  FiTarget,
  FiCheck,
  FiPlus,
  FiSearch,
  FiCalendar,
  FiTrendingUp,
} from 'react-icons/fi';

// Mock campaigns data
const mockCampaigns = [
  {
    id: 'default',
    name: 'General Chat',
    description: 'Chat without campaign context',
    icon: null,
    isDefault: true,
  },
  {
    id: 'camp-1',
    name: 'Summer 2024',
    description: 'Summer marketing campaign',
    color: '#FF6B6B',
    status: 'active',
    progress: 65,
  },
  {
    id: 'camp-2',
    name: 'Product Launch Q1',
    description: 'New product line launch',
    color: '#4ECDC4',
    status: 'active',
    progress: 40,
  },
  {
    id: 'camp-3',
    name: 'Rebranding 2024',
    description: 'Company rebranding initiative',
    color: '#9B59B6',
    status: 'planning',
    progress: 15,
  },
  {
    id: 'camp-4',
    name: 'Holiday Special',
    description: 'End of year holiday campaign',
    color: '#F39C12',
    status: 'draft',
    progress: 0,
  },
];

const StatusBadge = ({ status }) => {
  const statusConfig = {
    active: { bg: 'bg-green-500/10', text: 'text-green-600 dark:text-green-400', label: 'Active' },
    planning: { bg: 'bg-blue-500/10', text: 'text-blue-600 dark:text-blue-400', label: 'Planning' },
    draft: { bg: 'bg-gray-500/10', text: 'text-gray-600 dark:text-gray-400', label: 'Draft' },
    completed: { bg: 'bg-purple-500/10', text: 'text-purple-600 dark:text-purple-400', label: 'Completed' },
  };

  const config = statusConfig[status] || statusConfig.draft;

  return (
    <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${config.bg} ${config.text}`}>
      {config.label}
    </span>
  );
};

const CampaignOption = ({ campaign, isSelected, onSelect }) => (
  <motion.button
    whileHover={{ x: 2 }}
    onClick={() => onSelect(campaign)}
    className={`
      w-full flex items-center gap-3 p-3 rounded-xl text-left transition-colors
      ${isSelected 
        ? 'bg-primary/10 dark:bg-primary/20 border border-primary/20' 
        : 'hover:bg-clipfox-surface-hover dark:hover:bg-white/5 border border-transparent'
      }
    `}
  >
    {/* Campaign Icon/Color */}
    <div
      className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
      style={{ 
        backgroundColor: campaign.color ? `${campaign.color}20` : 'var(--muted)',
      }}
    >
      {campaign.isDefault ? (
        <FiTarget className="w-4 h-4 text-muted-foreground" />
      ) : (
        <div 
          className="w-3 h-3 rounded-full"
          style={{ backgroundColor: campaign.color }}
        />
      )}
    </div>

    {/* Campaign Info */}
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-foreground truncate">
          {campaign.name}
        </span>
        {campaign.status && <StatusBadge status={campaign.status} />}
      </div>
      <p className="text-xs text-muted-foreground truncate">
        {campaign.description}
      </p>
    </div>

    {/* Progress or Check */}
    {isSelected ? (
      <FiCheck className="w-4 h-4 text-primary flex-shrink-0" />
    ) : campaign.progress !== undefined && (
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <div className="w-12 h-1.5 rounded-full bg-muted overflow-hidden">
          <div 
            className="h-full rounded-full bg-primary/60"
            style={{ width: `${campaign.progress}%` }}
          />
        </div>
        <span className="text-[10px] text-muted-foreground">{campaign.progress}%</span>
      </div>
    )}
  </motion.button>
);

const CampaignSelector = ({ selectedCampaign, onSelectCampaign }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef(null);

  const campaigns = mockCampaigns;
  const selected = campaigns.find(c => c.id === selectedCampaign) || campaigns[0];

  const filteredCampaigns = campaigns.filter(campaign =>
    campaign.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    campaign.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (campaign) => {
    onSelectCampaign?.(campaign.id);
    setIsOpen(false);
    setSearchQuery('');
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <motion.button
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-clipfox-surface dark:bg-white/5 border border-border hover:border-primary/30 transition-all"
      >
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center"
          style={{ 
            backgroundColor: selected.color ? `${selected.color}20` : 'var(--muted)',
          }}
        >
          {selected.isDefault ? (
            <FiTarget className="w-3.5 h-3.5 text-muted-foreground" />
          ) : (
            <div 
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: selected.color }}
            />
          )}
        </div>
        <div className="text-left">
          <p className="text-sm font-medium text-foreground">{selected.name}</p>
        </div>
        <FiChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </motion.button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 mt-2 w-80 rounded-2xl bg-background dark:bg-card border border-border shadow-xl z-50 overflow-hidden"
          >
            {/* Search */}
            <div className="p-3 border-b border-border">
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search campaigns..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-lg bg-clipfox-surface dark:bg-white/5 border border-border text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
            </div>

            {/* Campaign List */}
            <div className="max-h-72 overflow-y-auto p-2 space-y-1">
              {filteredCampaigns.map(campaign => (
                <CampaignOption
                  key={campaign.id}
                  campaign={campaign}
                  isSelected={selected.id === campaign.id}
                  onSelect={handleSelect}
                />
              ))}

              {filteredCampaigns.length === 0 && (
                <div className="py-8 text-center">
                  <p className="text-sm text-muted-foreground">No campaigns found</p>
                </div>
              )}
            </div>

            {/* Create New Campaign */}
            <div className="p-2 border-t border-border">
              <motion.button
                whileHover={{ x: 2 }}
                className="w-full flex items-center gap-3 p-3 rounded-xl text-left hover:bg-primary/10 transition-colors group"
              >
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <FiPlus className="w-4 h-4 text-primary group-hover:text-primary-foreground" />
                </div>
                <div>
                  <span className="text-sm font-medium text-foreground">Create New Campaign</span>
                  <p className="text-xs text-muted-foreground">Start a new marketing campaign</p>
                </div>
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CampaignSelector;
