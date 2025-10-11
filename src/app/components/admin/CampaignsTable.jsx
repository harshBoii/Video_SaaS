'use client';

import { useEffect, useRef, useState } from 'react';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  FiSearch,
  FiChevronDown,
  FiPlus,
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
        <div className="h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8 text-red-600">
        Failed to load campaigns. Please refresh.
      </div>
    );
  }

  // ---------------- UI ----------------
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h3 className="text-2xl font-bold text-gray-800">Campaigns</h3>

        <div className="flex flex-wrap gap-3 items-center">
          {/* Add Button */}
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition font-semibold shadow-sm"
          >
            <FiPlus size={18} /> Add Campaign
          </button>

          {/* Sort Toggle */}
          <button
            className="flex items-center gap-2 border border-gray-300 rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
            onClick={() =>
              setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))
            }
          >
            Sort by:{' '}
            <span className="capitalize">
              {sortBy === 'updatedAt' ? 'Date Modified' : sortBy}
            </span>
            <FiChevronDown
              className={`text-gray-500 transition-transform ${
                sortOrder === 'asc' ? 'rotate-180' : ''
              }`}
            />
          </button>

          {/* Search */}
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or admin..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2 w-72 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 transition"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-gray-100">
        {campaigns.length === 0 && !isFetching ? (
          <p className="text-center p-8 text-gray-500">No campaigns found.</p>
        ) : (
          <table className="w-full text-sm text-left text-gray-600">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50 sticky top-0">
              <tr>
                <th className="px-6 py-3">Name</th>
                <th className="px-6 py-3">Admin</th>
                <th className="px-6 py-3">Team</th>
                <th className="px-6 py-3">Budget</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map((camp) => (
                <EditCampaignRow
                  key={camp.id}
                  campaign={camp}
                  onUpdated={handleCampaignUpdated}
                />
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Infinite Scroll Loader */}
      <div
        ref={loadMoreRef}
        className="flex justify-center py-4 text-sm text-gray-500"
      >
        {isFetchingNextPage ? (
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <span>Loading more...</span>
          </div>
        ) : hasNextPage ? (
          'Scroll to load more'
        ) : (
          'No more campaigns'
        )}
      </div>

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
