'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import toast, { Toaster } from 'react-hot-toast';
import {
  FaInstagram,
  FaTwitter,
  FaFacebook,
  FaLinkedin,
  FaYoutube,
  FaPinterest,
  FaReddit,
  FaClock,
  FaCheck,
  FaExclamationTriangle,
  FaFileAlt,
  FaCalendarAlt,
  FaFilter,
  FaSearch,
  FaPlus,
  FaEye,
  FaChartLine,
  FaRocket,
  FaTimes,
} from 'react-icons/fa';
import { SiThreads } from 'react-icons/si';
import CreatePostModal from './CreatePostModal';

const PostsPage = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    pages: 0,
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    published: 0,
    scheduled: 0,
    draft: 0,
  });

  // Filters
  const [filters, setFilters] = useState({
    status: '',
    platform: '',
    dateFrom: '',
    dateTo: '',
    search: '',
  });

  const [showFilters, setShowFilters] = useState(false);

  // Platform icons mapping
  const platformIcons = {
    instagram: { icon: FaInstagram, color: 'from-[#E4405F] to-[#9C27B0]', bg: 'bg-pink-100' },
    twitter: { icon: FaTwitter, color: 'from-[#1DA1F2] to-[#0d8bd9]', bg: 'bg-blue-100' },
    facebook: { icon: FaFacebook, color: 'from-[#1877F2] to-[#0c5ecf]', bg: 'bg-blue-100' },
    linkedin: { icon: FaLinkedin, color: 'from-[#0A66C2] to-[#004182]', bg: 'bg-blue-100' },
    youtube: { icon: FaYoutube, color: 'from-[#FF0000] to-[#cc0000]', bg: 'bg-red-100' },
    pinterest: { icon: FaPinterest, color: 'from-[#E60023] to-[#bd001c]', bg: 'bg-red-100' },
    reddit: { icon: FaReddit, color: 'from-[#FF4500] to-[#d63a00]', bg: 'bg-orange-100' },
    threads: { icon: SiThreads, color: 'from-[#000000] to-[#333333]', bg: 'bg-gray-100' },
  };

  // Status configurations
  const statusConfig = {
    draft: {
      icon: FaFileAlt,
      color: 'text-gray-600',
      bg: 'bg-gray-100',
      border: 'border-gray-300',
      label: 'Draft',
    },
    scheduled: {
      icon: FaClock,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      border: 'border-blue-300',
      label: 'Scheduled',
    },
    published: {
      icon: FaCheck,
      color: 'text-green-600',
      bg: 'bg-green-50',
      border: 'border-green-300',
      label: 'Published',
    },
    failed: {
      icon: FaExclamationTriangle,
      color: 'text-red-600',
      bg: 'bg-red-50',
      border: 'border-red-300',
      label: 'Failed',
    },
  };

  // Fetch posts
  const fetchPosts = async () => {
    try {
      setLoading(true);

      const queryParams = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(filters.status && { status: filters.status }),
        ...(filters.platform && { platform: filters.platform }),
        ...(filters.dateFrom && { dateFrom: filters.dateFrom }),
        ...(filters.dateTo && { dateTo: filters.dateTo }),
        ...(filters.search && { search: filters.search }),
      });

      const response = await fetch(`/api/social/posts?${queryParams}`);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch posts');
      }

      const data = await response.json();

      setPosts(data.posts);
      setPagination(data.pagination);

      // Calculate stats
      const statsData = {
        total: data.pagination.total,
        published: data.posts.filter((p) => p.status === 'published').length,
        scheduled: data.posts.filter((p) => p.status === 'scheduled').length,
        draft: data.posts.filter((p) => p.status === 'draft').length,
      };
      setStats(statsData);
    } catch (error) {
      console.error('Failed to fetch posts:', error);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [pagination.page, filters.status, filters.platform, filters.dateFrom, filters.dateTo]);

  // Handle page change
  const handlePageChange = (newPage) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Apply filters
  const applySearch = () => {
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchPosts();
  };

  // Clear filters
  const clearFilters = () => {
    setFilters({
      status: '',
      platform: '',
      dateFrom: '',
      dateTo: '',
      search: '',
    });
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Get relative time
  const getRelativeTime = (dateString) => {
    if (!dateString) return '';
    const now = new Date();
    const date = new Date(dateString);
    const diff = date - now;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor(diff / (1000 * 60 * 60));

    if (days > 0) return `in ${days} day${days > 1 ? 's' : ''}`;
    if (hours > 0) return `in ${hours} hour${hours > 1 ? 's' : ''}`;
    if (hours === 0 && diff > 0) return 'in less than 1 hour';
    if (days < 0) return `${Math.abs(days)} day${Math.abs(days) > 1 ? 's' : ''} ago`;
    return '';
  };

  return (
    <div className="min-h-screen pt-14 md:pt-0">
      <Toaster position="top-right" />

      {/* Hero Section with Gradient Background */}
      <div className="relative overflow-hidden">
        {/* Animated Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 via-primary/10 to-violet-500/20" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent" />
        
        {/* Floating Shapes */}
        <div className="absolute top-10 right-20 w-64 h-64 bg-gradient-to-br from-blue-500/30 to-violet-500/30 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 left-10 w-80 h-80 bg-gradient-to-br from-primary/20 to-cyan-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />

        <div className="relative max-w-7xl mx-auto px-4 md:px-6 pt-8 pb-6">
          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
            <div>
              <motion.h1
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-3xl md:text-4xl font-bold text-foreground mb-2"
              >
                <span className="bg-gradient-to-r from-blue-500 via-primary to-violet-500 bg-clip-text text-transparent">
                  Social Media
                </span>
                {' '}Posts
              </motion.h1>
              <p className="text-muted-foreground text-base md:text-lg">
                Manage and track all your scheduled and published content
              </p>
            </div>

            {/* Create Post Button */}
            <motion.button
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setModalOpen(true)}
              className="flex items-center justify-center gap-3 px-6 py-3.5 bg-gradient-to-r from-primary to-violet-500 text-primary-foreground rounded-xl shadow-lg hover:shadow-xl transition-all font-semibold"
            >
              <FaPlus className="text-lg" />
              <span>Create New Post</span>
            </motion.button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              whileHover={{ y: -4, scale: 1.02 }}
              className="glass-card p-4 md:p-5 hover:shadow-lg transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-primary to-violet-500 rounded-xl flex items-center justify-center shadow-lg">
                  <FaChartLine className="text-lg md:text-xl text-white" />
                </div>
                <div>
                  <p className="text-muted-foreground text-xs md:text-sm font-medium">Total Posts</p>
                  <p className="text-xl md:text-2xl font-bold text-foreground">{stats.total}</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              whileHover={{ y: -4, scale: 1.02 }}
              className="glass-card p-4 md:p-5 hover:shadow-lg transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
                  <FaCheck className="text-lg md:text-xl text-white" />
                </div>
                <div>
                  <p className="text-muted-foreground text-xs md:text-sm font-medium">Published</p>
                  <p className="text-xl md:text-2xl font-bold text-emerald-600">{stats.published}</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              whileHover={{ y: -4, scale: 1.02 }}
              className="glass-card p-4 md:p-5 hover:shadow-lg transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg">
                  <FaClock className="text-lg md:text-xl text-white" />
                </div>
                <div>
                  <p className="text-muted-foreground text-xs md:text-sm font-medium">Scheduled</p>
                  <p className="text-xl md:text-2xl font-bold text-blue-600">{stats.scheduled}</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              whileHover={{ y: -4, scale: 1.02 }}
              className="glass-card p-4 md:p-5 hover:shadow-lg transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-gray-500 to-gray-600 rounded-xl flex items-center justify-center shadow-lg">
                  <FaFileAlt className="text-lg md:text-xl text-white" />
                </div>
                <div>
                  <p className="text-muted-foreground text-xs md:text-sm font-medium">Drafts</p>
                  <p className="text-xl md:text-2xl font-bold text-foreground">{stats.draft}</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6">
        {/* Search & Filters Bar */}
        <div className="glass-card p-4 md:p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search Bar */}
            <div className="flex-1">
              <div className="relative">
                <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
                  onKeyPress={(e) => e.key === 'Enter' && applySearch()}
                  placeholder="Search posts by title or content..."
                  className="w-full pl-12 pr-4 py-3 border border-[var(--glass-border)] bg-[var(--glass-hover)] rounded-xl focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all text-foreground placeholder:text-muted-foreground"
                />
              </div>
            </div>

            {/* Quick Filters */}
            <div className="flex flex-wrap gap-2 md:gap-3">
              <select
                value={filters.status}
                onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}
                className="px-3 md:px-4 py-2.5 md:py-3 border border-[var(--glass-border)] bg-[var(--glass-hover)] rounded-xl focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all text-foreground text-sm"
              >
                <option value="">All Status</option>
                <option value="draft">Draft</option>
                <option value="scheduled">Scheduled</option>
                <option value="published">Published</option>
                <option value="failed">Failed</option>
              </select>

              <select
                value={filters.platform}
                onChange={(e) => setFilters((prev) => ({ ...prev, platform: e.target.value }))}
                className="px-3 md:px-4 py-2.5 md:py-3 border border-[var(--glass-border)] bg-[var(--glass-hover)] rounded-xl focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all text-foreground text-sm"
              >
                <option value="">All Platforms</option>
                <option value="instagram">Instagram</option>
                <option value="twitter">Twitter</option>
                <option value="facebook">Facebook</option>
                <option value="linkedin">LinkedIn</option>
                <option value="youtube">YouTube</option>
                <option value="pinterest">Pinterest</option>
                <option value="reddit">Reddit</option>
                <option value="threads">Threads</option>
              </select>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-3 md:px-4 py-2.5 md:py-3 rounded-xl transition-all text-sm font-medium ${
                  showFilters
                    ? 'bg-primary/10 border-primary/30 text-primary border'
                    : 'glass-card text-foreground hover:shadow-md'
                }`}
              >
                <FaFilter />
                <span className="hidden sm:inline">More</span>
              </motion.button>

              {(filters.status || filters.platform || filters.dateFrom || filters.dateTo || filters.search) && (
                <motion.button
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={clearFilters}
                  className="flex items-center gap-2 px-3 md:px-4 py-2.5 md:py-3 bg-destructive/10 text-destructive border border-destructive/30 rounded-xl hover:bg-destructive/20 transition-all text-sm font-medium"
                >
                  <FaTimes />
                  <span className="hidden sm:inline">Clear</span>
                </motion.button>
              )}
            </div>
          </div>

          {/* Extended Filters */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="mt-6 pt-6 border-t border-[var(--glass-border)]">
                  <h4 className="text-sm font-semibold text-foreground mb-4">Date Range</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-muted-foreground mb-2">
                        From Date
                      </label>
                      <input
                        type="date"
                        value={filters.dateFrom}
                        onChange={(e) =>
                          setFilters((prev) => ({ ...prev, dateFrom: e.target.value }))
                        }
                        className="w-full px-4 py-3 border border-[var(--glass-border)] bg-[var(--glass-hover)] rounded-xl focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all text-foreground"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-muted-foreground mb-2">
                        To Date
                      </label>
                      <input
                        type="date"
                        value={filters.dateTo}
                        onChange={(e) =>
                          setFilters((prev) => ({ ...prev, dateTo: e.target.value }))
                        }
                        className="w-full px-4 py-3 border border-[var(--glass-border)] bg-[var(--glass-hover)] rounded-xl focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all text-foreground"
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex flex-col justify-center items-center py-20">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
              className="w-12 h-12 md:w-16 md:h-16 border-4 border-primary border-t-transparent rounded-full mb-4"
            />
            <p className="text-muted-foreground font-medium">Loading posts...</p>
          </div>
        ) : posts.length === 0 ? (
          /* Empty State */
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card p-8 md:p-12 text-center"
          >
            <div className="w-20 h-20 md:w-24 md:h-24 bg-gradient-to-br from-primary/20 to-violet-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <FaRocket className="text-3xl md:text-4xl text-primary" />
            </div>
            <h3 className="text-xl md:text-2xl font-bold text-foreground mb-3">No posts found</h3>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              {filters.status || filters.platform || filters.search
                ? "Try adjusting your filters to see more results"
                : "Get started by creating your first social media post"}
            </p>
            <motion.button
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setModalOpen(true)}
              className="inline-flex items-center gap-3 px-6 md:px-8 py-3.5 md:py-4 bg-gradient-to-r from-primary to-violet-500 text-primary-foreground rounded-xl hover:shadow-xl transition-all font-semibold"
            >
              <FaPlus className="text-lg md:text-xl" />
              Create Your First Post
            </motion.button>
          </motion.div>
        ) : (
          <>
            {/* Posts Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-8">
              {posts.map((post, index) => {
                const status = statusConfig[post.status] || statusConfig.draft;
                const StatusIcon = status.icon;

                return (
                  <motion.div
                    key={post._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ y: -8, scale: 1.01 }}
                    className="glass-card hover:shadow-2xl transition-all overflow-hidden group"
                  >
                    {/* Status Badge - Top Right */}
                    <div className="p-4 md:p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${status.bg} border ${status.border}`}
                        >
                          <StatusIcon className={`text-sm ${status.color}`} />
                          <span className={`text-xs font-semibold ${status.color}`}>
                            {status.label}
                          </span>
                        </div>

                        {post.status === 'scheduled' && post.scheduledFor && (
                          <div className="text-xs text-blue-600 font-medium bg-blue-500/10 px-2 py-1 rounded-lg">
                            {getRelativeTime(post.scheduledFor)}
                          </div>
                        )}
                      </div>

                      {/* Post Content */}
                      <h3 className="text-lg font-bold text-foreground mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                        {post.title || 'Untitled Post'}
                      </h3>
                      <p className="text-muted-foreground text-sm line-clamp-3 mb-4">
                        {post.content}
                      </p>

                      {/* Platforms */}
                      <div className="flex flex-wrap gap-2 mb-4">
                        {post.platforms?.slice(0, 3).map((platformData) => {
                          const platformKey = platformData.platform.toLowerCase();
                          const platformInfo = platformIcons[platformKey] || {
                            icon: FaFileAlt,
                            color: 'from-gray-400 to-gray-600',
                            bg: 'bg-[var(--glass-hover)]',
                          };
                          const Icon = platformInfo.icon;

                          return (
                            <div
                              key={platformData.platform}
                              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[var(--glass-hover)] text-foreground text-xs font-medium`}
                            >
                              <Icon className="text-sm" />
                              <span className="capitalize">{platformData.platform}</span>
                            </div>
                          );
                        })}
                        {post.platforms?.length > 3 && (
                          <div className="px-2.5 py-1 bg-[var(--glass-hover)] rounded-lg text-xs font-medium text-muted-foreground">
                            +{post.platforms.length - 3}
                          </div>
                        )}
                      </div>

                      {/* Tags */}
                      {post.tags && post.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-4">
                          {post.tags.slice(0, 3).map((tag, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-1 bg-violet-500/10 text-violet-600 rounded-lg text-xs font-medium"
                            >
                              #{tag}
                            </span>
                          ))}
                          {post.tags.length > 3 && (
                            <span className="px-2 py-1 bg-violet-500/10 text-violet-600 rounded-lg text-xs font-medium">
                              +{post.tags.length - 3}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Meta Info */}
                      <div className="flex items-center text-sm text-muted-foreground pt-4 border-t border-[var(--glass-border)]">
                        <FaCalendarAlt className="mr-2" />
                        <span className="text-xs">
                          {post.scheduledFor
                            ? formatDate(post.scheduledFor)
                            : formatDate(post.createdAt)}
                        </span>
                      </div>
                    </div>

                    {/* Actions Footer */}
                    <div className="px-4 md:px-6 py-3 md:py-4 bg-[var(--glass-hover)] border-t border-[var(--glass-border)] flex justify-between items-center">
                      <Link
                        href={`/admin/posts/${post._id}`}
                        className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 font-semibold transition-colors"
                      >
                        <FaEye />
                        View Details
                      </Link>
                      {post.status === 'draft' && (
                        <Link
                          href={`/admin/posts/${post._id}/edit`}
                          className="text-sm text-foreground hover:text-primary font-medium transition-colors"
                        >
                          Edit →
                        </Link>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="flex flex-col items-center gap-4">
                <div className="flex items-center gap-2">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className="px-4 md:px-5 py-2 md:py-2.5 glass-card rounded-xl hover:shadow-md disabled:opacity-40 disabled:cursor-not-allowed transition-all font-medium text-foreground text-sm md:text-base"
                  >
                    Previous
                  </motion.button>

                  <div className="flex items-center gap-1 md:gap-2">
                    {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                      let pageNum;
                      if (pagination.pages <= 5) {
                        pageNum = i + 1;
                      } else if (pagination.page <= 3) {
                        pageNum = i + 1;
                      } else if (pagination.page >= pagination.pages - 2) {
                        pageNum = pagination.pages - 4 + i;
                      } else {
                        pageNum = pagination.page - 2 + i;
                      }

                      return (
                        <motion.button
                          key={pageNum}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handlePageChange(pageNum)}
                          className={`w-9 h-9 md:w-11 md:h-11 rounded-xl font-semibold transition-all text-sm md:text-base ${
                            pagination.page === pageNum
                              ? 'bg-gradient-to-r from-primary to-violet-500 text-primary-foreground shadow-lg'
                              : 'glass-card text-foreground hover:shadow-md'
                          }`}
                        >
                          {pageNum}
                        </motion.button>
                      );
                    })}
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page === pagination.pages}
                    className="px-4 md:px-5 py-2 md:py-2.5 glass-card rounded-xl hover:shadow-md disabled:opacity-40 disabled:cursor-not-allowed transition-all font-medium text-foreground text-sm md:text-base"
                  >
                    Next
                  </motion.button>
                </div>

                <div className="text-center text-xs md:text-sm text-muted-foreground font-medium">
                  Showing {(pagination.page - 1) * pagination.limit + 1} -{' '}
                  {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                  {pagination.total} posts
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Floating Action Button (Mobile) */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setModalOpen(true)}
        className="fixed bottom-6 right-6 lg:hidden w-14 h-14 bg-gradient-to-r from-primary to-violet-500 text-primary-foreground rounded-2xl shadow-2xl flex items-center justify-center z-40"
      >
        <FaPlus className="text-xl" />
      </motion.button>

      {/* Create Post Modal */}
      <CreatePostModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={(result) => {
          console.log('Post created:', result);
          fetchPosts(); // Refresh the list
          toast.success('Post created successfully!');
        }}
      />
    </div>
  );
};

export default PostsPage;
