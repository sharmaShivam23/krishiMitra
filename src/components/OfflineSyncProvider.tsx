// src/components/OfflineSyncProvider.tsx
//
// Mount this once in the root layout. It does two things:
//   1. Automatically syncs the offline queue whenever the internet is restored.
//   2. Shows a small status banner at the bottom of the screen:
//        • Offline  → "You are offline — actions saved locally"
//        • Syncing  → "Syncing N saved actions…"
//        • Done     → "All actions synced!" (disappears after 3 s)

'use client';

import { useEffect, useState } from 'react';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { syncOfflineQueue } from '@/lib/syncManager';
import { getPendingCount } from '@/lib/offlineQueue';

export default function OfflineSyncProvider() {
  const isOnline = useNetworkStatus();
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [justSynced, setJustSynced] = useState(false);

  // Refresh the pending counter from localStorage
  const refreshCount = () => setPendingCount(getPendingCount());

  // Listen for items being added to the queue (fired by addToQueue)
  useEffect(() => {
    refreshCount();
    window.addEventListener('krishimitra:queue-updated', refreshCount);
    return () => window.removeEventListener('krishimitra:queue-updated', refreshCount);
  }, []);

  // When the device comes back online, sync everything in the queue
  useEffect(() => {
    refreshCount();

    if (!isOnline) return;

    const doSync = async () => {
      const count = getPendingCount();
      if (count === 0) return;

      setIsSyncing(true);
      await syncOfflineQueue();
      setIsSyncing(false);
      refreshCount();

      setJustSynced(true);
      setTimeout(() => setJustSynced(false), 3000);
    };

    doSync();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOnline]);

  // Hide when there's nothing to show
  if (isOnline && pendingCount === 0 && !isSyncing && !justSynced) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '1.25rem',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 9999,
        pointerEvents: 'none',
      }}
    >
      {/* Offline indicator */}
      {!isOnline && (
        <div className="bg-amber-500 text-white px-5 py-2.5 rounded-full shadow-2xl text-sm font-semibold flex items-center gap-2.5 whitespace-nowrap">
          <span>📶</span>
          <span>
            {pendingCount > 0
              ? `Offline — ${pendingCount} action${pendingCount > 1 ? 's' : ''} queued`
              : 'You are offline — actions will be saved locally'}
          </span>
        </div>
      )}

      {/* Syncing indicator */}
      {isOnline && isSyncing && (
        <div className="bg-blue-600 text-white px-5 py-2.5 rounded-full shadow-2xl text-sm font-semibold flex items-center gap-2.5 whitespace-nowrap">
          <span className="inline-block animate-spin">↻</span>
          <span>
            Syncing {pendingCount} saved action{pendingCount > 1 ? 's' : ''}…
          </span>
        </div>
      )}

      {/* Success indicator */}
      {isOnline && justSynced && !isSyncing && (
        <div className="bg-emerald-600 text-white px-5 py-2.5 rounded-full shadow-2xl text-sm font-semibold flex items-center gap-2.5 whitespace-nowrap">
          <span>✓</span>
          <span>All actions synced!</span>
        </div>
      )}
    </div>
  );
}
