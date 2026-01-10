'use client';

import { useUserRole } from '@/lib/hooks/useUserRole';
import { Crown, Shield, User } from 'lucide-react';

export function UserRoleBadge() {
  const { role, isLoading } = useUserRole();

  if (isLoading) {
    return <div className="animate-pulse w-16 h-6 bg-gray-200 rounded" />;
  }

  const badges = {
    admin: {
      icon: Shield,
      text: 'Admin',
      className: 'bg-purple-100 text-purple-800 border-purple-200'
    },
    premium: {
      icon: Crown,
      text: 'Premium',
      className: 'bg-yellow-100 text-yellow-800 border-yellow-200'
    },
    free: {
      icon: User,
      text: 'Free',
      className: 'bg-gray-100 text-gray-800 border-gray-200'
    }
  };

  const badge = badges[role];
  const Icon = badge.icon;

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${badge.className}`}>
      <Icon className="w-3 h-3" />
      {badge.text}
    </span>
  );
}

