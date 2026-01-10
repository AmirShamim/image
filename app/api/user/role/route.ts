import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/db/mongodb';
import User from '@/lib/models/User';
import { getRoleLimits } from '@/lib/middleware/roleMiddleware';

// Admin emails list - ADD YOUR EMAIL HERE
const ADMIN_EMAILS = ['your-email@example.com']; // Replace with your actual email

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    await dbConnect();
    let user = await User.findOne({ email: session.user.email });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Auto-upgrade to admin if email matches
    if (ADMIN_EMAILS.includes(session.user.email.toLowerCase()) && user.role !== 'admin') {
      user.role = 'admin';
      await user.save();
    }

    const limits = getRoleLimits(user.role);

    return NextResponse.json({
      role: user.role,
      limits,
      email: user.email
    });
  } catch (error) {
    console.error('Role fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch role' }, { status: 500 });
  }
}

