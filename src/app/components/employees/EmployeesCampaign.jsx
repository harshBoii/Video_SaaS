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
    active: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
    urgent: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    completed: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20',
    archived: 'bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20'
  };

  const icons = {
    active: <PlayCircle className="w-3 h-3" />,
    urgent: <AlertCircle className="w-3 h-3" />,
    completed: <CheckCircle2 className="w-3 h-3" />,
    archived: <Clock className="w-3 h-3" />
  };

  const safeStatus = status ? status.toLowerCase() : 'active';

  return (
    <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${styles[safeStatus] || styles.active}`}>
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
    className="group backdrop-blur-xl bg-white/10 dark:bg-black/10 border border-black/10 dark:border-white/10 rounded-2xl p-5 cursor-pointer hover:shadow-xl hover:border-primary/50 transition-all duration-300"
  >
    <div className="flex justify-between items-start mb-4">
      <div className="p-2.5 bg-primary/10 rounded-xl text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
        <LayoutGrid className="w-6 h-6" />
      </div>
      <StatusBadge status={campaign.status} />
    </div>

    <h3 className="text-lg font-bold text-foreground mb-1 group-hover:text-primary transition-colors">
      {campaign.name}
    </h3>
    <p className="text-sm text-muted-foreground mb-4">Role: <span className="font-medium text-foreground">{campaign.role}</span></p>

    {/* Progress Bar */}
    <div className="mb-4">
      <div className="flex justify-between text-xs mb-1.5">
        <span className="text-muted-foreground font-medium">Progress</span>
        <span className="text-foreground font-bold">{campaign.progress}%</span>
      </div>
      <div className="h-2 bg-white/10 dark:bg-white/5 rounded-full overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-primary to-primary/80 rounded-full"
          style={{ width: `${campaign.progress}%` }}
        />
      </div>
    </div>

    <div className="flex items-center justify-between pt-4 border-t border-white/10 text-xs text-muted-foreground">
      <div className="flex items-center gap-3">
        <span className="flex items-center gap-1">
          <Users className="w-3.5 h-3.5" /> {campaign.members}
        </span>
        <span className="flex items-center gap-1">
          <Calendar className="w-3.5 h-3.5" /> {new Date(campaign.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
        </span>
      </div>
      <span className="group-hover:translate-x-1 transition-transform">
        <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary" />
      </span>
    </div>
  </motion.div>
);

const CampaignListItem = ({ campaign, onClick }) => (
  <motion.tr 
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    onClick={() => onClick(campaign.id)}
    className="group hover:bg-white/5 dark:hover:bg-white/5 cursor-pointer border-b border-white/10 last:border-0 transition-colors"
  >
    <td className="py-4 pl-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-white/10 dark:bg-white/5 rounded-lg text-muted-foreground group-hover:bg-primary/20 group-hover:text-primary transition-colors">
          <LayoutGrid className="w-4 h-4" />
        </div>
        <div>
          <p className="font-semibold text-foreground">{campaign.name}</p>
          <p className="text-xs text-muted-foreground">Role: {campaign.role}</p>
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
        <div className="h-1.5 bg-white/10 dark:bg-white/5 rounded-full">
          <div 
            className="h-full bg-primary rounded-full"
            style={{ width: `${campaign.progress}%` }}
          />
        </div>
      </div>
    </td>
    <td className="py-4 px-4 text-sm text-muted-foreground">
      <div className="flex items-center gap-1">
        <Users className="w-3.5 h-3.5" />
        {campaign.members} members
      </div>
    </td>
    <td className="py-4 px-4 text-sm text-muted-foreground">
      <div className="flex items-center gap-1">
        <Calendar className="w-3.5 h-3.5" />
        {new Date(campaign.dueDate).toLocaleDateString()}
      </div>
    </td>
    <td className="py-4 pr-6 text-right">
      <ArrowRight className="w-4 h-4 text-muted-foreground inline-block group-hover:text-primary group-hover:translate-x-1 transition-all" />
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
    router.push(`/campaign/${id}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground tracking-tight">My Campaigns</h1>
            <p className="text-muted-foreground mt-1">Manage and track your assigned projects.</p>
          </div>
          
          <div className="flex gap-4">
            <div className="backdrop-blur-xl bg-white/10 dark:bg-black/10 border border-black/10 dark:border-white/10 px-4 py-3 rounded-xl shadow-sm">
              <p className="text-xs text-muted-foreground font-medium uppercase">Active</p>
              <p className="text-xl font-bold text-foreground">
                {campaigns.filter(c => c.status === 'active').length}
              </p>
            </div>
            <div className="backdrop-blur-xl bg-white/10 dark:bg-black/10 border border-black/10 dark:border-white/10 px-4 py-3 rounded-xl shadow-sm">
              <p className="text-xs text-muted-foreground font-medium uppercase">Pending</p>
              <p className="text-xl font-bold text-foreground">
                {campaigns.filter(c => c.status === 'urgent').length}
              </p>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="backdrop-blur-xl bg-white/10 dark:bg-black/10 border border-black/10 dark:border-white/10 p-4 rounded-xl shadow-sm mb-6 flex flex-col sm:flex-row gap-4 justify-between items-center">
          <div className="flex flex-1 gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search campaigns..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 backdrop-blur-xl bg-white/5 dark:bg-black/20 border border-black/10 dark:border-white/10 rounded-lg text-foreground placeholder:text-muted-foreground text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary/50 outline-none transition-all"
              />
            </div>
            
            <div className="relative">
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="appearance-none backdrop-blur-xl bg-white/5 dark:bg-black/20 border border-black/10 dark:border-white/10 text-foreground text-sm rounded-lg px-4 py-2.5 pr-8 focus:ring-2 focus:ring-primary/50 outline-none cursor-pointer"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="urgent">Urgent</option>
                <option value="completed">Completed</option>
              </select>
              <Filter className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500 pointer-events-none" />
            </div>
          </div>

          <div className="flex bg-white/10 dark:bg-white/5 p-1 rounded-lg">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md transition-all ${viewMode === 'grid' ? 'bg-black/10 dark:bg-white/10 text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md transition-all ${viewMode === 'list' ? 'bg-black/10 dark:bg-white/10 text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <ListIcon className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : filteredCampaigns.length === 0 ? (
          <div className="text-center py-20 backdrop-blur-xl bg-white/10 dark:bg-black/10 border border-black/10 dark:border-white/10 rounded-2xl">
            <div className="bg-white/10 dark:bg-white/5 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium text-foreground">No campaigns found</h3>
            <p className="text-muted-foreground mt-1">Try adjusting your search or filters.</p>
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
                className="backdrop-blur-xl bg-white/10 dark:bg-black/10 border border-black/10 dark:border-white/10 rounded-xl shadow-sm overflow-hidden"
              >
                <table className="w-full text-left border-collapse">
                  <thead className="bg-white/5 dark:bg-white/5 border-b border-white/10">
                    <tr>
                      <th className="py-4 pl-6 font-semibold text-sm text-muted-foreground">Campaign</th>
                      <th className="py-4 px-4 font-semibold text-sm text-muted-foreground">Status</th>
                      <th className="py-4 px-4 font-semibold text-sm text-muted-foreground">Progress</th>
                      <th className="py-4 px-4 font-semibold text-sm text-muted-foreground">Team</th>
                      <th className="py-4 px-4 font-semibold text-sm text-muted-foreground">Due Date</th>
                      <th className="py-4 pr-6 font-semibold text-sm text-muted-foreground text-right">Action</th>
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
