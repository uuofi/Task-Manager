import { Languages } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';

/**
 * Toggles between English and Arabic. The label shows the language you'll
 * switch TO, so it reads naturally in the current language.
 */
export function LanguageToggle({ variant = 'ghost', showLabel = true, className }) {
  const { i18n } = useTranslation();
  const isArabic = i18n.language?.startsWith('ar');
  const next = isArabic ? 'en' : 'ar';
  const label = isArabic ? 'English' : 'العربية';

  return (
    <Button
      variant={variant}
      size={showLabel ? 'sm' : 'icon'}
      onClick={() => i18n.changeLanguage(next)}
      aria-label={`Switch language to ${label}`}
      className={className}
    >
      <Languages className="size-4" />
      {showLabel && label}
    </Button>
  );
}

export default LanguageToggle;
