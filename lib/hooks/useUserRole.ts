'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

export type UserRole = 'free' | 'premium' | 'admin';

interface UserRoleData {
  role: UserRole;
  isAdmin: boolean;
  isPremium: boolean;
  isLoading: boolean;
  limits: {
    maxFileSize: number;
    maxBatchSize: number;
    maxDailyConversions: number;
    features: string[];
  };
}

export function useUserRole(): UserRoleData {
  const { data: session, status } = useSession();
  const [roleData, setRoleData] = useState<UserRoleData>({
    role: 'free',
    isAdmin: false,
    isPremium: false,
    isLoading: true,
    limits: {
      maxFileSize: 5 * 1024 * 1024,
      maxBatchSize: 5,
      maxDailyConversions: 10,
      features: ['basic-resize', 'basic-formats']
    }
  });

  useEffect(() => {
    async function fetchRole() {
      if (status === 'loading') return;

      if (!session?.user?.email) {
        setRoleData(prev => ({ ...prev, isLoading: false }));
        return;
      }

      try {
        const res = await fetch('/api/user/role');
        if (res.ok) {
          const data = await res.json();
          setRoleData({
            role: data.role,
            isAdmin: data.role === 'admin',
            isPremium: data.role === 'premium' || data.role === 'admin',
            isLoading: false,
            limits: data.limits
          });
        }
      } catch (error) {
        console.error('Failed to fetch user role:', error);
        setRoleData(prev => ({ ...prev, isLoading: false }));
      }
    }

    fetchRole();
  }, [session, status]);

  return roleData;
}

