'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Filter, 
  LayoutGrid, 
  List as ListIcon, 
  Calendar, 
  Users, 
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  PlayCircle,
  Clock
} from 'lucide-react';
import { useRouter } from 'next/navigation';

// --- Mock Data fallback ---
const MOCK_CAMPAIGNS = [
  {
    id: '1',
    name: 'Q4 Marketing Push',
    role: 'Editor',
    status: 'active',
    dueDate: new Date().toISOString(),
    members: 5,
    videos: 12,
    progress: 65,
  }
];

// --- Sub-components ---

const StatusBadge = ({ status }) => {
  const styles = {
    active: 'bg-blue-100 text-blue-700 border-blue-200',
    urgent: 'bg-amber-100 text-amber-700 border-amber-200',
    completed: 'bg-green-100 text-green-700 border-green-200',
    archived: 'bg-gray-100 text-gray-700 border-gray-200'
  };

  const icons = {
    active: <PlayCircle className="w-3 h-3" />,
    urgent: <AlertCircle className="w-3 h-3" />,
    completed: <CheckCircle2 className="w-3 h-3" />,
    archived: <Clock className="w-3 h-3" />
  };

  const safeStatus = status ? status.toLowerCase() : 'active';

  return (
    <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${styles[safeStatus] || styles.active}`}>
      {icons[safeStatus] || icons.active}
      {safeStatus.charAt(0).toUpperCase() + safeStatus.slice(1)}
    </span>
  );
};

const CampaignCard = ({ campaign, onClick }) => (
  <motion.div 
    layout
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    whileHover={{ y: -4, transition: { duration: 0.2 } }}
    onClick={() => onClick(campaign.id)}
    className="group bg-white rounded-2xl border border-gray-200 p-5 cursor-pointer hover:shadow-xl hover:border-blue-300 transition-all duration-300"
  >
    <div className="flex justify-between items-start mb-4">
      <div className="p-2.5 bg-blue-50 rounded-xl text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
        <LayoutGrid className="w-6 h-6" />
      </div>
      <StatusBadge status={campaign.status} />
    </div>

    <h3 className="text-lg font-bold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">
      {campaign.name}
    </h3>
    <p className="text-sm text-gray-500 mb-4">Role: <span className="font-medium text-gray-700">{campaign.role}</span></p>

    {/* Progress Bar */}
    <div className="mb-4">
      <div className="flex justify-between text-xs mb-1.5">
        <span className="text-gray-500 font-medium">Progress</span>
        <span className="text-gray-900 font-bold">{campaign.progress}%</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"
          style={{ width: `${campaign.progress}%` }}
        />
      </div>
    </div>

    <div className="flex items-center justify-between pt-4 border-t border-gray-100 text-xs text-gray-500">
      <div className="flex items-center gap-3">
        <span className="flex items-center gap-1">
          <Users className="w-3.5 h-3.5" /> {campaign.members}
        </span>
        <span className="flex items-center gap-1">
          <Calendar className="w-3.5 h-3.5" /> {new Date(campaign.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
        </span>
      </div>
      <span className="group-hover:translate-x-1 transition-transform">
        <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600" />
      </span>
    </div>
  </motion.div>
);

const CampaignListItem = ({ campaign, onClick }) => (
  <motion.tr 
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    onClick={() => onClick(campaign.id)}
    className="group hover:bg-blue-50/50 cursor-pointer border-b border-gray-100 last:border-0 transition-colors"
  >
    <td className="py-4 pl-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-gray-100 rounded-lg text-gray-500 group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
          <LayoutGrid className="w-4 h-4" />
        </div>
        <div>
          <p className="font-semibold text-gray-900">{campaign.name}</p>
          <p className="text-xs text-gray-500">Role: {campaign.role}</p>
        </div>
      </div>
    </td>
    <td className="py-4 px-4">
      <StatusBadge status={campaign.status} />
    </td>
    <td className="py-4 px-4">
      <div className="w-32">
        <div className="flex justify-between text-xs mb-1">
          <span>{campaign.progress}%</span>
        </div>
        <div className="h-1.5 bg-gray-200 rounded-full">
          <div 
            className="h-full bg-blue-500 rounded-full"
            style={{ width: `${campaign.progress}%` }}
          />
        </div>
      </div>
    </td>
    <td className="py-4 px-4 text-sm text-gray-600">
      <div className="flex items-center gap-1">
        <Users className="w-3.5 h-3.5" />
        {campaign.members} members
      </div>
    </td>
    <td className="py-4 px-4 text-sm text-gray-600">
      <div className="flex items-center gap-1">
        <Calendar className="w-3.5 h-3.5" />
        {new Date(campaign.dueDate).toLocaleDateString()}
      </div>
    </td>
    <td className="py-4 pr-6 text-right">
      <ArrowRight className="w-4 h-4 text-gray-400 inline-block group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
    </td>
  </motion.tr>
);

// --- Main Component Export ---

export default function EmployeeCampaignsPage() {
  const router = useRouter();
  const [viewMode, setViewMode] = useState('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        const res = await fetch('/api/employees/campaign');
        if (!res.ok) {
          console.warn('API fetch failed, using mock data');
          setCampaigns(MOCK_CAMPAIGNS);
          return;
        }
        const data = await res.json();
        setCampaigns(data.campaigns || []);
      } catch (error) {
        console.error("Error:", error);
        setCampaigns(MOCK_CAMPAIGNS);
      } finally {
        setLoading(false);
      }
    };

    fetchCampaigns();
  }, []);

  const filteredCampaigns = campaigns.filter(campaign => {
    const matchesSearch = campaign.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || campaign.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleCampaignClick = (id) => {
    // Note: Ensure your routing matches this path
    router.push(`/employee/campaign/${id}`);
  };

  return (
    <div className="min-h-screen bg-gray-50/50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">My Campaigns</h1>
            <p className="text-gray-500 mt-1">Manage and track your assigned projects.</p>
          </div>
          
          <div className="flex gap-4">
            <div className="bg-white px-4 py-3 rounded-xl border border-gray-200 shadow-sm">
              <p className="text-xs text-gray-500 font-medium uppercase">Active</p>
              <p className="text-xl font-bold text-gray-900">
                {campaigns.filter(c => c.status === 'active').length}
              </p>
            </div>
            <div className="bg-white px-4 py-3 rounded-xl border border-gray-200 shadow-sm">
              <p className="text-xs text-gray-500 font-medium uppercase">Pending</p>
              <p className="text-xl font-bold text-gray-900">
                {campaigns.filter(c => c.status === 'urgent').length}
              </p>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200 mb-6 flex flex-col sm:flex-row gap-4 justify-between items-center">
          <div className="flex flex-1 gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search campaigns..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              />
            </div>
            
            <div className="relative">
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="appearance-none bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-xl px-4 py-2.5 pr-8 focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="urgent">Urgent</option>
                <option value="completed">Completed</option>
              </select>
              <Filter className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500 pointer-events-none" />
            </div>
          </div>

          <div className="flex bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md transition-all ${viewMode === 'list' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <ListIcon className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : filteredCampaigns.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-300">
            <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900">No campaigns found</h3>
            <p className="text-gray-500 mt-1">Try adjusting your search or filters.</p>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {viewMode === 'grid' ? (
              <motion.div 
                key="grid"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                {filteredCampaigns.map((campaign) => (
                  <CampaignCard 
                    key={campaign.id} 
                    campaign={campaign} 
                    onClick={handleCampaignClick} 
                  />
                ))}
              </motion.div>
            ) : (
              <motion.div 
                key="list"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden"
              >
                <table className="w-full text-left border-collapse">
                  <thead className="bg-gray-50/50 border-b border-gray-200">
                    <tr>
                      <th className="py-4 pl-6 font-semibold text-sm text-gray-600">Campaign</th>
                      <th className="py-4 px-4 font-semibold text-sm text-gray-600">Status</th>
                      <th className="py-4 px-4 font-semibold text-sm text-gray-600">Progress</th>
                      <th className="py-4 px-4 font-semibold text-sm text-gray-600">Team</th>
                      <th className="py-4 px-4 font-semibold text-sm text-gray-600">Due Date</th>
                      <th className="py-4 pr-6 font-semibold text-sm text-gray-600 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCampaigns.map((campaign) => (
                      <CampaignListItem 
                        key={campaign.id} 
                        campaign={campaign} 
                        onClick={handleCampaignClick} 
                      />
                    ))}
                  </tbody>
                </table>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
