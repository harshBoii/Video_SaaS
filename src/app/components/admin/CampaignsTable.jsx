'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Image from 'next/image';
import Swal from 'sweetalert2';
import { Search, Loader2 } from 'lucide-react';
import CampaignInsightsModal from './CampaignMembersModal';
import EditCampaignModal from './EditCampaignModal';
import styles from './CampaignsTable.module.css';
import { FiCameraOff, FiCheck, FiCheckCircle, FiClock,FiThumbsUp,FiWatch} from 'react-icons/fi';
import { Zap } from 'lucide-react';
import Link from 'next/link';
import LoadingGlass from '../LoadingGlass';
// A helper component for the main loading state
const TableLoadingSpinner = () => (
    <tr>
        <td colSpan="5" className="text-center py-20">
            <div className="flex justify-center items-center">
                <LoadingGlass className="h-10 w-10 animate-spin text-blue-600" />
            </div>
        </td>
    </tr>
);

export default function CampaignsTable() {
    // --- STATE MANAGEMENT ---
    const [campaigns, setCampaigns] = useState([]); // Will hold data fetched from the API
    const [isLoading, setIsLoading] = useState(true); // For initial data fetch
    const [error, setError] = useState(null); // To store any fetch errors
    
    // State for modals and search
    const [viewingCampaign, setViewingCampaign] = useState(null);
    const [editingCampaign, setEditingCampaign] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');

    // --- DATA FETCHING ---
    const fetchCampaigns = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch('/api/campaigns'); // Your endpoint to get all campaigns
            if (!response.ok) {
                throw new Error('Failed to fetch campaigns.');
            }
            const data = await response.json();
            console.log(data)
            setCampaigns(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    // Fetch data when the component mounts
    useEffect(() => {
        fetchCampaigns();
    }, []);

    // --- MEMOIZED FILTERING (No Changes Needed) ---
    const filteredData = useMemo(() => {
        if (!searchQuery) {
            return campaigns; 
        }
        return campaigns.filter(campaign =>
            campaign.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [campaigns, searchQuery]);

    // --- API HANDLERS (Rewritten for API interaction) ---

    // Handler to update a campaign
    const handleUpdateCampaign = async () => {
        // The actual API call is now handled inside EditCampaignModal.
        // This function's only job is to close the modal and refetch the data.
        setEditingCampaign(null); // Close the modal
        await fetchCampaigns();   // Refetch data to show the update
    };
    
    // Handler to delete a campaign
    const handleDeleteCampaign = async () => {
        // The actual API call is now handled inside EditCampaignModal.
        setEditingCampaign(null); // Close the modal
        await fetchCampaigns();   // Refetch data to show the change
    };

    return (
        <>
            <div className={styles.tableContainer}>
                <div className="md:flex md:items-center md:justify-between mb-4 sticky top-135 bg-white rounded-2xl">
                    <div>
                        <h3 className={styles.tableTitle}>Campaigns List</h3>
                        <p className="text-sm text-gray-500">
                            Search for a campaign or click a row to view insights.
                        </p>
                    </div>
                    <div className="relative mt-4 md:mt-0 w-full max-w-md">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <Search className="h-5 w-5 text-blue-400" />
                    </div>
                    <input
                        type="text"
                        placeholder="Search campaigns..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="
                        block w-full rounded-xl 
                        border border-blue-200 
                        bg-gradient-to-r from-blue-50 to-blue-100 
                        pl-10 pr-4 py-2 
                        text-gray-700 placeholder-gray-400 
                        shadow-md 
                        focus:border-blue-400 focus:ring-2 focus:ring-blue-300 focus:outline-none 
                        transition-all duration-300
                        "
                    />
                    </div>
                </div>

                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>Campaign Name</th>
                            <th>Total Members</th>
                            <th>Verified</th>
                            <th>Pending</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <TableLoadingSpinner />
                        ) : error ? (
                            <tr><td colSpan="5" className="text-center py-8 text-red-500">Error: {error}</td></tr>
                        ) : filteredData.length > 0 ? (
                            filteredData.map((campaign) => (
                                <tr 
                                    key={campaign.id} 
                                    className={`${styles.clickableRow} hover:bg-gray-50 transition-colors duration-150 hover:text-emerald-300`}
                                    onClick={() => setViewingCampaign(campaign)}
                                    tabIndex={0}
                                    onKeyDown={(e) => e.key === 'Enter' && setViewingCampaign(campaign)}
                                >
                                    <td>
                                        <div className={styles.userCell}>
                                            <Image 
                                                src={`https://ui-avatars.com/api/?name=${campaign.name.replace(/\s+/g, '+')}&background=random`} 
                                                alt={`${campaign.name} logo`}
                                                width={32} 
                                                height={32} 
                                                className={styles.avatar}
                                                unoptimized={true}
                                            />
                                            <span className="font-medium text-gray-800">{campaign.name}</span>
                                            <span className="relative group inline-flex items-center">
                                            {campaign.status === "Active" ? (
                                                <Zap className="cursor-pointer h-4 text-green-600" />
                                            ) : campaign.status === "Upcoming" ? (
                                                <FiClock className="cursor-pointer text-yellow-800" />
                                            ) : campaign.status === "Finished" ? (
                                                <FiCheckCircle className="cursor-pointer text-gray-800 " />
                                            ) : (
                                                <FiCameraOff className="cursor-pointer " />
                                            )}

                                            {/* Tooltip */}
                                            <span className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 
                                                            whitespace-nowrap px-2 py-1 rounded bg-gray-800 text-white text-xs 
                                                            opacity-0 group-hover:opacity-100 transition-opacity">
                                                {campaign.status === "Active"
                                                ? "Active"
                                                : campaign.status === "Upcoming"
                                                ? "Upcoming"
                                                : campaign.status === "Finished"
                                                ? "Finished"
                                                : "Unknown"}
                                            </span>
                                            </span>
                                        </div>
                                    </td>
                                    <td>{Number(campaign.totalVerified) + Number(campaign.notVerified)} Members</td>
                                    <td className="text-green-600 font-semibold ">{campaign.totalVerified}</td>
                                    <td className="text-amber-600 font-semibold ">{campaign.notVerified}</td>
                                    <td>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setEditingCampaign(campaign);
                                            }}
                                            className="font-medium text-blue-600 hover:text-blue-800 px-3 py-1 rounded-md hover:bg-blue-100 transition-colors"
                                        >
                                            Edit
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="5" className="text-center py-8 text-gray-500">
                                    {searchQuery ? `No campaigns found for "${searchQuery}"` : "No campaigns found."}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {viewingCampaign && (
                <CampaignInsightsModal 
                    campaignId={viewingCampaign.id}
                    onClose={() => setViewingCampaign(null)}
                />
            )}
            
            {editingCampaign && (
                <EditCampaignModal
                    campaign={editingCampaign}
                    onClose={() => setEditingCampaign(null)}
                    // The onSuccess prop will be called by the modal after a successful update or delete
                    onSuccess={handleUpdateCampaign} // Re-using the same handler for simplicity
                />
            )}
        </>
    );
};
