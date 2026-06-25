import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { RouterProvider } from 'react-router-dom';

import { Toaster } from '@/components/ui/sonner';
import { AuthProvider } from '@/contexts/AuthContext';
import { SocketProvider } from '@/contexts/SocketContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { queryClient } from '@/lib/queryClient';
import { router } from '@/routes';

/**
 * Keeps the document language + direction (LTR/RTL) in sync with the active
 * i18n language so Arabic renders right-to-left.
 */
function useDocumentDirection() {
  const { i18n } = useTranslation();
  useEffect(() => {
    const apply = (lng) => {
      const dir = i18n.dir(lng);
      document.documentElement.lang = lng;
      document.documentElement.dir = dir;
    };
    apply(i18n.language);
    i18n.on('languageChanged', apply);
    return () => i18n.off('languageChanged', apply);
  }, [i18n]);
}

/**
 * Root application component: composes global providers (theme, data fetching,
 * routing) and mounts the toast container.
 */
function App() {
  useDocumentDirection();

  return (
    <ThemeProvider defaultTheme="system">
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <SocketProvider>
            <RouterProvider router={router} />
            <Toaster />
            <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-left" />
          </SocketProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
