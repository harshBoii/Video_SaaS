// contexts/CampaignPermissionsContext.jsx
'use client';
import React, { createContext, useContext, useEffect, useState } from 'react';

const CampaignPermissionsContext = createContext(null);

export function CampaignPermissionsProvider({ campaignId, children }) {
  const [permissionsData, setPermissionsData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    let isMounted = true;

    async function fetchPermissions() {
      if (!campaignId) return;
      
      setLoading(true);
      try {
        const res = await fetch(`/api/auth/campaign?campaignId=${encodeURIComponent(campaignId)}`, {
          credentials: 'include',
        });

        if (!res.ok) {
          setPermissionsData({ permissions: [], isAdmin: false, role: null });
          return;
        }

        const data = await res.json();
        if (isMounted) {
          setPermissionsData(data);
        }
      } catch (error) {
        console.error('Failed to fetch permissions:', error);
        if (isMounted) {
          setPermissionsData({ permissions: [], isAdmin: false, role: null });
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchPermissions();

    return () => {
      isMounted = false;
    };
  }, [campaignId]);

  return (
    <CampaignPermissionsContext.Provider value={{ permissionsData, loading }}>
      {children}
    </CampaignPermissionsContext.Provider>
  );
}

export function useCampaignPermissions() {
  const context = useContext(CampaignPermissionsContext);
  if (!context) {
    return { 
      permissionsData: { permissions: [], isAdmin: false, role: 'guest' }, 
      loading: false 
    };

  }
  return context;
}
