// ...existing code...
import { UserRoleBadge } from './UserRoleBadge';
import { AdminOnly } from './RoleBasedFeature';
import Link from 'next/link';

// Inside the navbar component, add near the user section:
// ...existing code...

{/* Add this where user info is displayed */}
{session && (
  <div className="flex items-center gap-3">
    <UserRoleBadge />
    <AdminOnly>
      <Link
        href="/admin"
        className="text-purple-600 hover:text-purple-800 text-sm font-medium"
      >
        Admin Panel
      </Link>
    </AdminOnly>
    {/* ...existing user menu code... */}
  </div>
)}

// ...existing code...

