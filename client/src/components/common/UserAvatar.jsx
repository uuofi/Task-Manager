import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { resolveAssetUrl } from '@/lib/config';
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
  // Uploaded avatars come back as "/uploads/.." — resolve them against the API
  // origin so they load in the split-domain deploy too.
  const src = resolveAssetUrl(user.avatar);
  return (
    <Avatar className={cn(className)}>
      {src ? <AvatarImage src={src} alt={user.name} /> : null}
      <AvatarFallback>{initials(user.name)}</AvatarFallback>
    </Avatar>
  );
}

export default UserAvatar;
