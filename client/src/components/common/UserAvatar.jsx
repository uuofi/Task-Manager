import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { initials } from '@/lib/format';
import { cn } from '@/lib/utils';

/** Avatar that resolves the uploaded image or falls back to initials. */
export function UserAvatar({ user, className }) {
  if (!user) {
    return (
      <Avatar className={className}>
        <AvatarFallback>?</AvatarFallback>
      </Avatar>
    );
  }
  const src = user.avatar?.startsWith('/uploads/') ? user.avatar : user.avatar || undefined;
  return (
    <Avatar className={cn(className)}>
      {src ? <AvatarImage src={src} alt={user.name} /> : null}
      <AvatarFallback>{initials(user.name)}</AvatarFallback>
    </Avatar>
  );
}

export default UserAvatar;
