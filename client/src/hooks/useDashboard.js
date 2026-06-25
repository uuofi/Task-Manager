import { useQuery } from '@tanstack/react-query';

import { dashboardApi } from '@/api/misc.api';
import { qk } from '@/lib/queryKeys';

export function useDashboard() {
  return useQuery({
    queryKey: qk.dashboard,
    queryFn: dashboardApi.get,
  });
}
