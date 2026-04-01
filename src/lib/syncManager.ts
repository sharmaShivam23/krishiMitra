// src/lib/syncManager.ts
//
// Processes all pending offline queue items and sends them to the backend.
// Call syncOfflineQueue() when the device comes back online.
//
// After each successful sync, it fires a 'krishimitra:synced' custom event
// so the relevant page can re-fetch its data and show the real server response.

import {
  getPendingItems,
  removeFromQueue,
  incrementRetry,
  markFailed,
} from './offlineQueue';

// After this many failures for one item, we stop retrying it
const MAX_RETRIES = 3;

export interface SyncResult {
  synced: number; // How many actions were successfully sent
  failed: number; // How many are still failing (will try again next time)
}

/**
 * Sends all pending offline actions to the backend in chronological order.
 *
 * - On success  → removes the item from the queue, fires 'krishimitra:synced'
 * - On 4xx/5xx  → increments retry count; marks as 'failed' after MAX_RETRIES
 * - On network error → keeps as 'pending' to retry next time
 */
export async function syncOfflineQueue(): Promise<SyncResult> {
  const pendingItems = getPendingItems();
  if (pendingItems.length === 0) return { synced: 0, failed: 0 };

  let synced = 0;
  let failed = 0;

  // Process in chronological order (oldest action first)
  for (const item of pendingItems) {
    try {
      const res = await fetch(item.endpoint, {
        method: item.method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item.body),
      });

      if (res.ok) {
        // ✅ Success — clean up and tell the page to refresh its data
        removeFromQueue(item.id);
        synced++;

        window.dispatchEvent(
          new CustomEvent('krishimitra:synced', {
            detail: { feature: item.feature },
          })
        );
      } else {
        // ❌ Server rejected the request (e.g. 401, 400)
        // These server errors won't self-heal, so count retries
        incrementRetry(item.id);
        if (item.retryCount + 1 >= MAX_RETRIES) markFailed(item.id);
        failed++;
      }
    } catch {
      // 🌐 Network error — keep as 'pending', will retry when online again
      failed++;
    }
  }

  return { synced, failed };
}
