import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Languages, Monitor, Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { getErrorMessage } from '@/api/axiosClient';
import { workspacesApi } from '@/api/misc.api';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';

const THEMES = [
  { key: 'light', labelKey: 'settings.light', icon: Sun },
  { key: 'dark', labelKey: 'settings.dark', icon: Moon },
  { key: 'system', labelKey: 'settings.system', icon: Monitor },
];

const LANGS = [
  { key: 'en', label: 'English' },
  { key: 'ar', label: 'العربية' },
];

export function SettingsPage() {
  const qc = useQueryClient();
  const { t, i18n } = useTranslation();
  const { theme, setTheme } = useTheme();
  const { data: workspace } = useQuery({ queryKey: ['workspace', 'current'], queryFn: workspacesApi.current });
  const [name, setName] = useState('');

  useEffect(() => {
    if (workspace) setName(workspace.name);
  }, [workspace]);

  const save = useMutation({
    mutationFn: () => workspacesApi.update({ name }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['workspace'] });
      toast.success('Workspace updated');
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      <PageHeader title={t('settings.title')} description={t('settings.subtitle')} />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Languages className="size-4" /> {t('settings.language')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            {LANGS.map((l) => (
              <button
                key={l.key}
                onClick={() => i18n.changeLanguage(l.key)}
                className={cn(
                  'rounded-lg border p-4 text-sm font-medium transition-colors',
                  i18n.language?.startsWith(l.key)
                    ? 'border-primary bg-primary/5 text-primary'
                    : 'hover:bg-accent',
                )}
              >
                {l.label}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">{t('settings.appearance')}</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3">
            {THEMES.map((opt) => {
              const Icon = opt.icon;
              return (
                <button
                  key={opt.key}
                  onClick={() => setTheme(opt.key)}
                  className={cn(
                    'flex flex-col items-center gap-2 rounded-lg border p-4 text-sm font-medium transition-colors',
                    theme === opt.key ? 'border-primary bg-primary/5 text-primary' : 'hover:bg-accent',
                  )}
                >
                  <Icon className="size-5" />
                  {t(opt.labelKey)}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">{t('settings.workspace')}</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>{t('settings.workspaceName')}</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <Button onClick={() => save.mutate()} disabled={save.isPending || !name}>
            {save.isPending && <Spinner />} {t('common.save')}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default SettingsPage;
