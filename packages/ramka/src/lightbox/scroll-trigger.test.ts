import { describe, expect, it, vi } from 'vitest';

import { resolveTriggerIndex } from './scroll-trigger';

const withTriggers = (indexes: number[]) => {
  const set = new Set(indexes);
  return vi.fn((index: number) => set.has(index));
};

describe('resolveTriggerIndex', () => {
  it('lands on the active item under morphTo="active", trigger or not', () => {
    expect(resolveTriggerIndex(4, 'active', 0, withTriggers([]), 10)).toBe(4);
  });

  it('lands on the opening item under morphTo="origin"', () => {
    expect(resolveTriggerIndex(4, 'origin', 1, withTriggers([4]), 10)).toBe(1);
  });

  it('prefers the active item under morphTo="closest" when it has a trigger', () => {
    expect(resolveTriggerIndex(4, 'closest', 0, withTriggers([3, 4, 5]), 10)).toBe(4);
  });

  it('breaks a closest tie toward the earlier item', () => {
    expect(resolveTriggerIndex(4, 'closest', 0, withTriggers([2, 6]), 10)).toBe(2);
  });

  it('finds the nearest trigger far from the active item, on either side', () => {
    expect(resolveTriggerIndex(950, 'closest', 0, withTriggers([3]), 1000)).toBe(3);
    expect(resolveTriggerIndex(2, 'closest', 0, withTriggers([997]), 1000)).toBe(997);
  });

  it('stops at the first trigger instead of scanning the gallery', () => {
    const hasTrigger = withTriggers([5, 900]);
    expect(resolveTriggerIndex(4, 'closest', 0, hasTrigger, 1000)).toBe(5);
    // Active (4), then 3 and 5.
    expect(hasTrigger).toHaveBeenCalledTimes(3);
  });

  it('falls back to the active item when no item has a trigger', () => {
    const hasTrigger = withTriggers([]);
    expect(resolveTriggerIndex(4, 'closest', 0, hasTrigger, 10)).toBe(4);
    // The search ends at the gallery's edges.
    expect(hasTrigger.mock.calls.length).toBeLessThanOrEqual(2 * 10 + 1);
  });
});
