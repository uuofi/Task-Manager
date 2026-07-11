import { useTranslation } from 'react-i18next';

import { LegalPageLayout } from './LegalPageLayout';

export function PrivacyPolicyPage() {
  const { t } = useTranslation();
  const sections = t('legal.privacy.sections', { returnObjects: true });

  return (
    <LegalPageLayout
      title={t('legal.privacy.title')}
      lastUpdated={t('legal.lastUpdated')}
      intro={t('legal.privacy.intro')}
      sections={sections}
    />
  );
}

export default PrivacyPolicyPage;
