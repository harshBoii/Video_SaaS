"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export function useWorkspaceAuth() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userType, setUserType] = useState(null); // 'admin', 'employee', 'solo'

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/auth/me', { credentials: 'include' });
        
        if (!res.ok) {
          router.push('/login');
          return;
        }

        const data = await res.json();
        
        if (!data.success || !data.employee) {
          router.push('/login');
          return;
        }

        const employee = data.employee;
        
        // Determine user type
        const isAdmin = employee.is_admin || employee.role?.name?.toLowerCase() === 'admin';
        const isSolo = employee.role?.name === 'Solo_Creator';
        
        if (isAdmin) {
          setUserType('admin');
        } else if (isSolo) {
          setUserType('solo');
        } else {
          setUserType('employee');
        }

        setUser(employee);
      } catch (error) {
        console.error('Auth check failed:', error);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  return { user, loading, userType };
}
