'use client';

import { useEffect, useRef, useState } from 'react';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiSearch,
  FiChevronDown,
  FiPlus,
  FiFilter,
  FiRefreshCw,
} from 'react-icons/fi';
import AddCampaignModal from './CampaignsAdd';
import EditCampaignRow from './CampiagnEditRow';

// ---------------- Fetch Campaigns ----------------
const fetchCampaigns = async ({ pageParam = null, queryKey }) => {
  const [_key, { search, sortBy, sortOrder, companyId }] = queryKey;

  if (!companyId) return { data: [], nextCursor: null };

  const params = new URLSearchParams({
    companyId,
    take: 50,
    sortBy,
    sortOrder,
  });
  if (pageParam) params.append('cursor', pageParam);
  if (search) params.append('search', search);

  const res = await fetch(`/api/admin/campaigns?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch campaigns');
  return res.json();
};

// ---------------- Main Component ----------------
export default function CampaignTable({ companyId }) {
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('updatedAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const queryClient = useQueryClient();

  // 🔁 Infinite Query
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
    isFetching,
    status,
    error,
  } = useInfiniteQuery({
    queryKey: ['campaigns', { search, sortBy, sortOrder, companyId }],
    queryFn: fetchCampaigns,
    enabled: !!companyId,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });

  const campaigns = data?.pages.flatMap((p) => p.data) ?? [];

  // ♻️ Refresh list after add or edit
  const handleCampaignUpdated = () => {
    queryClient.invalidateQueries(['campaigns']);
  };

  // ⏳ Infinite Scroll
  const loadMoreRef = useRef();
  useEffect(() => {
    if (!hasNextPage) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) fetchNextPage();
      },
      { threshold: 1 }
    );
    if (loadMoreRef.current) observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [hasNextPage, fetchNextPage]);

  // ⏱ Debounce search
  useEffect(() => {
    const delay = setTimeout(() => refetch(), 400);
    return () => clearTimeout(delay);
  }, [search, sortBy, sortOrder]);

  // 🌀 Loading / Error states
  if (status === 'loading') {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <div className="relative">
          <div className="h-16 w-16 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-8 w-8 bg-blue-50 rounded-full"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-red-50 border border-red-200 rounded-xl p-8 text-center"
      >
        <div className="inline-flex items-center justify-center w-12 h-12 bg-red-100 rounded-full mb-4">
          <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <p className="text-red-900 font-semibold mb-2">Failed to load campaigns</p>
        <p className="text-red-700 text-sm mb-4">Please check your connection and try again</p>
        <button
          onClick={() => refetch()}
          className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition font-medium"
        >
          <FiRefreshCw size={16} /> Retry
        </button>
      </motion.div>
    );
  }

  // ---------------- UI ----------------
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="bg-white rounded-xl shadow-sm border border-gray-100"
    >
      {/* Header Section */}
      <div className="border-b border-gray-100 bg-gradient-to-br from-blue-50 to-white px-6 py-5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Title */}
          <div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">Campaigns</h3>
            <p className="text-sm text-gray-600">
              Manage and track all marketing campaigns
              {campaigns.length > 0 && (
                <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {campaigns.length} {campaigns.length === 1 ? 'campaign' : 'campaigns'}
                </span>
              )}
            </p>
          </div>

          {/* Action Button */}
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg transition-all duration-200 font-semibold shadow-sm hover:shadow-md transform hover:-translate-y-0.5"
          >
            <FiPlus size={18} strokeWidth={2.5} />
            <span>New Campaign</span>
          </button>
        </div>

        {/* Controls Row */}
        <div className="flex flex-col sm:flex-row gap-3 mt-4">
          {/* Search Bar */}
          <div className="relative flex-1">
            <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search campaigns, admins, teams..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow placeholder:text-gray-400"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            )}
          </div>

          {/* Sort Dropdown */}
          <button
            className="inline-flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all whitespace-nowrap"
            onClick={() => setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))}
          >
            <FiFilter size={16} />
            <span>
              {sortBy === 'updatedAt' ? 'Last Modified' : sortBy === 'createdAt' ? 'Date Created' : 'Name'}
            </span>
            <FiChevronDown
              size={16}
              className={`text-gray-500 transition-transform duration-200 ${
                sortOrder === 'asc' ? 'rotate-180' : ''
              }`}
            />
          </button>

          {/* Refresh Button */}
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="inline-flex items-center justify-center gap-2 bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
          >
            <FiRefreshCw size={16} className={isFetching ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Table Section */}
      <div className="overflow-x-auto">
        {campaigns.length === 0 && !isFetching ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-16 px-4"
          >
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4">
              <FiSearch className="text-blue-600" size={28} />
            </div>
            <h4 className="text-lg font-semibold text-gray-900 mb-2">No campaigns found</h4>
            <p className="text-sm text-gray-600 mb-6 text-center max-w-sm">
              {search
                ? `No results for "${search}". Try adjusting your search.`
                : 'Get started by creating your first campaign.'}
            </p>
            {!search && (
              <button
                onClick={() => setIsModalOpen(true)}
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg transition font-semibold"
              >
                <FiPlus size={18} /> Create Campaign
              </button>
            )}
          </motion.div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Campaign Name
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Admin
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Team
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Last Modified
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              <AnimatePresence>
                {campaigns.map((camp, index) => (
                  <EditCampaignRow
                    key={camp.id}
                    campaign={camp}
                    onUpdated={handleCampaignUpdated}
                    index={index}
                    companyId={companyId}
                  />
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        )}
      </div>

      {/* Infinite Scroll Loader */}
      {campaigns.length > 0 && (
        <div
          ref={loadMoreRef}
          className="flex justify-center items-center py-6 border-t border-gray-100 bg-gray-50"
        >
          {isFetchingNextPage ? (
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <div className="h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="font-medium">Loading more campaigns...</span>
            </div>
          ) : hasNextPage ? (
            <p className="text-sm text-gray-500">Scroll for more</p>
          ) : (
            <p className="text-sm text-gray-500 font-medium">
              All campaigns loaded • {campaigns.length} total
            </p>
          )}
        </div>
      )}

      {/* Add Campaign Modal */}
      <AddCampaignModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleCampaignUpdated}
        companyId={companyId}

      />
    </motion.div>
  );
}
