// src/hooks/useNetworkStatus.ts
//
// Returns true when the browser has network access, false when offline.
// Updates automatically when connectivity changes.

'use client';

import { useState, useEffect } from 'react';

export function useNetworkStatus(): boolean {
  // On the server (SSR) assume online; real value is set on the client
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof window !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);

    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);

    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  return isOnline;
}
