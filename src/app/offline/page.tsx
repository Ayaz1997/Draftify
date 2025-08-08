
import { AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function OfflinePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
      <AlertTriangle className="w-16 h-16 text-destructive mb-4" />
      <h1 className="text-3xl font-bold text-primary mb-2">You are Offline</h1>
      <p className="text-lg text-muted-foreground max-w-md mb-8">
        It seems you've lost your internet connection. This page can't be loaded while offline.
      </p>
      <p className="text-sm text-muted-foreground mb-6">
        Please check your connection and try again.
      </p>
      <Button asChild>
        <Link href="/">
          Go to Homepage
        </Link>
      </Button>
    </div>
  );
}
