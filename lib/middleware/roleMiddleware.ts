import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/db/mongodb';
import User from '@/lib/models/User';

export type UserRole = 'free' | 'premium' | 'admin';

interface RoleCheckResult {
  authorized: boolean;
  user: any | null;
  error?: string;
}

export async function checkUserRole(
  requiredRoles: UserRole[]
): Promise<RoleCheckResult> {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return { authorized: false, user: null, error: 'Not authenticated' };
    }

    await dbConnect();
    const user = await User.findOne({ email: session.user.email });

    if (!user) {
      return { authorized: false, user: null, error: 'User not found' };
    }

    const hasRequiredRole = requiredRoles.includes(user.role as UserRole);

    return {
      authorized: hasRequiredRole,
      user,
      error: hasRequiredRole ? undefined : 'Insufficient permissions'
    };
  } catch (error) {
    return { authorized: false, user: null, error: 'Authorization check failed' };
  }
}

export function withRoleCheck(requiredRoles: UserRole[]) {
  return async function(req: NextRequest, handler: () => Promise<NextResponse>) {
    const { authorized, error } = await checkUserRole(requiredRoles);

    if (!authorized) {
      return NextResponse.json(
        { error: error || 'Unauthorized' },
        { status: 403 }
      );
    }

    return handler();
  };
}

export function getRoleLimits(role: UserRole) {
  const limits = {
    free: {
      maxFileSize: 5 * 1024 * 1024, // 5MB
      maxBatchSize: 5,
      maxDailyConversions: 10,
      features: ['basic-resize', 'basic-formats']
    },
    premium: {
      maxFileSize: 50 * 1024 * 1024, // 50MB
      maxBatchSize: 50,
      maxDailyConversions: 500,
      features: ['basic-resize', 'basic-formats', 'advanced-resize', 'all-formats', 'batch-processing']
    },
    admin: {
      maxFileSize: 100 * 1024 * 1024, // 100MB
      maxBatchSize: 100,
      maxDailyConversions: Infinity,
      features: ['all']
    }
  };

  return limits[role] || limits.free;
}

