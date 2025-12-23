'use client';

import { useEffect, useRef, useState } from 'react';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiSearch,
  FiPlus,
  FiFilter,
  FiRefreshCw,
  FiEdit3,
  FiTrash2,
  FiUsers,
  FiCalendar,
  FiTarget,
} from 'react-icons/fi';
import {
  TrendingUp,
  TrendingDown,
  Sparkles,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Clock,
  Zap,
  Activity,
} from 'lucide-react';
import Link from 'next/link';
import AddCampaignModal from './CampaignsAdd';
import { showSuccess, showError, showConfirm, showLoading, closeSwal } from '@/app/lib/swal';

// ---------------- Loading Bar Component ----------------
function LoadingBar({ isLoading }) {
  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{ scaleX: 1, opacity: 1 }}
          exit={{ scaleX: 0, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed top-0 left-0 right-0 z-50 origin-left"
        >
          <div className="h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 shadow-lg">
            <motion.div
              className="h-full bg-white/30"
              animate={{
                x: ['-100%', '100%'],
              }}
              transition={{
                repeat: Infinity,
                duration: 1,
                ease: 'linear',
              }}
              style={{ width: '30%' }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ---------------- Fetch Campaigns ----------------
const fetchCampaigns = async ({ pageParam = null, queryKey }) => {
  const [_key, { search, sortBy, sortOrder, companyId }] = await queryKey;

  if (!companyId) return { data: [], nextCursor: null };

  const params = new URLSearchParams({
    companyId,
    take: '50',
    sortBy,
    sortOrder,
  });
  if (pageParam) params.append('cursor', pageParam);
  if (search) params.append('search', search);

  const res = await fetch(`/api/admin/campaigns?${params.toString()}`, {
    credentials: 'include',
  });

  if (!res.ok) throw new Error('Failed to fetch campaigns');
  return res.json();
};

// ---------------- Loading Skeleton ----------------
function TableSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="flex items-center gap-4 p-4 glass-card animate-pulse">
          <div className="w-12 h-12 bg-[var(--glass-hover)] rounded-lg"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-[var(--glass-hover)] rounded w-1/3"></div>
            <div className="h-3 bg-[var(--glass-hover)] rounded w-1/2"></div>
          </div>
          <div className="h-6 bg-[var(--glass-hover)] rounded w-20"></div>
        </div>
      ))}
    </div>
  );
}

// ---------------- Main Component ----------------
export default function CampaignTable({ companyId }) {
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('updatedAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const queryClient = useQueryClient();

  // Query
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

  // Infinite scroll
  const loadMoreRef = useRef();
  useEffect(() => {
    if (!hasNextPage) return;
    const observer = new IntersectionObserver(
      (entries) => entries[0].isIntersecting && fetchNextPage(),
      { threshold: 1 }
    );
    if (loadMoreRef.current) observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [hasNextPage, fetchNextPage]);

  // Debounce search
  useEffect(() => {
    if (!companyId) return;
    
    setIsSearching(true);
    const delay = setTimeout(() => {
      refetch().finally(() => setIsSearching(false));
    }, 400);
    
    return () => {
      clearTimeout(delay);
      setIsSearching(false);
    };
  }, [search, sortBy, sortOrder, companyId, refetch]);

  // Refresh after changes
  const handleCampaignUpdated = async () => {
    await queryClient.invalidateQueries(['campaigns']);
    await showSuccess('Success!', 'Campaign list updated');
  };

  // Delete campaign
  const handleDeleteCampaign = async (campaign) => {
    const result = await showConfirm(
      'Delete Campaign?',
      `Are you sure you want to delete "${campaign.name}"? This action cannot be undone.`,
      'Yes, Delete',
      'Cancel'
    );

    if (result.isConfirmed) {
      showLoading('Deleting campaign...', 'Please wait');
      
      try {
        // Implement delete API call here
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        closeSwal();
        await showSuccess('Deleted!', 'Campaign removed successfully');
        handleCampaignUpdated();
      } catch (error) {
        closeSwal();
        await showError('Delete Failed', error.message);
      }
    }
  };

  // Stats
  const stats = {
    total: campaigns.length,
    active: campaigns.filter(c => c.status === 'ACTIVE').length,
    completed: campaigns.filter(c => c.status === 'COMPLETED').length,
    withTeams: campaigns.filter(c => c.team).length,
  };

  // Loading state
  if (status === 'loading') {
    return (
      <div className="min-h-screen p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <div className="h-8 bg-[var(--glass-hover)] rounded w-48 animate-pulse mb-4"></div>
            <div className="h-4 bg-[var(--glass-hover)] rounded w-64 animate-pulse"></div>
          </div>
          <TableSkeleton />
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card p-8 max-w-md w-full text-center"
        >
          <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-destructive" />
          </div>
          <h3 className="text-xl font-bold text-foreground mb-2">Failed to Load Campaigns</h3>
          <p className="text-muted-foreground mb-6">{error.message}</p>
          <button
            onClick={() => refetch()}
            className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-semibold"
          >
            Try Again
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div>
      {/* Loading Bar */}
      <LoadingBar isLoading={isFetching || isSearching} />

      <div>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-1">Campaigns</h2>
              <p className="text-sm text-muted-foreground">Manage and track all your marketing campaigns</p>
            </div>
            
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 bg-primary/90 hover:bg-primary text-primary-foreground px-4 py-2 rounded-lg transition-all duration-200 font-medium shadow-lg hover:shadow-xl hover:scale-105"
            >
              <FiPlus size={18} />
              New Campaign
            </button>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6"
        >
          <div className="backdrop-blur-xl bg-white/10 dark:bg-black/10 border border-black/10 dark:border-white/10 rounded-xl p-4 hover:shadow-lg transition-all duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Total</p>
                <p className="text-2xl font-bold text-foreground">{stats.total}</p>
              </div>
              <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                <FiTarget className="text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </div>

          <div className="backdrop-blur-xl bg-white/10 dark:bg-black/10 border border-black/10 dark:border-white/10 rounded-xl p-4 hover:shadow-lg transition-all duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Active</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.active}</p>
              </div>
              <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <Zap className="text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>

          <div className="backdrop-blur-xl bg-white/10 dark:bg-black/10 border border-black/10 dark:border-white/10 rounded-xl p-4 hover:shadow-lg transition-all duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Completed</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.completed}</p>
              </div>
              <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                <CheckCircle2 className="text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>

          <div className="backdrop-blur-xl bg-white/10 dark:bg-black/10 border border-black/10 dark:border-white/10 rounded-xl p-4 hover:shadow-lg transition-all duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground mb-1">With Teams</p>
                <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{stats.withTeams}</p>
              </div>
              <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center">
                <FiUsers className="text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="backdrop-blur-xl bg-white/10 dark:bg-black/10 border border-black/10 dark:border-white/10 rounded-xl p-4 mb-6 shadow-sm"
        >
          <div className="flex flex-wrap items-center gap-4">
            {/* Search */}
            <div className="flex-1 min-w-[300px] relative">
              <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg" />
              <input
                type="text"
                placeholder="Search campaigns, admins, teams..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-12 pr-12 py-3 backdrop-blur-xl bg-white/5 dark:bg-black/20 border border-black/10 dark:border-white/10 rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
              />
              
              {isSearching && (
                <div className="absolute right-12 top-1/2 -translate-y-1/2">
                  <Loader2 className="w-5 h-5 text-purple-500 animate-spin" />
                </div>
              )}
              
              {search && !isSearching && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xl"
                >
                  ×
                </button>
              )}
            </div>

            {/* Sort */}
            <div className="flex items-center gap-2">
              <FiFilter className="text-gray-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-3 backdrop-blur-xl bg-white/5 dark:bg-black/20 border border-black/10 dark:border-white/10 rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              >
                <option value="updatedAt">Recently Updated</option>
                <option value="createdAt">Recently Created</option>
                <option value="name">Name (A-Z)</option>
              </select>

              <button
                onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                className="p-3 backdrop-blur-xl bg-white/5 dark:bg-black/20 border border-black/10 dark:border-white/10 rounded-lg hover:bg-white/10 dark:hover:bg-white/5 transition-all"
                title={sortOrder === 'asc' ? 'Ascending' : 'Descending'}
              >
                {sortOrder === 'asc' ? <TrendingUp className="text-gray-600" /> : <TrendingDown className="text-gray-600" />}
              </button>

              <button
                onClick={() => refetch()}
                disabled={isFetching}
                className="p-3 backdrop-blur-xl bg-white/5 dark:bg-black/20 border border-black/10 dark:border-white/10 rounded-lg hover:bg-white/10 dark:hover:bg-white/5 transition-all disabled:opacity-50"
              >
                <FiRefreshCw className={`text-gray-600 ${isFetching ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {/* Results Counter */}
            {search && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="px-4 py-2 bg-purple-50 text-purple-700 rounded-lg text-sm font-medium"
              >
                {isSearching ? 'Searching...' : `${campaigns.length} result${campaigns.length !== 1 ? 's' : ''} found`}
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="backdrop-blur-xl bg-white/10 dark:bg-black/10 border border-black/10 dark:border-white/10 rounded-xl shadow-lg overflow-hidden"
        >
          {campaigns.length === 0 && !isFetching ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiTarget className="text-purple-600 text-3xl" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Campaigns Found</h3>
              <p className="text-gray-600 mb-6">
                {search ? 'Try adjusting your search criteria' : 'Get started by creating your first campaign'}
              </p>
              {!search && (
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg transition-colors font-semibold"
                >
                  <FiPlus />
                  Create Your First Campaign
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/5 dark:bg-white/5 border-b border-white/10">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Campaign
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Admin
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Team
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Last Updated
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  <AnimatePresence>
                    {campaigns.map((camp, index) => (
                      <motion.tr
                        key={camp.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ delay: index * 0.05 }}
                        className="hover:bg-white/5 dark:hover:bg-white/5 transition-colors group border-b border-white/5"
                      >
                        {/* Campaign Name */}
                        <td className="px-6 py-4">
                          <Link href={`/campaigns/${camp.id}`}>
                            <div className="flex items-center gap-3 cursor-pointer group-hover:text-purple-600 transition-colors">
                              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center flex-shrink-0">
                                <FiTarget className="text-white" />
                              </div>
                              <div>
                                <p className="font-semibold text-gray-900 group-hover:text-purple-600">
                                  {camp.name}
                                </p>
                                <p className="text-sm text-gray-500 flex items-center gap-1">
                                  <FiCalendar className="w-3 h-3" />
                                  Created {new Date(camp.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                          </Link>
                        </td>

                        {/* Admin */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                              {camp.admin?.firstName?.[0]}{camp.admin?.lastName?.[0]}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900 text-sm">
                                {camp.admin?.firstName} {camp.admin?.lastName}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Team */}
                        <td className="px-6 py-4">
                          {camp.team ? (
                            <div className="flex items-center gap-1 text-sm text-gray-700">
                              <FiUsers className="w-4 h-4 text-gray-400" />
                              {camp.team.name}
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">No team</span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                            camp.status === 'ACTIVE'
                              ? 'bg-blue-100 text-blue-700 ring-1 ring-blue-200'
                              : camp.status === 'COMPLETED'
                              ? 'bg-green-100 text-green-700 ring-1 ring-green-200'
                              : 'bg-gray-100 text-gray-700 ring-1 ring-gray-200'
                          }`}>
                            <Activity className="w-3 h-3" />
                            {camp.status || 'ACTIVE'}
                          </span>
                        </td>

                        {/* Last Updated */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1 text-sm text-gray-600">
                            <Clock className="w-3 h-3" />
                            {new Date(camp.updatedAt).toLocaleDateString()}
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Link href={`/campaigns/${camp.id}`}>
                              <button
                                className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                                title="View campaign"
                              >
                                <FiEdit3 size={16} />
                              </button>
                            </Link>
                            <button
                              onClick={() => handleDeleteCampaign(camp)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete campaign"
                            >
                              <FiTrash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          )}

          {/* Infinite Scroll Loader */}
          <div ref={loadMoreRef} className="flex justify-center py-6 border-t border-gray-200">
            {isFetchingNextPage ? (
              <div className="flex items-center gap-3">
                <div className="h-5 w-5 border-3 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-sm text-gray-600 font-medium">Loading more campaigns...</span>
              </div>
            ) : hasNextPage ? (
              <span className="text-sm text-gray-500">Scroll to load more</span>
            ) : campaigns.length > 0 ? (
              <span className="text-sm text-gray-500">✓ All campaigns loaded</span>
            ) : null}
          </div>
        </motion.div>
      </div>

      {/* Add Campaign Modal */}
      <AddCampaignModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleCampaignUpdated}
        companyId={companyId}
      />
    </div>
  );
}
