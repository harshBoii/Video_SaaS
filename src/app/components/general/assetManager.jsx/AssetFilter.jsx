// components/asset-library/AssetFilters.jsx
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export default function AssetFilters({ filters, onChange, userRole, companyId, userId }) {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCampaigns();
  }, [companyId]);

  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      // ✅ Your API returns campaigns in data.campaigns format
      const response = await fetch('/api/campaigns', {
        credentials: 'include'
      });
      
      const result = await response.json();
      
      if (result.success && result.data?.campaigns) {
        setCampaigns(result.data.campaigns);
      } else {
        console.error('Failed to fetch campaigns');
        setCampaigns([]);
      }
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      setCampaigns([]);
    } finally {
      setLoading(false);
    }
  };

  const FilterSection = ({ title, children }) => (
    <div className="mb-6">
      <h3 className="font-semibold text-slate-900 mb-3 text-sm uppercase tracking-wide">{title}</h3>
      {children}
    </div>
  );

  const FilterOption = ({ label, value, currentValue, onChange }) => (
    <label className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors group">
      <input
        type="radio"
        checked={currentValue === value}
        onChange={() => onChange(value)}
        className="w-4 h-4 text-blue-600 focus:ring-2 focus:ring-blue-500"
      />
      <span className="text-slate-700 group-hover:text-slate-900 transition-colors">{label}</span>
    </label>
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-white rounded-xl shadow-md p-6 sticky top-6"
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-slate-900">Filters</h2>
        <button
          onClick={() => {
            onChange('assetType', 'all');
            onChange('campaignId', 'all');
            onChange('status', 'all');
            onChange('dateRange', 'all');
          }}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          Reset
        </button>
      </div>

      {/* Asset Type */}
      <FilterSection title="Asset Type">
        <div className="space-y-1">
          <FilterOption
            label="All Assets"
            value="all"
            currentValue={filters.assetType}
            onChange={(val) => onChange('assetType', val)}
          />
          <FilterOption
            label="Videos"
            value="VIDEO"
            currentValue={filters.assetType}
            onChange={(val) => onChange('assetType', val)}
          />
          <FilterOption
            label="Documents"
            value="DOCUMENT"
            currentValue={filters.assetType}
            onChange={(val) => onChange('assetType', val)}
          />
        </div>
      </FilterSection>

      {/* Campaign */}
      <FilterSection title="Campaign">
        <div className="space-y-1 max-h-64 overflow-y-auto">
          <FilterOption
            label="All Campaigns"
            value="all"
            currentValue={filters.campaignId}
            onChange={(val) => onChange('campaignId', val)}
          />
          <FilterOption
            label="Company Assets"
            value="none"
            currentValue={filters.campaignId}
            onChange={(val) => onChange('campaignId', val)}
          />
          
          {loading ? (
            <div className="p-2 text-sm text-slate-500">Loading campaigns...</div>
          ) : campaigns.length === 0 ? (
            <div className="p-2 text-sm text-slate-500">No campaigns found</div>
          ) : (
            campaigns.map((campaign) => (
              <FilterOption
                key={campaign.id}
                label={campaign.name}
                value={campaign.id}
                currentValue={filters.campaignId}
                onChange={(val) => onChange('campaignId', val)}
              />
            ))
          )}
        </div>
      </FilterSection>

      {/* Status */}
      <FilterSection title="Status">
        <div className="space-y-1">
          <FilterOption
            label="All Status"
            value="all"
            currentValue={filters.status}
            onChange={(val) => onChange('status', val)}
          />
          <FilterOption
            label="Ready"
            value="ready"
            currentValue={filters.status}
            onChange={(val) => onChange('status', val)}
          />
          <FilterOption
            label="Processing"
            value="processing"
            currentValue={filters.status}
            onChange={(val) => onChange('status', val)}
          />
          <FilterOption
            label="Uploading"
            value="uploading"
            currentValue={filters.status}
            onChange={(val) => onChange('status', val)}
          />
        </div>
      </FilterSection>

      {/* Date Range */}
      <FilterSection title="Date Range">
        <div className="space-y-1">
          <FilterOption
            label="All Time"
            value="all"
            currentValue={filters.dateRange}
            onChange={(val) => onChange('dateRange', val)}
          />
          <FilterOption
            label="Today"
            value="today"
            currentValue={filters.dateRange}
            onChange={(val) => onChange('dateRange', val)}
          />
          <FilterOption
            label="Last 7 Days"
            value="week"
            currentValue={filters.dateRange}
            onChange={(val) => onChange('dateRange', val)}
          />
          <FilterOption
            label="Last 30 Days"
            value="month"
            currentValue={filters.dateRange}
            onChange={(val) => onChange('dateRange', val)}
          />
          <FilterOption
            label="Last 90 Days"
            value="quarter"
            currentValue={filters.dateRange}
            onChange={(val) => onChange('dateRange', val)}
          />
        </div>
      </FilterSection>
    </motion.div>
  );
}
