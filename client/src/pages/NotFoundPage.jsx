import { Link } from 'react-router-dom';

import { Button } from '@/components/ui/button';

export function NotFoundPage() {
  return (
    <div className="bg-background flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="text-primary text-6xl font-bold">404</p>
      <h1 className="text-2xl font-semibold">Page not found</h1>
      <p className="text-muted-foreground max-w-md">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <Button asChild>
        <Link to="/">Back home</Link>
      </Button>
    </div>
  );
}

export default NotFoundPage;
