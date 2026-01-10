'use client';

import { useUserRole, UserRole } from '@/lib/hooks/useUserRole';
import { ReactNode } from 'react';

interface RoleBasedFeatureProps {
  allowedRoles: UserRole[];
  children: ReactNode;
  fallback?: ReactNode;
}

export function RoleBasedFeature({
  allowedRoles,
  children,
  fallback = null
}: RoleBasedFeatureProps) {
  const { role, isLoading } = useUserRole();

  if (isLoading) {
    return <div className="animate-pulse bg-gray-200 rounded h-8 w-full" />;
  }

  if (allowedRoles.includes(role)) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
}

interface AdminOnlyProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export function AdminOnly({ children, fallback }: AdminOnlyProps) {
  return (
    <RoleBasedFeature allowedRoles={['admin']} fallback={fallback}>
      {children}
    </RoleBasedFeature>
  );
}

interface PremiumOnlyProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export function PremiumOnly({ children, fallback }: PremiumOnlyProps) {
  return (
    <RoleBasedFeature allowedRoles={['premium', 'admin']} fallback={fallback}>
      {children}
    </RoleBasedFeature>
  );
}

