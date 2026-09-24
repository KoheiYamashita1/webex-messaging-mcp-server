/**
 * Minimal in-process TTL cache.
 *
 * Used for Webex responses that are stable for the length of a session but
 * expensive to re-fetch, such as the caller's room list.
 */
export class TtlCache {
  /**
   * @param {Object} [options]
   * @param {number} [options.ttlMs=900000] - Entry lifetime in milliseconds.
   * @param {number} [options.maxEntries=64] - Oldest entries are evicted past this.
   * @param {() => number} [options.now] - Clock override for tests.
   */
  constructor({ ttlMs = 15 * 60 * 1000, maxEntries = 64, now = Date.now } = {}) {
    this.ttlMs = ttlMs;
    this.maxEntries = maxEntries;
    this.now = now;
    this.entries = new Map();
  }

  get(key) {
    const entry = this.entries.get(key);
    if (!entry) return undefined;
    if (this.now() >= entry.expiresAt) {
      this.entries.delete(key);
      return undefined;
    }
    // Refresh insertion order so the hottest keys survive eviction.
    this.entries.delete(key);
    this.entries.set(key, entry);
    return entry.value;
  }

  set(key, value) {
    this.entries.delete(key);
    this.entries.set(key, { value, expiresAt: this.now() + this.ttlMs });
    while (this.entries.size > this.maxEntries) {
      this.entries.delete(this.entries.keys().next().value);
    }
    return value;
  }

  delete(key) {
    return this.entries.delete(key);
  }

  clear() {
    this.entries.clear();
  }

  get size() {
    return this.entries.size;
  }
}
