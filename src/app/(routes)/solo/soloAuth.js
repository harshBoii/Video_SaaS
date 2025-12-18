"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export function useSoloAuth() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

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


        // Check if user is admin
        const isSolo = employee.role?.name === 'Solo_Creator';
        
        if (!isSolo) {
          router.push('/login');
          return;
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
  }, []); // Empty dependency array - runs once on mount

  return { user, loading };
}
