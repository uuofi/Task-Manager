import { Navigate, Outlet, useLocation } from 'react-router-dom';

import { FullPageLoader } from '@/components/common/FullPageLoader';
import { useAuthStore } from '@/store/authStore';

/**
 * Guards authenticated areas. While the initial silent-refresh is in flight we
 * show a loader (so we don't briefly redirect an authenticated user to login).
 */
export function ProtectedRoute() {
  const location = useLocation();
  const { isAuthenticated, bootstrapStatus } = useAuthStore();

  if (bootstrapStatus === 'pending') return <FullPageLoader label="Restoring your session…" />;
  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  return <Outlet />;
}

/**
 * For auth pages (login/register): redirects already-authenticated users to the
 * app instead of showing the form again.
 */
export function PublicOnlyRoute() {
  const { isAuthenticated, bootstrapStatus } = useAuthStore();

  if (bootstrapStatus === 'pending') return <FullPageLoader />;
  if (isAuthenticated) return <Navigate to="/app" replace />;
  return <Outlet />;
}
