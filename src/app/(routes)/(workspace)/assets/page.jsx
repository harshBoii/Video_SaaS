'use client';

import { useEffect, useState } from 'react';
import AssetLibrary from '@/app/components/general/assetManager.jsx/AssetLibrary';

export default function AssetsPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
      const response = await fetch('/api/auth/me', {
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (data.success) {
        setUser(data.employee);
      }
    } catch (error) {
      console.error('Failed to fetch user:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Unauthorized</h2>
          <a href="/login" className="text-primary hover:underline">
            Please login to continue
          </a>
        </div>
      </div>
    );
  }

  return (
    <AssetLibrary
      userRole={user.isAdmin ? 'admin' : 'employee'}
      userId={user.id}
      companyId={user.companyId}
    />
  );
}
