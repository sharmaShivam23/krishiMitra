// src/lib/offlineQueue.ts
//
// Manages a persistent queue of pending API actions in localStorage.
// When the user is offline, actions are saved here instead of being sent.
// The syncManager then reads this queue and sends everything when online.

const QUEUE_KEY = 'krishimitra_offline_queue';

// Which features support offline queuing
export type QueueFeature = 'community' | 'listing' | 'selling-pool';

export interface QueueItem {
  id: string;            // Unique ID for this item
  timestamp: number;     // When it was queued (milliseconds)
  feature: QueueFeature; // Which feature created this action
  endpoint: string;      // API endpoint, e.g. '/api/community'
  method: string;        // HTTP method, e.g. 'POST'
  body: object;          // The request body to send
  retryCount: number;    // How many sync attempts have been made
  status: 'pending' | 'failed'; // 'failed' = gave up after too many retries
}

// ─── Internal helpers (not exported) ──────────────────────────────────────────

function getQueue(): QueueItem[] {
  if (typeof window === 'undefined') return []; // SSR guard
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveQueue(queue: QueueItem[]): void {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Add a new action to the offline queue.
 * Returns the unique ID of the queued item.
 *
 * Example:
 *   addToQueue('community', '/api/community', 'POST', { title, content, ... })
 */
export function addToQueue(
  feature: QueueFeature,
  endpoint: string,
  method: string,
  body: object
): string {
  const id = `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const newItem: QueueItem = {
    id,
    timestamp: Date.now(),
    feature,
    endpoint,
    method,
    body,
    retryCount: 0,
    status: 'pending',
  };

  const queue = getQueue();
  queue.push(newItem);
  saveQueue(queue);

  // Notify OfflineSyncProvider that the count changed
  window.dispatchEvent(new Event('krishimitra:queue-updated'));

  return id;
}

/** Remove an item after it was successfully synced with the backend. */
export function removeFromQueue(id: string): void {
  saveQueue(getQueue().filter((item) => item.id !== id));
}

/** Increment the retry counter for an item (called after a failed sync attempt). */
export function incrementRetry(id: string): void {
  saveQueue(
    getQueue().map((item) =>
      item.id === id ? { ...item, retryCount: item.retryCount + 1 } : item
    )
  );
}

/** Mark an item as permanently failed so it stops being retried. */
export function markFailed(id: string): void {
  saveQueue(
    getQueue().map((item) =>
      item.id === id ? { ...item, status: 'failed' as const } : item
    )
  );
}

/** How many items are still waiting to be synced. */
export function getPendingCount(): number {
  return getQueue().filter((item) => item.status === 'pending').length;
}

/** Get all items with 'pending' status (used by syncManager). */
export function getPendingItems(): QueueItem[] {
  return getQueue().filter((item) => item.status === 'pending');
}
