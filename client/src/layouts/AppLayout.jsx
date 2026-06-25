import { Suspense, useState } from 'react';
import { Outlet } from 'react-router-dom';

import { FullPageLoader } from '@/components/common/FullPageLoader';
import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';

/**
 * Authenticated application shell: persistent sidebar (desktop) / drawer
 * (mobile) + sticky topbar, with routed content in the main region.
 */
export function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="bg-background flex min-h-dvh">
      <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onMenuClick={() => setMobileOpen(true)} />
        <main className="flex-1 overflow-x-hidden">
          <Suspense fallback={<FullPageLoader />}>
            <Outlet />
          </Suspense>
        </main>
      </div>
    </div>
  );
}

export default AppLayout;
