import { useTranslation } from 'react-i18next';

import { LegalPageLayout } from './LegalPageLayout';

export function IntellectualPropertyPage() {
  const { t } = useTranslation();
  const sections = t('legal.ip.sections', { returnObjects: true });

  return (
    <LegalPageLayout
      title={t('legal.ip.title')}
      lastUpdated={t('legal.lastUpdated')}
      intro={t('legal.ip.intro')}
      sections={sections}
    />
  );
}

export default IntellectualPropertyPage;
