'use client';
import { useState } from 'react';
import { CampaignPermissionsProvider } from '@/app/context/permissionContext';
import ProtectedButton from '../components/general/protectedButton';
import CreateCollectionModal from '../components/video/collection/CreateCollectionModal';

export default function ShareButtonWithContext({ 
  campaignId, 
  preSelectedVideos, 
  onClose 
}) {
  const [isModalOpen, setIsModalOpen] = useState(true); // Always open

  return (
    <CampaignPermissionsProvider campaignId={campaignId}>
      <ProtectedButton
        requiredPermissions={['Share Videos', 'Manage Campaigns']}
        onClick={() => {}} // Modal already open
        className="sr-only" // Hidden - permissions only
      >
        {/* Permissions gate - invisible */}
      </ProtectedButton>

      <CreateCollectionModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setTimeout(onClose, 300);
        }}
        campaignId={campaignId}
        preSelectedVideos={preSelectedVideos}
      />
    </CampaignPermissionsProvider>
  );
}
