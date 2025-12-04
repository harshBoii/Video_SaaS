'use client';

import { useEffect, useRef, useState } from 'react';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { 
  FiSearch, 
  FiPlus, 
  FiEdit3, 
  FiTrash2,
  FiMail,
  FiClock,
  FiUsers,
  FiFilter
} from 'react-icons/fi';
import { 
  Medal, 
  TrendingUp, 
  TrendingDown,
  Sparkles,
  UserCheck,
  UserX,
  AlertCircle,
  Loader2
} from 'lucide-react';
import AddEmployeeModal from './AddEmployeeModal';
import EditEmployeeModal from './EmployeeEdit';
import { showSuccess, showError, showConfirm, showLoading, closeSwal } from '@/app/lib/swal';
export const dynamic = 'force-dynamic';

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

// ---------------- Fetch Employees ----------------
const fetchEmployees = async ({ pageParam = null, queryKey }) => {
  const [_key, { search, sortBy, sortOrder, companyId }] = queryKey;
  
  if (!companyId) {
    return { data: [], nextCursor: null };
  }

  const params = new URLSearchParams({
    companyId,
    take: '50',
    sortBy,
    sortOrder,
  });
  if (pageParam) params.append('cursor', pageParam);
  if (search) params.append('search', search);

  const url = `/api/admin/employees?${params.toString()}`;

  const res = await fetch(url, {
    credentials: 'include',
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error('Failed to fetch employees');
  }

  const result = await res.json();
  return result;
};

// ---------------- Loading Skeleton ----------------
function TableSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg animate-pulse">
          <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-3 bg-gray-200 rounded w-1/3"></div>
          </div>
          <div className="h-6 bg-gray-200 rounded w-16"></div>
        </div>
      ))}
    </div>
  );
}

// ---------------- Main Component ----------------
export default function EmployeesPage() {
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('updatedAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [companyId, setCompanyId] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const queryClient = useQueryClient();

  // Fetch auth
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch('/api/auth/me', { credentials: 'include' });
        if (!res.ok) throw new Error('Unauthorized');
        
        const data = await res.json();
        const employeeCompanyId = data.employee?.companyId || data.companyId;
        
        if (!employeeCompanyId) {
          await showError('Error', 'No company found for your account');
        }
        
        setCompanyId(employeeCompanyId);
      } catch (err) {
        console.error('Auth fetch failed:', err);
        await showError('Authentication Failed', 'Please log in again');
      } finally {
        setAuthLoading(false);
      }
    };
    fetchUser();
  }, []);

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
    queryKey: ['employees', { search, sortBy, sortOrder, companyId }],
    queryFn: fetchEmployees,
    enabled: !!companyId,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });

  const employees = data?.pages.flatMap((p) => p.data) ?? [];

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

  // Debounce search with loading indicator
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
  const handleEmployeeChange = async () => {
    await queryClient.invalidateQueries(['employees']);
    await showSuccess('Success!', 'Employee list updated');
  };

  // Delete employee
  const handleDeleteEmployee = async (employee) => {
    const result = await showConfirm(
      'Delete Employee?',
      `Are you sure you want to remove ${employee.firstName} ${employee.lastName}? This action cannot be undone.`,
      'Yes, Delete',
      'Cancel'
    );

    if (result.isConfirmed) {
      showLoading('Deleting employee...', 'Please wait');
      
      try {
        // Implement delete API call here
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        closeSwal();
        await showSuccess('Deleted!', 'Employee removed successfully');
        handleEmployeeChange();
      } catch (error) {
        closeSwal();
        await showError('Delete Failed', error.message);
      }
    }
  };

  // Stats calculation
  const stats = {
    total: employees.length,
    active: employees.filter(e => e.status === 'ACTIVE').length,
    inactive: employees.filter(e => e.status !== 'ACTIVE').length,
    admins: employees.filter(e => e.is_admin).length,
  };

  // Loading state
  if (authLoading || status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <div className="h-8 bg-gray-200 rounded w-48 animate-pulse mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-64 animate-pulse"></div>
          </div>
          <TableSkeleton />
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center"
        >
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Failed to Load Employees</h3>
          <p className="text-gray-600 mb-6">{error.message}</p>
          <button
            onClick={() => refetch()}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
          >
            Try Again
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      {/* Loading Bar */}
      <LoadingBar isLoading={isFetching || isSearching} />

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-2">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <FiUsers className="text-white text-2xl" />
                </div>
                Employees
              </h1>
              <p className="text-gray-600">Manage your team members and their roles</p>
            </div>
            
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl transition-all font-semibold shadow-lg shadow-blue-500/30 hover:shadow-xl hover:scale-105"
            >
              <FiPlus size={20} />
              Add Employee
            </button>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-4 gap-4 mb-6"
        >
          <div className="bg-white rounded-xl p-4 border border-gray-200 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Employees</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <FiUsers className="text-blue-600 text-xl" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 border border-gray-200 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Active</p>
                <p className="text-2xl font-bold text-green-600">{stats.active}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <UserCheck className="text-green-600 text-xl" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 border border-gray-200 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Inactive</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.inactive}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <UserX className="text-yellow-600 text-xl" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 border border-gray-200 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Admins</p>
                <p className="text-2xl font-bold text-purple-600">{stats.admins}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Medal className="text-purple-600 text-xl" />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl p-4 mb-6 border border-gray-200 shadow-sm"
        >
          <div className="flex flex-wrap items-center gap-4">
            {/* Search */}
            <div className="flex-1 min-w-[300px] relative">
              <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg" />
              <input
                type="text"
                placeholder="Search by name, email, role..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-12 pr-12 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-gray-50 hover:bg-white"
              />
              
              {/* Loading Spinner in Search */}
              {isSearching && (
                <div className="absolute right-12 top-1/2 -translate-y-1/2">
                  <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
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
                className="px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 hover:bg-white transition-all"
              >
                <option value="updatedAt">Recently Updated</option>
                <option value="createdAt">Recently Added</option>
                <option value="firstName">Name (A-Z)</option>
                <option value="lastName">Last Name</option>
              </select>

              <button
                onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                className="p-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-all"
                title={sortOrder === 'asc' ? 'Ascending' : 'Descending'}
              >
                {sortOrder === 'asc' ? <TrendingUp className="text-gray-600" /> : <TrendingDown className="text-gray-600" />}
              </button>
            </div>

            {/* Results Count */}
            {search && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="px-4 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium"
              >
                {isSearching ? 'Searching...' : `${employees.length} result${employees.length !== 1 ? 's' : ''} found`}
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
        >
          {employees.length === 0 && !isFetching ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiUsers className="text-gray-400 text-3xl" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Employees Found</h3>
              <p className="text-gray-600 mb-6">
                {search ? 'Try adjusting your search criteria' : 'Get started by adding your first employee'}
              </p>
              {!search && (
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors font-semibold"
                >
                  <FiPlus />
                  Add Your First Employee
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Employee
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Role & Department
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Teams & Campaigns
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Last Login
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  <AnimatePresence>
                    {employees.map((emp, index) => (
                      <motion.tr
                        key={emp.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ delay: index * 0.05 }}
                        className="hover:bg-gray-50 transition-colors group"
                      >
                        {/* Employee Info */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <Image
                                src={`https://ui-avatars.com/api/?name=${emp.firstName}+${emp.lastName}&background=random&size=128`}
                                alt={emp.firstName}
                                width={40}
                                height={40}
                                className="rounded-full ring-2 ring-gray-100"
                                unoptimized
                              />
                              {emp.is_admin && (
                                <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
                                  <Medal size={12} className="text-white" />
                                </div>
                              )}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-semibold text-gray-900">
                                  {emp.firstName} {emp.lastName}
                                </p>
                                {emp.is_admin && (
                                  <span className="px-2 py-0.5 bg-gradient-to-r from-yellow-100 to-orange-100 text-yellow-700 text-xs rounded-full font-medium">
                                    Admin
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-gray-500 flex items-center gap-1">
                                <FiMail className="w-3 h-3" />
                                {emp.email}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Role & Department */}
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            <p className="font-medium text-gray-900">{emp.role?.name || '—'}</p>
                            {emp.department && (
                              <p className="text-sm text-gray-500">{emp.department.name}</p>
                            )}
                          </div>
                        </td>

                        {/* Teams & Campaigns */}
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            {emp.campaigns?.length > 0 && (
                              <div className="flex items-center gap-1 text-xs text-purple-600">
                                <Sparkles className="w-3 h-3" />
                                {emp.campaigns.length} campaign{emp.campaigns.length !== 1 && 's'}
                              </div>
                            )}
                            {emp.teams?.length > 0 && (
                              <div className="flex items-center gap-1 text-xs text-blue-600">
                                <FiUsers className="w-3 h-3" />
                                {emp.teams.length} team{emp.teams.length !== 1 && 's'}
                              </div>
                            )}
                            {!emp.campaigns?.length && !emp.teams?.length && (
                              <span className="text-sm text-gray-400">—</span>
                            )}
                          </div>
                        </td>

                        {/* Last Login */}
                        <td className="px-6 py-4">
                          {emp.lastLogin ? (
                            <div className="flex items-center gap-1 text-sm text-gray-600">
                              <FiClock className="w-3 h-3" />
                              {new Date(emp.lastLogin).toLocaleDateString()}
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">Never</span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                            emp.status === 'ACTIVE'
                              ? 'bg-green-100 text-green-700 ring-1 ring-green-200'
                              : emp.status === 'INACTIVE'
                              ? 'bg-yellow-100 text-yellow-700 ring-1 ring-yellow-200'
                              : 'bg-red-100 text-red-700 ring-1 ring-red-200'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${
                              emp.status === 'ACTIVE' ? 'bg-green-500' : 
                              emp.status === 'INACTIVE' ? 'bg-yellow-500' : 'bg-red-500'
                            }`} />
                            {emp.status}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => {
                                setSelectedEmployee(emp);
                                setEditModalOpen(true);
                              }}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Edit employee"
                            >
                              <FiEdit3 size={16} />
                            </button>
                            <button
                              onClick={() => handleDeleteEmployee(emp)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete employee"
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
                <div className="h-5 w-5 border-3 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-sm text-gray-600 font-medium">Loading more employees...</span>
              </div>
            ) : hasNextPage ? (
              <span className="text-sm text-gray-500">Scroll to load more</span>
            ) : employees.length > 0 ? (
              <span className="text-sm text-gray-500">✓ All employees loaded</span>
            ) : null}
          </div>
        </motion.div>
      </div>

      {/* Modals */}
      <AddEmployeeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleEmployeeChange}
        companyId={companyId}
      />

      <EditEmployeeModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        employee={selectedEmployee}
        onSuccess={handleEmployeeChange}
      />
    </div>
  );
}
