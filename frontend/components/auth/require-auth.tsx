'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/stores/auth';
import LoadingSpinner from '@/components/ui/loading-spinner';

interface RequireAuthProps {
  children: React.ReactNode;
}

export default function RequireAuth({ children }: RequireAuthProps) {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        // Redirect to login page with return URL
        router.push(`/auth/login?returnUrl=${encodeURIComponent(pathname)}`);
      } else {
        setIsLoading(false);
      }
    }
  }, [isAuthenticated, authLoading, router, pathname]);

  if (isLoading || authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size={48} />
      </div>
    );
  }

  return <>{children}</>;
}
