'use client';

import { useEffect, useRef, useState } from 'react';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { FiSearch, FiChevronDown, FiPlus, FiEdit3 } from 'react-icons/fi';
import AddEmployeeModal from './AddEmployeeModal';
import EditEmployeeModal from './EmployeeEdit';
import { Medal } from 'lucide-react';

// ---------------- Fetch Employees ----------------
const fetchEmployees = async ({ pageParam = null, queryKey }) => {
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

  const res = await fetch(`/api/admin/employees?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch employees');
  return res.json();
};

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
  const queryClient = useQueryClient();

  // ✅ Fetch logged-in user's company details
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch('/api/auth/me', { credentials: 'include' });
        if (!res.ok) throw new Error('Unauthorized');
        const data = await res.json();
        setCompanyId(data.company?.id);
      } catch (err) {
        console.error('Auth fetch failed:', err);
      } finally {
        setAuthLoading(false);
      }
    };
    fetchUser();
  }, []);

  // 🔁 Infinite Pagination
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
    isFetching,
    status,
  } = useInfiniteQuery({
    queryKey: ['employees', { search, sortBy, sortOrder, companyId }],
    queryFn: fetchEmployees,
    enabled: !!companyId,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });

  const employees = data?.pages.flatMap((p) => p.data) ?? [];

  // 🔄 Infinite Scroll
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

  // ⏱️ Debounce Search
  useEffect(() => {
    const delay = setTimeout(() => refetch(), 400);
    return () => clearTimeout(delay);
  }, [search, sortBy, sortOrder]);

  // ✅ Refresh after add/edit
  const handleEmployeeChange = () => {
    queryClient.invalidateQueries(['employees']);
  };

  // 🌀 Loading
  if (authLoading || status === 'loading') {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <div className="h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h3 className="text-2xl font-bold text-gray-800">Employees</h3>

        <div className="flex flex-wrap gap-3 items-center">
          {/* Add Employee */}
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition font-semibold shadow-sm"
          >
            <FiPlus size={18} /> Add Employee
          </button>

          {/* Sort */}
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
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2 w-72 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 transition"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-gray-100">
        {employees.length === 0 && !isFetching ? (
          <p className="text-center p-8 text-gray-500">No employees found.</p>
        ) : (
          <table className="w-full text-sm text-left text-gray-600">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50 sticky top-0">
              <tr>
                <th className="px-6 py-3">Name</th>
                <th className="px-6 py-3">Last Login</th>
                <th className="px-6 py-3">Role</th>
                <th className="px-6 py-3">Campaigns</th>
                <th className="px-6 py-3">Teams</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((emp) => (
                <motion.tr
                  key={emp.id}
                  whileHover={{
                    scale: 1.01,
                    backgroundColor: '#f9fafb',
                  }}
                  transition={{ type: 'spring', stiffness: 150 }}
                  className="border-b"
                >
                  <td className="px-6 py-4 flex items-center gap-3 font-medium text-gray-900">
                    <Image
                      src={`https://ui-avatars.com/api/?name=${emp.firstName}+${emp.lastName}&background=random`}
                      alt={emp.firstName}
                      width={32}
                      height={32}
                      className="rounded-full"
                      unoptimized
                    />
                    <span>{emp.firstName} {emp.lastName} </span> {emp.is_admin&&<Medal size="24" color='gold'/>}
                  </td>
                  <td className="px-6 py-4 text-gray-700">
                    {emp.lastLogin
                      ? new Date(emp.lastLogin).toLocaleString()
                      : '—'}
                  </td>
                  <td className="px-6 py-4">{emp.role?.name || '—'}</td>
                  <td className="px-6 py-4">
                    {emp.campaigns?.length
                      ? emp.campaigns.map((c) => c.name).join(', ')
                      : '—'}
                  </td>
                  <td className="px-6 py-4">
                    {emp.teams?.length
                      ? emp.teams.map((t) => t.name).join(', ')
                      : '—'}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-3 py-1 text-xs rounded-full font-semibold ${
                        emp.status === 'ACTIVE'
                          ? 'bg-green-100 text-green-700'
                          : emp.status === 'INACTIVE'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {emp.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => {
                        setSelectedEmployee(emp);
                        setEditModalOpen(true);
                      }}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <FiEdit3 size={18} />
                    </button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Infinite Scroll Loader */}
      <div ref={loadMoreRef} className="flex justify-center py-4 text-sm text-gray-500">
        {isFetchingNextPage ? (
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <span>Loading more...</span>
          </div>
        ) : hasNextPage ? (
          'Scroll to load more'
        ) : (
          'No more employees'
        )}
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
    </motion.div>
  );
}
