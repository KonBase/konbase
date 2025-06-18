'use client';

import {
  useRouter as useNextRouter,
  usePathname,
  useSearchParams,
} from 'next/navigation';
import { useCallback } from 'react';

export function useRouter() {
  const router = useNextRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const navigate = useCallback(
    (to: string, options?: { replace?: boolean }) => {
      if (options?.replace) {
        router.replace(to);
      } else {
        router.push(to);
      }
    },
    [router],
  );

  return {
    pathname,
    searchParams,
    push: router.push,
    replace: router.replace,
    navigate,
    back: router.back,
    forward: router.forward,
    refresh: router.refresh,
    prefetch: router.prefetch,
  };
}

export { usePathname, useSearchParams } from 'next/navigation';
