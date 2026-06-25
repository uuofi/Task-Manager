import { Moon, Sun } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useTheme } from '@/contexts/ThemeContext';

/**
 * Animated light/dark toggle button.
 */
export function ThemeToggle({ className }) {
  const { resolvedTheme, toggleTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      className={className}
    >
      <Sun className="size-5 scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
      <Moon className="absolute size-5 scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
    </Button>
  );
}

export default ThemeToggle;
