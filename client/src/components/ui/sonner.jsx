import { Toaster as Sonner } from 'sonner';

import { useTheme } from '@/contexts/ThemeContext';

/**
 * Theme-aware toast container. Mount once near the app root.
 */
function Toaster(props) {
  const { resolvedTheme } = useTheme();

  return (
    <Sonner
      theme={resolvedTheme}
      className="toaster group"
      richColors
      closeButton
      toastOptions={{
        classNames: {
          toast:
            'group toast group-[.toaster]:bg-card group-[.toaster]:text-card-foreground group-[.toaster]:border group-[.toaster]:shadow-lg',
          description: 'group-[.toast]:text-muted-foreground',
        },
      }}
      {...props}
    />
  );
}

export { Toaster };
