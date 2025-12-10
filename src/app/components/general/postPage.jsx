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
  FaSearch
} from 'react-icons/fa';
import { SiThreads } from 'react-icons/si';
import CreatePostModal from './postModal';

const PostsPage = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });
  const [modalOpen,setModalOpen] = useState(false)

  const OpenModal = async ()=>{
    setModalOpen(true)
  }
  // Filters
  const [filters, setFilters] = useState({
    status: '',
    platform: '',
    dateFrom: '',
    dateTo: '',
    search: ''
  });

  const [showFilters, setShowFilters] = useState(false);

  // Platform icons mapping
  const platformIcons = {
    instagram: { icon: FaInstagram, color: 'from-[#E4405F] to-[#9C27B0]' },
    twitter: { icon: FaTwitter, color: 'from-[#1DA1F2] to-[#0d8bd9]' },
    facebook: { icon: FaFacebook, color: 'from-[#1877F2] to-[#0c5ecf]' },
    linkedin: { icon: FaLinkedin, color: 'from-[#0A66C2] to-[#004182]' },
    youtube: { icon: FaYoutube, color: 'from-[#FF0000] to-[#cc0000]' },
    pinterest: { icon: FaPinterest, color: 'from-[#E60023] to-[#bd001c]' },
    reddit: { icon: FaReddit, color: 'from-[#FF4500] to-[#d63a00]' },
    threads: { icon: SiThreads, color: 'from-[#000000] to-[#333333]' }
  };

  // Status configurations
  const statusConfig = {
    draft: { 
      icon: FaFileAlt, 
      color: 'text-gray-500', 
      bg: 'bg-gray-100', 
      label: 'Draft' 
    },
    scheduled: { 
      icon: FaClock, 
      color: 'text-blue-600', 
      bg: 'bg-blue-100', 
      label: 'Scheduled' 
    },
    published: { 
      icon: FaCheck, 
      color: 'text-green-600', 
      bg: 'bg-green-100', 
      label: 'Published' 
    },
    failed: { 
      icon: FaExclamationTriangle, 
      color: 'text-red-600', 
      bg: 'bg-red-100', 
      label: 'Failed' 
    }
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
        ...(filters.dateTo && { dateTo: filters.dateTo })
      });

      const response = await fetch(`/api/social/posts?${queryParams}`);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch posts');
      }

      const data = await response.json();
      
      setPosts(data.posts);
      setPagination(data.pagination);

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
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  // Apply filters
  const applyFilters = () => {
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchPosts();
    setShowFilters(false);
  };

  // Clear filters
  const clearFilters = () => {
    setFilters({
      status: '',
      platform: '',
      dateFrom: '',
      dateTo: '',
      search: ''
    });
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <Toaster position="top-right" />

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Social Media Posts</h1>
          <p className="text-gray-600">Manage and track all your scheduled and published posts</p>
        </div>

        {/* Filters Bar */}
        <div className="bg-white rounded-xl shadow-md p-4 mb-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              {/* Status Filter */}
              <select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Status</option>
                <option value="draft">Draft</option>
                <option value="scheduled">Scheduled</option>
                <option value="published">Published</option>
                <option value="failed">Failed</option>
              </select>

              {/* Platform Filter */}
              <select
                value={filters.platform}
                onChange={(e) => setFilters(prev => ({ ...prev, platform: e.target.value }))}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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

              {/* Date Filters Toggle */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <FaFilter className="text-gray-600" />
                More Filters
              </button>
            </div>

            {/* Clear Filters */}
            {(filters.status || filters.platform || filters.dateFrom || filters.dateTo) && (
              <button
                onClick={clearFilters}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Clear All
              </button>
            )}
          </div>

          {/* Extended Filters */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="mt-4 pt-4 border-t border-gray-200"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      From Date
                    </label>
                    <input
                      type="date"
                      value={filters.dateFrom}
                      onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      To Date
                    </label>
                    <input
                      type="date"
                      value={filters.dateTo}
                      onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
              className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full"
            />
          </div>
        ) : posts.length === 0 ? (
          /* Empty State */
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <FaFileAlt className="mx-auto text-6xl text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No posts found</h3>
            <p className="text-gray-500 mb-6">
              {filters.status || filters.platform
                ? 'Try adjusting your filters'
                : 'Create your first post to get started'}
            </p>
            <button
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              onClick={()=>OpenModal()}
            >
              Create Post
            </button>
          </div>
        ) : (
          <>
            {/* Posts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {posts.map((post) => {
                const status = statusConfig[post.status] || statusConfig.draft;
                const StatusIcon = status.icon;

                return (
                  <motion.div
                    key={post._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-xl shadow-md hover:shadow-xl transition-shadow overflow-hidden"
                  >
                    {/* Post Header */}
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            {post.title || 'Untitled Post'}
                          </h3>
                          <p className="text-gray-600 text-sm line-clamp-2">
                            {post.content}
                          </p>
                        </div>
                        
                        {/* Status Badge */}
                        <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${status.bg} ${status.color}`}>
                          <StatusIcon className="text-sm" />
                          <span className="text-xs font-medium">{status.label}</span>
                        </div>
                      </div>

                      {/* Platforms */}
                      <div className="flex flex-wrap gap-2 mb-4">
                        {post.platforms?.map((platformData) => {
                          const platformKey = platformData.platform.toLowerCase();
                          const platformInfo = platformIcons[platformKey] || { 
                            icon: FaFileAlt, 
                            color: 'from-gray-400 to-gray-600' 
                          };
                          const Icon = platformInfo.icon;

                          return (
                            <div
                              key={platformData.platform}
                              className={`flex items-center gap-2 px-3 py-1 rounded-lg bg-gradient-to-r ${platformInfo.color} text-white text-xs`}
                            >
                              <Icon />
                              <span className="capitalize">{platformData.platform}</span>
                            </div>
                          );
                        })}
                      </div>

                      {/* Meta Info */}
                      <div className="flex items-center justify-between text-sm text-gray-500 pt-4 border-t border-gray-100">
                        <div className="flex items-center gap-2">
                          <FaCalendarAlt />
                          <span>
                            {post.scheduledFor 
                              ? formatDate(post.scheduledFor)
                              : formatDate(post.createdAt)}
                          </span>
                        </div>

                        {post.tags && post.tags.length > 0 && (
                          <div className="flex gap-1">
                            {post.tags.slice(0, 2).map((tag, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-1 bg-gray-100 rounded text-xs"
                              >
                                #{tag}
                              </span>
                            ))}
                            {post.tags.length > 2 && (
                              <span className="px-2 py-1 bg-gray-100 rounded text-xs">
                                +{post.tags.length - 2}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 flex justify-end gap-2">
                      <Link
                        href={`/admin/posts/${post._id}`}
                        className="px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        View Details
                      </Link>
                      {post.status === 'draft' && (
                        <Link
                          href={`/admin/posts/${post._id}/edit`}
                          className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          Edit
                        </Link>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="flex items-center justify-center gap-2">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                
                <div className="flex items-center gap-2">
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
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`w-10 h-10 rounded-lg transition-colors ${
                          pagination.page === pageNum
                            ? 'bg-blue-600 text-white'
                            : 'border border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.pages}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            )}

            {/* Results Info */}
            <div className="text-center text-sm text-gray-600 mt-4">
              Showing {((pagination.page - 1) * pagination.limit) + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} posts
            </div>
          </>
        )}
      </div>
      <CreatePostModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={(result) => {
          console.log('Post created:', result);
        }}
      />

    </div>
  );
};

export default PostsPage;
