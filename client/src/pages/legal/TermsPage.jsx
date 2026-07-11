import { useTranslation } from 'react-i18next';

import { LegalPageLayout } from './LegalPageLayout';

export function TermsPage() {
  const { t } = useTranslation();
  const sections = t('legal.terms.sections', { returnObjects: true });

  return (
    <LegalPageLayout
      title={t('legal.terms.title')}
      lastUpdated={t('legal.lastUpdated')}
      intro={t('legal.terms.intro')}
      sections={sections}
    />
  );
}

export default TermsPage;
