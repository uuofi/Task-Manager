import { useMutation } from '@tanstack/react-query';
import { Camera } from 'lucide-react';
import { useRef, useState } from 'react';
import { toast } from 'sonner';

import { getErrorMessage } from '@/api/axiosClient';
import { usersApi } from '@/api/misc.api';
import { PageHeader } from '@/components/common/PageHeader';
import { UserAvatar } from '@/components/common/UserAvatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import { useAuthStore } from '@/store/authStore';

export function ProfilePage() {
  const user = useAuthStore((s) => s.user);
  const updateUser = useAuthStore((s) => s.updateUser);
  const fileRef = useRef(null);
  const [profile, setProfile] = useState({ name: user?.name ?? '', bio: user?.bio ?? '', timezone: user?.timezone ?? 'UTC' });
  const [pw, setPw] = useState({ currentPassword: '', newPassword: '' });

  const saveProfile = useMutation({
    mutationFn: () => usersApi.updateProfile(profile),
    onSuccess: (u) => { updateUser(u); toast.success('Profile updated'); },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const uploadAvatar = useMutation({
    mutationFn: (file) => usersApi.uploadAvatar(file),
    onSuccess: (u) => { updateUser(u); toast.success('Avatar updated'); },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const changePassword = useMutation({
    mutationFn: () => usersApi.changePassword(pw),
    onSuccess: () => { toast.success('Password changed'); setPw({ currentPassword: '', newPassword: '' }); },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      <PageHeader title="Profile" description="Manage your personal information." />

      <Card>
        <CardContent className="flex items-center gap-4 py-6">
          <div className="relative">
            <UserAvatar user={user} className="size-16" />
            <button
              onClick={() => fileRef.current?.click()}
              className="bg-primary text-primary-foreground absolute -bottom-1 -right-1 grid size-7 place-items-center rounded-full"
            >
              {uploadAvatar.isPending ? <Spinner className="size-3.5" /> : <Camera className="size-3.5" />}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && uploadAvatar.mutate(e.target.files[0])}
            />
          </div>
          <div>
            <p className="font-semibold">{user?.name}</p>
            <p className="text-muted-foreground text-sm">{user?.email}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Personal info</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Name</Label>
            <Input value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Bio</Label>
            <Textarea rows={3} value={profile.bio} onChange={(e) => setProfile({ ...profile, bio: e.target.value })} placeholder="A little about you" />
          </div>
          <div className="space-y-2">
            <Label>Timezone</Label>
            <Input value={profile.timezone} onChange={(e) => setProfile({ ...profile, timezone: e.target.value })} />
          </div>
          <Button onClick={() => saveProfile.mutate()} disabled={saveProfile.isPending}>
            {saveProfile.isPending && <Spinner />} Save changes
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Change password</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Current password</Label>
            <Input type="password" value={pw.currentPassword} onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>New password</Label>
            <Input type="password" value={pw.newPassword} onChange={(e) => setPw({ ...pw, newPassword: e.target.value })} />
          </div>
          <Button variant="outline" onClick={() => changePassword.mutate()} disabled={!pw.currentPassword || !pw.newPassword || changePassword.isPending}>
            {changePassword.isPending && <Spinner />} Update password
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default ProfilePage;
