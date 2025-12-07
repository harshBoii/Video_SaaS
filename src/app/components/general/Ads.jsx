'use client'
import React, { useState, useCallback, useMemo, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Memoized Input Components to prevent re-renders
const TextInput = memo(({ label, value, onChange, placeholder, type = "text" }) => (
  <div>
    <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1.5 md:mb-2">{label}</label>
    <input
      type={type}
      value={value}
      onChange={onChange}
      className="w-full px-3 md:px-4 py-2.5 md:py-3 text-sm md:text-base border border-gray-300 rounded-lg md:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
      placeholder={placeholder}
    />
  </div>
));
TextInput.displayName = 'TextInput';

const TextArea = memo(({ label, value, onChange, placeholder, rows = 4 }) => (
  <div>
    <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1.5 md:mb-2">{label}</label>
    <textarea
      value={value}
      onChange={onChange}
      rows={rows}
      className="w-full px-3 md:px-4 py-2.5 md:py-3 text-sm md:text-base border border-gray-300 rounded-lg md:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none outline-none"
      placeholder={placeholder}
    />
  </div>
));
TextArea.displayName = 'TextArea';

// Create Ad Section - Memoized
const CreateAdSection = memo(({ 
  selectedAccount, 
  selectedCampaign, 
  setSelectedCampaign,
  campaigns,
  creativeType,
  setCreativeType,
  predefinedCreatives,
  setShowCustomAdsetModal,
  selectedVideos,
  handleVideoUpload,
  adFields,
  onAdFieldChange,
  setShowAccountModal
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4 }}
    className="space-y-4 md:space-y-6"
  >
    {/* Meta Accounts Display */}
    <motion.div
      className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 rounded-xl md:rounded-2xl p-4 md:p-6 shadow-lg border border-blue-100"
      whileHover={{ scale: 1.005 }}
      transition={{ type: "spring", stiffness: 300 }}
    >
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-3 w-full md:w-auto">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-md">
              <span className="text-white font-bold text-lg md:text-xl">f</span>
            </div>
            <div>
              <p className="text-xs md:text-sm text-gray-600 font-medium">Facebook Account</p>
              <p className="font-semibold text-gray-900 text-sm md:text-base">{selectedAccount.facebook}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-purple-600 via-pink-600 to-orange-500 rounded-xl flex items-center justify-center shadow-md">
              <span className="text-white font-bold text-base md:text-lg">IG</span>
            </div>
            <div>
              <p className="text-xs md:text-sm text-gray-600 font-medium">Instagram Account</p>
              <p className="font-semibold text-gray-900 text-sm md:text-base">{selectedAccount.instagram}</p>
            </div>
          </div>
        </div>
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={setShowAccountModal}
          className="w-full md:w-auto px-5 md:px-6 py-2.5 md:py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg md:rounded-xl font-medium shadow-md hover:shadow-xl transition-shadow text-sm md:text-base"
        >
          Change Accounts
        </motion.button>
      </div>
    </motion.div>

    {/* Campaign Selection */}
    <motion.div
      className="bg-white rounded-xl md:rounded-2xl p-4 md:p-6 shadow-md border border-gray-100"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.1 }}
    >
      <label className="block text-sm md:text-base font-semibold text-gray-700 mb-2 md:mb-3">
        Select Campaign
      </label>
      <select
        value={selectedCampaign}
        onChange={setSelectedCampaign}
        className="w-full px-3 md:px-4 py-2.5 md:py-3 text-sm md:text-base border border-gray-300 rounded-lg md:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
      >
        <option value="">Choose a campaign...</option>
        {campaigns.map(campaign => (
          <option key={campaign.id} value={campaign.id}>{campaign.name}</option>
        ))}
      </select>
    </motion.div>

    {/* Creative Selection */}
    <motion.div
      className="bg-white rounded-xl md:rounded-2xl p-4 md:p-6 shadow-md border border-gray-100"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.2 }}
    >
      <label className="block text-sm md:text-base font-semibold text-gray-700 mb-2 md:mb-3">
        Creative Type
      </label>
      <select
        value={creativeType}
        onChange={setCreativeType}
        className="w-full px-3 md:px-4 py-2.5 md:py-3 text-sm md:text-base border border-gray-300 rounded-lg md:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
      >
        <option value="predefined">Predefined Creatives</option>
        {predefinedCreatives.map(creative => (
          <option key={creative.id} value={creative.id}>{creative.name}</option>
        ))}
        <option value="custom">Custom Adset</option>
      </select>
    </motion.div>

    {/* Video Upload */}
    <motion.div
      className="bg-white rounded-xl md:rounded-2xl p-4 md:p-6 shadow-md border border-gray-100"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.3 }}
    >
      <label className="block text-sm md:text-base font-semibold text-gray-700 mb-2 md:mb-3">
        Upload Videos
      </label>
      <div className="border-2 border-dashed border-gray-300 rounded-lg md:rounded-xl p-6 md:p-8 text-center hover:border-blue-500 hover:bg-blue-50/30 transition-all cursor-pointer">
        <input
          type="file"
          multiple
          accept="video/*"
          onChange={handleVideoUpload}
          className="hidden"
          id="video-upload"
        />
        <label htmlFor="video-upload" className="cursor-pointer block">
          <motion.div whileHover={{ scale: 1.02 }}>
            <svg className="mx-auto h-10 w-10 md:h-12 md:w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
              <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <p className="mt-2 text-xs md:text-sm text-gray-600 font-medium">Click to upload or drag and drop</p>
            <p className="text-xs text-gray-500 mt-1">MP4, MOV, AVI (MAX. 500MB)</p>
          </motion.div>
        </label>
      </div>
      {selectedVideos.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mt-3 md:mt-4 space-y-2"
        >
          {selectedVideos.map((video, idx) => (
            <motion.div 
              key={idx} 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50 p-3 rounded-lg border border-blue-100"
            >
              <span className="text-xs md:text-sm text-gray-700 font-medium truncate flex-1">{video.name}</span>
              <span className="text-xs text-gray-500 ml-2">{(video.size / 1024 / 1024).toFixed(2)} MB</span>
            </motion.div>
          ))}
        </motion.div>
      )}
    </motion.div>

    {/* Ad Setup Fields */}
    <motion.div
      className="bg-white rounded-xl md:rounded-2xl p-4 md:p-6 shadow-md border border-gray-100"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.4 }}
    >
      <h3 className="text-base md:text-lg font-semibold text-gray-800 mb-3 md:mb-4">Ad Setup</h3>
      <div className="space-y-3 md:space-y-4">
        <TextArea
          label="Body Text"
          value={adFields.bodyText}
          onChange={onAdFieldChange.bodyText}
          placeholder="Enter your ad body text..."
        />
        <TextInput
          label="Headline"
          value={adFields.headline}
          onChange={onAdFieldChange.headline}
          placeholder="Enter headline..."
        />
        <TextInput
          label="App URL"
          type="url"
          value={adFields.appUrl}
          onChange={onAdFieldChange.appUrl}
          placeholder="https://example.com"
        />
      </div>
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="w-full mt-4 md:mt-6 px-6 py-3 md:py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg md:rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all text-sm md:text-base"
      >
        Launch Campaign
      </motion.button>
    </motion.div>
  </motion.div>
));
CreateAdSection.displayName = 'CreateAdSection';

// Ad History Section - Memoized
const AdHistorySection = memo(({ adHistory }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4 }}
    className="space-y-3 md:space-y-4"
  >
    <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-4 md:mb-6">Ad History</h2>
    {adHistory.map((ad, idx) => (
      <motion.div
        key={ad.id}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: idx * 0.08 }}
        className="bg-white rounded-xl md:rounded-2xl p-4 md:p-6 shadow-md border border-gray-100 hover:shadow-lg hover:border-blue-200 transition-all"
      >
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
          <div>
            <p className="text-xs text-gray-500 mb-1 font-medium">Launch Date</p>
            <p className="font-semibold text-gray-800 text-xs md:text-sm">{ad.launchDate}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1 font-medium">Account</p>
            <p className="font-semibold text-gray-800 text-xs md:text-sm">{ad.account}</p>
          </div>
          <div className="col-span-2 md:col-span-1">
            <p className="text-xs text-gray-500 mb-1 font-medium">Campaign</p>
            <p className="font-semibold text-gray-800 text-xs md:text-sm">{ad.campaign}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1 font-medium">Adset</p>
            <p className="font-semibold text-gray-800 text-xs md:text-sm">{ad.adset}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1 font-medium">Status</p>
            <span className={`inline-flex px-2.5 md:px-3 py-1 rounded-full text-xs font-semibold ${
              ad.status === 'Active' ? 'bg-green-100 text-green-800' :
              ad.status === 'Paused' ? 'bg-yellow-100 text-yellow-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {ad.status}
            </span>
          </div>
          <div className="col-span-2 md:col-span-3 lg:col-span-1 flex items-end">
            <motion.a
              href={`#/ad-detail/${ad.id}`}
              whileHover={{ scale: 1.03 }}
              className="text-blue-600 hover:text-blue-800 font-medium text-xs md:text-sm underline"
            >
              View Details →
            </motion.a>
          </div>
        </div>
      </motion.div>
    ))}
  </motion.div>
));
AdHistorySection.displayName = 'AdHistorySection';

const INDIAN_PRESETS_MOCK = [
  {
    id: 'in_festive_18_34_meta',
    name: 'Festive Sale – Tier 1 Cities',
    campaign_objective: 'CONVERSIONS',
    campaign_id: '23840123456780101',
    status: 'ACTIVE',
    configured_status: 'ACTIVE',
    effective_status: 'ACTIVE',

    budget_type: 'daily',
    daily_budget: 500000, // ₹5,000
    lifetime_budget: null,
    budget_remaining: 420000,
    currency: 'INR',
    start_time: '2025-12-10T06:30:00+05:30',
    end_time: '2025-12-25T23:59:00+05:30',
    pacing_type: ['standard'],

    bid_strategy: 'LOWEST_COST_WITHOUT_CAP',
    bid_amount: null,
    billing_event: 'IMPRESSIONS',
    optimization_goal: 'OFFSITE_CONVERSIONS',
    optimization_sub_event: 'PURCHASE',
    attribution_spec: [
      { event_type: 'CLICK_THROUGH', window_days: 7 },
      { event_type: 'VIEW_THROUGH', window_days: 1 },
    ],

    destination_type: 'WEBSITE',
    promoted_object: {
      pixel_id: '123456789012345',
      custom_event_type: 'PURCHASE',
    },

    targeting: {
      geo_locations: {
        countries: ['IN'],
        cities: [
          { key: '2418583', name: 'Mumbai', radius: 20, distance_unit: 'kilometer' },
          { key: '2415169', name: 'Bengaluru', radius: 20, distance_unit: 'kilometer' },
          { key: '2424068', name: 'Delhi', radius: 25, distance_unit: 'kilometer' },
        ],
      },
      age_min: 18,
      age_max: 34,
      genders: [1, 2],
      device_platforms: ['mobile'],
      publisher_platforms: ['facebook', 'instagram'],
      facebook_positions: ['feed', 'marketplace'],
      instagram_positions: ['stream', 'explore'],
      locales: [6], // English (All)
      interests: [
        { id: '6003349442621', name: 'Online shopping' },
        { id: '6003139266461', name: 'Movies' },
      ],
    },

    account_id: 'act_1234567890',
    created_time: '2025-12-01T10:15:00+05:30',
    updated_time: '2025-12-06T18:45:00+05:30',
  },
  {
    id: 'in_retarget_website_30d',
    name: 'Website Retargeting – 30 Days',
    campaign_objective: 'CONVERSIONS',
    campaign_id: '23840123456780102',
    status: 'PAUSED',
    configured_status: 'PAUSED',
    effective_status: 'PAUSED',

    budget_type: 'daily',
    daily_budget: 300000, // ₹3,000
    lifetime_budget: null,
    budget_remaining: 300000,
    currency: 'INR',
    start_time: '2025-12-05T06:30:00+05:30',
    end_time: null,
    pacing_type: ['standard'],

    bid_strategy: 'LOWEST_COST_WITHOUT_CAP',
    bid_amount: null,
    billing_event: 'IMPRESSIONS',
    optimization_goal: 'OFFSITE_CONVERSIONS',
    optimization_sub_event: 'ADD_TO_CART',
    attribution_spec: [
      { event_type: 'CLICK_THROUGH', window_days: 7 },
    ],

    destination_type: 'WEBSITE',
    promoted_object: {
      pixel_id: '123456789012345',
      custom_event_type: 'ADD_TO_CART',
    },

    targeting: {
      geo_locations: { countries: ['IN'] },
      age_min: 21,
      age_max: 45,
      genders: [0],
      device_platforms: ['mobile', 'desktop'],
      publisher_platforms: ['facebook', 'instagram', 'audience_network'],
      facebook_positions: ['feed', 'right_hand_column'],
      instagram_positions: ['stream'],
      custom_audiences: [
        { id: '6081234567890', name: 'Website Visitors – 30d' },
      ],
    },

    account_id: 'act_1234567890',
    created_time: '2025-12-02T11:00:00+05:30',
    updated_time: '2025-12-06T20:10:00+05:30',
  },
];

// Customization Section - Memoized
const CustomizationSection = memo((
  { customizationPresets = INDIAN_PRESETS_MOCK, onCreatePreset, onEditPreset, onDeletePreset }
) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4 }}
    className="space-y-6"
  >
    {/* Header */}
    <div className="flex items-center justify-between">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Ad Set Presets</h2>
        <p className="text-sm text-gray-500 mt-1">
          Saved Meta ad set configurations for Indian audiences
        </p>
      </div>
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={onCreatePreset}
        className="px-4 py-2.5 bg-blue-600 text-white rounded-lg font-medium shadow-sm hover:bg-blue-700 transition-colors flex items-center gap-2"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Create Preset
      </motion.button>
    </div>

    {/* Presets Grid */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {customizationPresets.map((preset, idx) => {
        const isActive = preset.effective_status === 'ACTIVE' || preset.status === 'ACTIVE';
        const budgetValue =
          (preset.daily_budget || preset.lifetime_budget || 0) / 100;

        return (
          <motion.div
            key={preset.id}
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.05 }}
            className="bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all"
          >
            {/* Preset Header */}
            <div className="p-4 border-b border-gray-100">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">{preset.name}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {preset.campaign_objective || 'CONVERSIONS'} •{' '}
                    {preset.account_id} • Campaign: {preset.campaign_id}
                  </p>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    Created: {preset.created_time} • Updated: {preset.updated_time}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${
                      isActive
                        ? 'bg-green-50 text-green-700 border border-green-200'
                        : 'bg-gray-50 text-gray-600 border border-gray-200'
                    }`}
                  >
                    {preset.effective_status || preset.status || 'DRAFT'}
                  </span>
                  {preset.currency && (
                    <span className="px-2 py-1 text-[11px] font-medium rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                      {preset.currency}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Preset Details */}
            <div className="p-4 space-y-4">
              {/* Budget, Pacing & Schedule */}
              <div className="grid grid-cols-2 gap-3">
                {/* <div>
                  <label className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">
                    Budget
                  </label>
                  <p className="text-sm font-semibold text-gray-900 mt-1">
                    {preset.budget_type === 'lifetime' ? 'Lifetime' : 'Daily'}:{' '}
                    {preset.currency || 'INR'} {budgetValue.toLocaleString('en-IN')}
                  </p>
                  {preset.budget_remaining != null && (
                    <p className="text-[11px] text-gray-500">
                      Remaining: {(preset.budget_remaining / 100).toLocaleString('en-IN')}
                    </p>
                  )}
                </div> */}
                <div>
                  <label className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">
                    Pacing & Schedule
                  </label>
                  <p className="text-sm text-gray-900 mt-1">
                    {preset.pacing_type?.join(', ') || 'standard'}
                  </p>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    {preset.start_time
                      ? `From ${preset.start_time}`
                      : 'Starts immediately'}
                  </p>
                  <p className="text-[11px] text-gray-500">
                    {preset.end_time ? `Until ${preset.end_time}` : 'No end date'}
                  </p>
                </div>
              </div>

              {/* Bidding & Optimization */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">
                    Bid & Billing
                  </label>
                  <p className="text-sm font-semibold text-gray-900 mt-1">
                    {preset.bid_strategy || 'LOWEST_COST_WITHOUT_CAP'}
                  </p>
                  <p className="text-[11px] text-gray-500">
                    Billing event: {preset.billing_event || 'IMPRESSIONS'}
                  </p>
                  {preset.bid_amount != null && (
                    <p className="text-[11px] text-gray-500">
                      Bid: {(preset.bid_amount / 100).toLocaleString('en-IN')}{' '}
                      {preset.currency || 'INR'}
                    </p>
                  )}
                </div>
                <div>
                  <label className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">
                    Optimization & Attribution
                  </label>
                  <p className="text-sm font-semibold text-gray-900 mt-1">
                    {preset.optimization_goal || 'LINK_CLICKS'}
                    {preset.optimization_sub_event
                      ? ` • ${preset.optimization_sub_event}`
                      : ''}
                  </p>
                  {preset.attribution_spec && (
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      Attribution:{' '}
                      {preset.attribution_spec
                        .map(
                          (a) =>
                            `${a.window_days}d ${
                              a.event_type === 'CLICK_THROUGH' ? 'click' : 'view'
                            }`,
                        )
                        .join(' • ')}
                    </p>
                  )}
                </div>
              </div>

              {/* Targeting Summary */}
              <div>
                <label className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">
                  Targeting (India)
                </label>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {preset.targeting?.geo_locations?.countries?.map((country, i) => (
                    <span
                      key={`country-${i}`}
                      className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded-md"
                    >
                      {country}
                    </span>
                  ))}
                  {preset.targeting?.geo_locations?.cities?.map((city, i) => (
                    <span
                      key={`city-${i}`}
                      className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-xs rounded-md"
                    >
                      {city.name} • {city.radius}
                      {city.distance_unit === 'kilometer' ? 'km' : ''}
                    </span>
                  ))}
                  {preset.targeting?.age_min && preset.targeting?.age_max && (
                    <span className="px-2 py-0.5 bg-purple-50 text-purple-700 text-xs rounded-md">
                      Ages {preset.targeting.age_min}-{preset.targeting.age_max}
                    </span>
                  )}
                  {preset.targeting?.genders && (
                    <span className="px-2 py-0.5 bg-pink-50 text-pink-700 text-xs rounded-md">
                      {preset.targeting.genders[0] === 0
                        ? 'All genders'
                        : preset.targeting.genders
                            .map((g) => (g === 1 ? 'Male' : 'Female'))
                            .join(', ')}
                    </span>
                  )}
                  {preset.targeting?.interests?.slice(0, 3).map((interest, i) => (
                    <span
                      key={`interest-${i}`}
                      className="px-2 py-0.5 bg-orange-50 text-orange-700 text-xs rounded-md"
                    >
                      {interest.name}
                    </span>
                  ))}
                  {preset.targeting?.custom_audiences?.map((aud, i) => (
                    <span
                      key={`ca-${i}`}
                      className="px-2 py-0.5 bg-slate-50 text-slate-700 text-xs rounded-md"
                    >
                      CA: {aud.name}
                    </span>
                  ))}
                </div>
              </div>

              {/* Placements */}
              <div>
                <label className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">
                  Placements
                </label>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {preset.targeting?.publisher_platforms?.map((platform, i) => (
                    <span
                      key={`pub-${i}`}
                      className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded-md capitalize"
                    >
                      {platform}
                    </span>
                  ))}
                  {preset.targeting?.facebook_positions?.map((pos, i) => (
                    <span
                      key={`fbpos-${i}`}
                      className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[11px] rounded-md"
                    >
                      FB • {pos}
                    </span>
                  ))}
                  {preset.targeting?.instagram_positions?.map((pos, i) => (
                    <span
                      key={`igpos-${i}`}
                      className="px-2 py-0.5 bg-pink-50 text-pink-700 text-[11px] rounded-md"
                    >
                      IG • {pos}
                    </span>
                  ))}
                </div>
              </div>

              {/* Destination & Pixel */}
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-100">
                <div>
                  <label className="text-[11px] font-medium text-gray-500">
                    Destination & Pixel
                  </label>
                  <p className="text-xs text-gray-800 mt-0.5">
                    {preset.destination_type || 'WEBSITE'}
                  </p>
                  {preset.promoted_object?.pixel_id && (
                    <p className="text-[11px] text-gray-500">
                      Pixel: {preset.promoted_object.pixel_id}
                    </p>
                  )}
                  {preset.promoted_object?.custom_event_type && (
                    <p className="text-[11px] text-gray-500">
                      Event: {preset.promoted_object.custom_event_type}
                    </p>
                  )}
                </div>
                <div>
                  <label className="text-[11px] font-medium text-gray-500">
                    Config Status
                  </label>
                  <p className="text-xs text-gray-800 mt-0.5">
                    {preset.configured_status || preset.status || 'PAUSED'}
                  </p>
                  {preset.effective_status && (
                    <p className="text-[11px] text-gray-500">
                      Effective: {preset.effective_status}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="p-3 bg-gray-50 border-t border-gray-100 flex gap-2">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onEditPreset(preset)}
                className="flex-1 px-3 py-2 bg-white border border-gray-300 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Edit
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onDeletePreset(preset.id)}
                className="px-3 py-2 bg-white border border-red-300 text-red-700 rounded-md text-sm font-medium hover:bg-red-50 transition-colors"
              >
                Delete
              </motion.button>
            </div>
          </motion.div>
        );
      })}
    </div>

    {/* API Fields Reference */}
  </motion.div>
));

CustomizationSection.displayName = 'CustomizationSection';

const MetaAdsManager = () => {
  const [currentSection, setCurrentSection] = useState('create');
  const [selectedAccount, setSelectedAccount] = useState({
    facebook: 'sri@crifter.com',
    instagram: 'sri@crifter.com'
  });
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState('');
  const [creativeType, setCreativeType] = useState('predefined');
  const [showCustomAdsetModal, setShowCustomAdsetModal] = useState(false);
  const [showNewPresetModal, setShowNewPresetModal] = useState(false);
  const [selectedVideos, setSelectedVideos] = useState([]);
  const [adFields, setAdFields] = useState({
    bodyText: '',
    headline: '',
    appUrl: ''
  });

  // Dummy Data - memoized
  const campaigns = useMemo(() => [
    { id: 1, name: 'Winter Sale 2025' },
    { id: 2, name: 'Brand Awareness Q1' },
    { id: 3, name: 'Product Launch Campaign' },
    { id: 4, name: 'New Year Special' }
  ], []);

  const predefinedCreatives = useMemo(() => [
    { id: 1, name: 'Preset 1 - E-commerce Standard' },
    { id: 2, name: 'Preset 2 - App Install' },
    { id: 3, name: 'Preset 3 - Lead Generation' },
    { id: 4, name: 'Preset 4 - Video Views' }
  ], []);

const adHistory = useMemo(() => [
  {
    id: 1,
    launchDate: '2025-12-01',
    account: 'sri@crifter.com',
    campaign: 'Winter Clearance Sale',
    adset: 'Lookalike Audience – Past Purchasers',
    status: 'Active'
  },
  {
    id: 2,
    launchDate: '2025-12-01',
    account: 'sri@crifter.com',
    campaign: 'Mobile App Acquisition Push',
    adset: 'App Install – High Intent Users',
    status: 'Paused'
  },
  {
    id: 3,
    launchDate: '2025-11-25',
    account: 'sri@crifter.com',
    campaign: 'New Product Collection Launch',
    adset: 'Interest Targeting – Fashion Enthusiasts',
    status: 'Completed'
  },
  {
    id: 4,
    launchDate: '2025-11-25',
    account: 'sri@crifter.com',
    campaign: 'Holiday Pre-Order Event',
    adset: 'Retargeting – Website Visitors',
    status: 'Active'
  }
], []);

  const customizationPresets = useMemo(() => [
    { id: 1, name: 'E-commerce Standard', audience: 'Broad 18-65', budget: '$50/day' },
    { id: 2, name: 'App Install', audience: 'Mobile Users 18-35', budget: '$100/day' },
    { id: 3, name: 'Lead Generation', audience: 'B2B Decision Makers', budget: '$75/day' }
  ], []);

  // Optimized handlers - each field gets its own handler
  const handleBodyTextChange = useCallback((e) => {
    setAdFields(prev => ({ ...prev, bodyText: e.target.value }));
  }, []);

  const handleHeadlineChange = useCallback((e) => {
    setAdFields(prev => ({ ...prev, headline: e.target.value }));
  }, []);

  const handleAppUrlChange = useCallback((e) => {
    setAdFields(prev => ({ ...prev, appUrl: e.target.value }));
  }, []);

  const adFieldHandlers = useMemo(() => ({
    bodyText: handleBodyTextChange,
    headline: handleHeadlineChange,
    appUrl: handleAppUrlChange
  }), [handleBodyTextChange, handleHeadlineChange, handleAppUrlChange]);

  const handleVideoUpload = useCallback((e) => {
    const files = Array.from(e.target.files);
    setSelectedVideos(files.map(f => ({ name: f.name, size: f.size })));
  }, []);

  const handleCampaignChange = useCallback((e) => {
    setSelectedCampaign(e.target.value);
  }, []);

  const handleCreativeTypeChange = useCallback((e) => {
    const value = e.target.value;
    setCreativeType(value);
    if (value === 'custom') {
      setShowCustomAdsetModal(true);
    }
  }, []);

  const toggleAccountModal = useCallback(() => {
    setShowAccountModal(prev => !prev);
  }, []);

  const toggleNewPresetModal = useCallback(() => {
    setShowNewPresetModal(prev => !prev);
  }, []);

  const closeCustomAdsetModal = useCallback(() => {
    setShowCustomAdsetModal(false);
    setCreativeType('predefined');
  }, []);

  // Navigation items
  const navItems = useMemo(() => [
    {
      id: 'create',
      title: 'Create Ad',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
        </svg>
      )
    },
    {
      id: 'history',
      title: 'Ad History',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    {
      id: 'customization',
      title: 'Customization',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      )
    }
  ], []);

  // Render Section Content
  const renderContent = () => {
    switch(currentSection) {
      case 'create':
        return (
          <CreateAdSection
            selectedAccount={selectedAccount}
            selectedCampaign={selectedCampaign}
            setSelectedCampaign={handleCampaignChange}
            campaigns={campaigns}
            creativeType={creativeType}
            setCreativeType={handleCreativeTypeChange}
            predefinedCreatives={predefinedCreatives}
            setShowCustomAdsetModal={setShowCustomAdsetModal}
            selectedVideos={selectedVideos}
            handleVideoUpload={handleVideoUpload}
            adFields={adFields}
            onAdFieldChange={adFieldHandlers}
            setShowAccountModal={toggleAccountModal}
          />
        );
      case 'history':
        return <AdHistorySection adHistory={adHistory} />;
      case 'customization':
        return <CustomizationSection customizationPresets={customizationPresets} onCreatePreset={toggleNewPresetModal} />;
      default:
        return (
          <CreateAdSection
            selectedAccount={selectedAccount}
            selectedCampaign={selectedCampaign}
            setSelectedCampaign={handleCampaignChange}
            campaigns={campaigns}
            creativeType={creativeType}
            setCreativeType={handleCreativeTypeChange}
            predefinedCreatives={predefinedCreatives}
            setShowCustomAdsetModal={setShowCustomAdsetModal}
            selectedVideos={selectedVideos}
            handleVideoUpload={handleVideoUpload}
            adFields={adFields}
            onAdFieldChange={adFieldHandlers}
            setShowAccountModal={toggleAccountModal}
          />
        );
    }
  };

  return (
    <div className=" max-h-screen min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex">
      {/* Enhanced Mini Sidebar */}
      <motion.div
        initial={{ x: -100 }}
        animate={{ x: 0 }}
        className="hidden md:flex w-20 lg:w-24 bg-gradient-to-b from-white via-white to-blue-50/50 shadow-2xl border-r border-gray-200/80 flex-col items-center py-6 lg:py-8 space-y-6 lg:space-y-8 backdrop-blur-sm"
      >
        <motion.div 
          className="w-12 h-12 lg:w-14 lg:h-14 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg"
          whileHover={{ rotate: 360, scale: 1.1 }}
          transition={{ duration: 0.6 }}
        >
          <span className="text-white font-bold text-xl lg:text-2xl">M</span>
        </motion.div>

        <div className="flex flex-col space-y-3 lg:space-y-4 pt-4 max-h-80">
          {navItems.map((item) => (
            <motion.button
              key={item.id}
              whileHover={{ scale: 1.15, x: 5 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setCurrentSection(item.id)}
              className={`relative w-12 h-12 lg:w-14 lg:h-14 rounded-xl lg:rounded-2xl flex items-center justify-center transition-all duration-300 ${
                currentSection === item.id
                  ? 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-xl shadow-blue-500/30'
                  : 'bg-gray-100 text-gray-600 hover:bg-gradient-to-br hover:from-gray-200 hover:to-gray-100 hover:shadow-md'
              }`}
              title={item.title}
            >
              {item.icon}
              {currentSection === item.id && (
                <motion.div
                  layoutId="activeIndicator"
                  className="absolute -right-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-blue-600 to-indigo-600 rounded-l-full"
                />
              )}
            </motion.button>
          ))}
        </div>

        <motion.div 
          className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl bg-gray-100 flex items-center justify-center cursor-pointer hover:bg-gradient-to-br hover:from-gray-200 hover:to-gray-100 transition-all"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          <svg className="w-5 h-5 lg:w-6 lg:h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </motion.div>
      </motion.div>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-2xl z-50 safe-area-inset-bottom">
        <div className="flex items-center justify-around px-2 py-3">
          {navItems.map((item) => (
            <motion.button
              key={item.id}
              whileTap={{ scale: 0.95 }}
              onClick={() => setCurrentSection(item.id)}
              className={`flex flex-col items-center justify-center space-y-1 px-4 py-2 rounded-xl transition-all ${
                currentSection === item.id
                  ? 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg'
                  : 'text-gray-600'
              }`}
            >
              <div className="w-6 h-6">{item.icon}</div>
              <span className="text-[10px] font-medium">{item.title.split(' ')[0]}</span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto pb-20 md:pb-8">
        <div className="max-w-7xl mx-auto">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-2xl md:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent mb-6 md:mb-8"
          >
            Meta Ads Manager
          </motion.h1>
          {renderContent()}
        </div>
      </div>

      {/* Account Change Modal */}
      <AnimatePresence>
        {showAccountModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={toggleAccountModal}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl md:rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl"
            >
              <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-4 md:mb-6">Change Accounts</h2>
              <div className="space-y-3 md:space-y-4">
                <div>
                  <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1.5 md:mb-2">Facebook Account</label>
                  <select className="w-full px-3 md:px-4 py-2.5 md:py-3 text-sm md:text-base border border-gray-300 rounded-lg md:rounded-xl focus:ring-2 focus:ring-blue-500 outline-none">
                    <option>FB Account - @brandname</option>
                    <option>FB Account - @mybusiness</option>
                    <option>FB Account - @company</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1.5 md:mb-2">Instagram Account</label>
                  <select className="w-full px-3 md:px-4 py-2.5 md:py-3 text-sm md:text-base border border-gray-300 rounded-lg md:rounded-xl focus:ring-2 focus:ring-blue-500 outline-none">
                    <option>IG Account - @brandname</option>
                    <option>IG Account - @mybusiness</option>
                    <option>IG Account - @company</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-2 md:gap-3 mt-4 md:mt-6">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={toggleAccountModal}
                  className="flex-1 px-4 md:px-6 py-2.5 md:py-3 bg-gray-200 text-gray-800 rounded-lg md:rounded-xl font-medium hover:bg-gray-300 transition-colors text-sm md:text-base"
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={toggleAccountModal}
                  className="flex-1 px-4 md:px-6 py-2.5 md:py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg md:rounded-xl font-medium hover:shadow-lg transition-all text-sm md:text-base"
                >
                  Save Changes
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Custom Adset Modal */}
      <AnimatePresence>
        {showCustomAdsetModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowCustomAdsetModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl md:rounded-3xl p-6 md:p-8 max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-4 md:mb-6">Custom Adset Configuration</h2>
              <div className="space-y-4 md:space-y-6">
                <div>
                  <h3 className="text-base md:text-lg font-semibold text-gray-800 mb-2 md:mb-3">Audience Targeting</h3>
                  <div className="space-y-2">
                    {['Age: 18-24', 'Age: 25-34', 'Age: 35-44', 'Age: 45-54', 'Age: 55+'].map((age) => (
                      <label key={age} className="flex items-center space-x-3 cursor-pointer group">
                        <input type="checkbox" className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 cursor-pointer" />
                        <span className="text-sm md:text-base text-gray-700 group-hover:text-gray-900">{age}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="text-base md:text-lg font-semibold text-gray-800 mb-2 md:mb-3">Gender</h3>
                  <div className="space-y-2">
                    {['All', 'Male', 'Female', 'Non-binary'].map((gender) => (
                      <label key={gender} className="flex items-center space-x-3 cursor-pointer group">
                        <input type="checkbox" className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 cursor-pointer" />
                        <span className="text-sm md:text-base text-gray-700 group-hover:text-gray-900">{gender}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="text-base md:text-lg font-semibold text-gray-800 mb-2 md:mb-3">Interests</h3>
                  <div className="space-y-2">
                    {['Technology', 'Sports', 'Fashion', 'Food & Dining', 'Travel', 'Entertainment'].map((interest) => (
                      <label key={interest} className="flex items-center space-x-3 cursor-pointer group">
                        <input type="checkbox" className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 cursor-pointer" />
                        <span className="text-sm md:text-base text-gray-700 group-hover:text-gray-900">{interest}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="text-base md:text-lg font-semibold text-gray-800 mb-2 md:mb-3">Budget & Schedule</h3>
                  <div className="space-y-3 md:space-y-4">
                    <div>
                      <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1.5 md:mb-2">Daily Budget</label>
                      <input type="number" placeholder="$50" className="w-full px-3 md:px-4 py-2.5 md:py-3 text-sm md:text-base border border-gray-300 rounded-lg md:rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1.5 md:mb-2">Campaign Duration</label>
                      <select className="w-full px-3 md:px-4 py-2.5 md:py-3 text-sm md:text-base border border-gray-300 rounded-lg md:rounded-xl focus:ring-2 focus:ring-blue-500 outline-none">
                        <option>7 Days</option>
                        <option>14 Days</option>
                        <option>30 Days</option>
                        <option>Custom</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex gap-2 md:gap-3 mt-4 md:mt-6">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowCustomAdsetModal(false)}
                  className="flex-1 px-4 md:px-6 py-2.5 md:py-3 bg-gray-200 text-gray-800 rounded-lg md:rounded-xl font-medium hover:bg-gray-300 transition-colors text-sm md:text-base"
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={closeCustomAdsetModal}
                  className="flex-1 px-4 md:px-6 py-2.5 md:py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg md:rounded-xl font-medium hover:shadow-lg transition-all text-sm md:text-base"
                >
                  Apply Configuration
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* New Preset Modal */}
<AnimatePresence>
  {showNewPresetModal && (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={toggleNewPresetModal}
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6 pb-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Create Ad Set</h2>
            <p className="text-sm text-gray-500 mt-1">Configure your Meta advertising campaign</p>
          </div>
          <button
            onClick={toggleNewPresetModal}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-8">
          {/* Basic Information */}
          <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ad Set Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  placeholder="e.g., Summer Campaign 2025 - US"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  maxLength={400}
                />
                <p className="text-xs text-gray-500 mt-1">Max 400 characters</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Campaign <span className="text-red-500">*</span>
                </label>
                <select
                  name="campaign_id"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-white"
                >
                  <option value="">Select campaign</option>
                  {/* Populate with campaigns */}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status <span className="text-red-500">*</span>
                </label>
                <select
                  name="status"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-white"
                  defaultValue="PAUSED"
                >
                  <option value="ACTIVE">Active</option>
                  <option value="PAUSED">Paused</option>
                </select>
              </div>
            </div>
          </section>

          {/* Budget & Schedule */}
          <section className="pt-6 border-t border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Budget & Schedule</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Budget Type <span className="text-red-500">*</span>
                </label>
                <select
                  name="budget_type"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-white"
                >
                  <option value="daily">Daily Budget</option>
                  <option value="lifetime">Lifetime Budget</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Budget Amount <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                  <input
                    type="number"
                    name="daily_budget"
                    placeholder="100.00"
                    min="0"
                    step="0.01"
                    className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">Amount in account currency (cents for USD: 10000 = $100)</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Time
                </label>
                <input
                  type="datetime-local"
                  name="start_time"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Time
                </label>
                <input
                  type="datetime-local"
                  name="end_time"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                />
              </div>
            </div>
          </section>

          {/* Optimization & Delivery */}
          <section className="pt-6 border-t border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Optimization & Delivery</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Optimization Goal <span className="text-red-500">*</span>
                </label>
                <select
                  name="optimization_goal"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-white"
                >
                  <option value="REACH">Reach</option>
                  <option value="IMPRESSIONS">Impressions</option>
                  <option value="LINK_CLICKS">Link Clicks</option>
                  <option value="OFFSITE_CONVERSIONS">Conversions</option>
                  <option value="LANDING_PAGE_VIEWS">Landing Page Views</option>
                  <option value="POST_ENGAGEMENT">Post Engagement</option>
                  <option value="PAGE_LIKES">Page Likes</option>
                  <option value="APP_INSTALLS">App Installs</option>
                  <option value="VIDEO_VIEWS">Video Views (ThruPlay)</option>
                  <option value="LEAD_GENERATION">Lead Generation</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Billing Event <span className="text-red-500">*</span>
                </label>
                <select
                  name="billing_event"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-white"
                >
                  <option value="IMPRESSIONS">Impressions</option>
                  <option value="LINK_CLICKS">Link Clicks</option>
                  <option value="THRUPLAY">ThruPlay (Video)</option>
                  <option value="POST_ENGAGEMENT">Post Engagement</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bid Strategy
                </label>
                <select
                  name="bid_strategy"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-white"
                >
                  <option value="LOWEST_COST_WITHOUT_CAP">Lowest Cost</option>
                  <option value="LOWEST_COST_WITH_BID_CAP">Bid Cap</option>
                  <option value="COST_CAP">Cost Cap</option>
                  <option value="LOWEST_COST_WITH_MIN_ROAS">Target ROAS</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bid Amount (Optional)
                </label>
                <input
                  type="number"
                  name="bid_amount"
                  placeholder="e.g., 300 (cents)"
                  min="0"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                />
              </div>
            </div>
          </section>

          {/* Targeting */}
          <section className="pt-6 border-t border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Audience Targeting</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Countries <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="geo_locations_countries"
                  placeholder="e.g., US, CA, GB (comma-separated country codes)"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Minimum Age
                </label>
                <input
                  type="number"
                  name="age_min"
                  placeholder="18"
                  min="13"
                  max="65"
                  defaultValue="18"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Maximum Age
                </label>
                <input
                  type="number"
                  name="age_max"
                  placeholder="65"
                  min="13"
                  max="65"
                  defaultValue="65"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Genders
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center">
                    <input type="checkbox" name="genders" value="1" className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
                    <span className="ml-2 text-sm text-gray-700">Male (1)</span>
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" name="genders" value="2" className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
                    <span className="ml-2 text-sm text-gray-700">Female (2)</span>
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" name="genders" value="0" className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
                    <span className="ml-2 text-sm text-gray-700">All</span>
                  </label>
                </div>
              </div>
            </div>
          </section>

          {/* Placements */}
          <section className="pt-6 border-t border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Placements</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Publisher Platforms <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="flex items-center p-3 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input type="checkbox" name="publisher_platforms" value="facebook" defaultChecked className="w-4 h-4 text-blue-600" />
                    <span className="ml-3 text-sm font-medium text-gray-700">Facebook</span>
                  </label>
                  <label className="flex items-center p-3 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input type="checkbox" name="publisher_platforms" value="instagram" className="w-4 h-4 text-blue-600" />
                    <span className="ml-3 text-sm font-medium text-gray-700">Instagram</span>
                  </label>
                  <label className="flex items-center p-3 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input type="checkbox" name="publisher_platforms" value="audience_network" className="w-4 h-4 text-blue-600" />
                    <span className="ml-3 text-sm font-medium text-gray-700">Audience Network</span>
                  </label>
                  <label className="flex items-center p-3 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input type="checkbox" name="publisher_platforms" value="messenger" className="w-4 h-4 text-blue-600" />
                    <span className="ml-3 text-sm font-medium text-gray-700">Messenger</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Device Platforms
                </label>
                <div className="flex gap-3">
                  <label className="flex items-center p-3 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input type="checkbox" name="device_platforms" value="mobile" defaultChecked className="w-4 h-4 text-blue-600" />
                    <span className="ml-3 text-sm font-medium text-gray-700">Mobile</span>
                  </label>
                  <label className="flex items-center p-3 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input type="checkbox" name="device_platforms" value="desktop" className="w-4 h-4 text-blue-600" />
                    <span className="ml-3 text-sm font-medium text-gray-700">Desktop</span>
                  </label>
                </div>
              </div>
            </div>
          </section>

          {/* Promoted Object */}
          <section className="pt-6 border-t border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Promoted Object</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Destination Type
                </label>
                <select
                  name="destination_type"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-white"
                >
                  <option value="WEBSITE">Website</option>
                  <option value="APP">App</option>
                  <option value="MESSENGER">Messenger</option>
                  <option value="WHATSAPP">WhatsApp</option>
                  <option value="INSTAGRAM_DIRECT">Instagram Direct</option>
                  <option value="FACEBOOK">Facebook</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Facebook Page ID
                </label>
                <input
                  type="text"
                  name="promoted_object_page_id"
                  placeholder="Enter Facebook Page ID"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pixel ID (for conversions)
                </label>
                <input
                  type="text"
                  name="promoted_object_pixel_id"
                  placeholder="Enter Pixel ID"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Custom Event Type
                </label>
                <input
                  type="text"
                  name="promoted_object_custom_event_type"
                  placeholder="e.g., PURCHASE, LEAD"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                />
              </div>
            </div>
          </section>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mt-8 pt-6 border-t border-gray-200">
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={toggleNewPresetModal}
            className="flex-1 px-6 py-3.5 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
          >
            Cancel
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            className="flex-1 px-6 py-3.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
          >
            Create Ad Set
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  )}
</AnimatePresence>
    </div>
  );
};

export default MetaAdsManager;
