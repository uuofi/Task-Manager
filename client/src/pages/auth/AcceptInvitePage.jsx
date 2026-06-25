import { useMutation } from '@tanstack/react-query';
import { CheckCircle2, ClipboardPaste, XCircle } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { getErrorMessage } from '@/api/axiosClient';
import { invitationsApi, workspacesApi } from '@/api/misc.api';
import { FullPageLoader } from '@/components/common/FullPageLoader';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/authStore';

/**
 * Handles `/accept-invite?token=…` (URL flow) and manual code-paste flow.
 * The user must be authenticated; we exchange the token, refresh their
 * workspace list, switch to the joined workspace, and redirect to the app.
 */
export function AcceptInvitePage() {
  const [params] = useSearchParams();
  const urlToken = params.get('token');
  const navigate = useNavigate();
  const setProfile = useAuthStore((s) => s.setProfile);
  const setActiveWorkspace = useAuthStore((s) => s.setActiveWorkspace);
  const user = useAuthStore((s) => s.user);
  const ran = useRef(false);

  const [manualToken, setManualToken] = useState('');

  const accept = useMutation({
    mutationFn: (token) => invitationsApi.accept(token),
    onSuccess: async (data) => {
      const workspaces = await workspacesApi.mine();
      setProfile({ user, workspaces });
      if (data?.workspace?.id) setActiveWorkspace(data.workspace.id);
      setTimeout(() => navigate('/app', { replace: true }), 1400);
    },
    onError: () => {},
  });

  // Auto-accept when token comes from URL
  useEffect(() => {
    if (urlToken && !ran.current) {
      ran.current = true;
      accept.mutate(urlToken);
    }
  }, [urlToken]);

  // Success state
  if (accept.isSuccess) {
    return (
      <div className="bg-background flex min-h-dvh flex-col items-center justify-center gap-3 p-6 text-center">
        <CheckCircle2 className="text-primary size-12" />
        <h1 className="text-xl font-semibold">You&apos;re in! 🎉</h1>
        <p className="text-muted-foreground text-sm">Taking you to the workspace…</p>
      </div>
    );
  }

  // Error after URL-token auto-accept or manual submit
  if (accept.isError) {
    return (
      <div className="bg-background flex min-h-dvh flex-col items-center justify-center gap-3 p-6 text-center">
        <XCircle className="text-destructive size-12" />
        <h1 className="text-xl font-semibold">Couldn&apos;t accept invitation</h1>
        <p className="text-muted-foreground max-w-sm text-sm">{getErrorMessage(accept.error)}</p>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => accept.reset()}>Try again</Button>
          <Button onClick={() => navigate('/app')}>Go to app</Button>
        </div>
      </div>
    );
  }

  // Auto-accepting via URL token — show loader
  if (urlToken && !accept.isError) {
    return <FullPageLoader label="Accepting invitation…" />;
  }

  // Manual code entry (no URL token)
  return (
    <div className="bg-background flex min-h-dvh flex-col items-center justify-center p-6">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <ClipboardPaste className="text-primary mx-auto mb-3 size-10" />
          <h1 className="text-2xl font-bold">Accept Invitation</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Paste the invitation code you received in your email.
          </p>
        </div>

        <div className="space-y-3">
          <textarea
            className="border-input bg-background focus-visible:ring-ring w-full rounded-lg border px-3 py-2 font-mono text-sm focus-visible:ring-2 focus-visible:outline-none"
            rows={3}
            placeholder="Paste your invitation code here…"
            value={manualToken}
            onChange={(e) => setManualToken(e.target.value.trim())}
            autoFocus
          />
          <Button
            className="w-full"
            disabled={!manualToken || accept.isPending}
            onClick={() => accept.mutate(manualToken)}
          >
            {accept.isPending ? 'Accepting…' : 'Accept Invitation'}
          </Button>
          <Button variant="ghost" className="w-full" onClick={() => navigate('/app')}>
            Go to app instead
          </Button>
        </div>
      </div>
    </div>
  );
}

export default AcceptInvitePage;
