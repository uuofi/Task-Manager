import { useMutation } from '@tanstack/react-query';
import { LogOut, MailCheck, Settings, User as UserIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { UserAvatar } from '@/components/common/UserAvatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuthActions } from '@/contexts/AuthContext';
import { useAuthStore } from '@/store/authStore';

export function UserMenu() {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const { logout } = useAuthActions();
  const navigate = useNavigate();

  const logoutMutation = useMutation({
    mutationFn: logout,
    onSuccess: () => {
      toast.success('Signed out');
      navigate('/login', { replace: true });
    },
  });

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring/50">
        <UserAvatar user={user} className="size-9" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="flex flex-col">
          <span className="truncate">{user?.name}</span>
          <span className="text-muted-foreground truncate text-xs font-normal">{user?.email}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => navigate('/app/profile')}>
          <UserIcon /> {t('nav.profile')}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate('/app/settings')}>
          <Settings /> {t('nav.settings')}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate('/accept-invite')}>
          <MailCheck /> Accept Invitation
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          onClick={() => logoutMutation.mutate()}
          disabled={logoutMutation.isPending}
        >
          <LogOut /> {t('common.signOut')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default UserMenu;
