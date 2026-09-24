import { test } from 'node:test';
import assert from 'node:assert/strict';

import { TtlCache } from '../lib/ttl-cache.js';

function fakeClock() {
  const clock = { t: 0, now: () => clock.t };
  return clock;
}

test('returns a stored value before it expires', () => {
  const clock = fakeClock();
  const cache = new TtlCache({ ttlMs: 100, now: clock.now });
  cache.set('a', { items: 1 });
  clock.t = 99;
  assert.deepEqual(cache.get('a'), { items: 1 });
});

test('drops the value once the ttl has elapsed', () => {
  const clock = fakeClock();
  const cache = new TtlCache({ ttlMs: 100, now: clock.now });
  cache.set('a', 'v');
  clock.t = 100;
  assert.equal(cache.get('a'), undefined);
  assert.equal(cache.size, 0);
});

test('set returns the value so callers can cache inline', () => {
  const cache = new TtlCache();
  assert.equal(cache.set('a', 42), 42);
});

test('evicts the least recently used entry past maxEntries', () => {
  const cache = new TtlCache({ maxEntries: 2 });
  cache.set('a', 1);
  cache.set('b', 2);
  cache.get('a'); // make 'b' the coldest entry
  cache.set('c', 3);
  assert.equal(cache.size, 2);
  assert.equal(cache.get('b'), undefined);
  assert.equal(cache.get('a'), 1);
  assert.equal(cache.get('c'), 3);
});

test('delete and clear remove entries', () => {
  const cache = new TtlCache();
  cache.set('a', 1);
  assert.equal(cache.delete('a'), true);
  cache.set('b', 2);
  cache.clear();
  assert.equal(cache.size, 0);
});
