'use client';

import * as React from 'react';

import type { LightboxGalleryItem } from '../../../_components/lightbox-chrome';

import './dynamic-items.css';

/** Matches `--dynamic-item-remove-duration` in dynamic-items.css */
export const DYNAMIC_ITEM_REMOVE_MS = 380;

/**
 * Removing an item never shifts the active id — identity survives reindexing.
 * Only removing the ACTIVE item needs a decision: with auto-recover the app
 * steps to the neighbour now at the removed position; without it, `value`
 * keeps pointing at the removed id and the library's fallback shows.
 */
export function useAnimatedItemRemoval({
  items,
  setItems,
  activeId,
  setActiveId,
  autoRecover,
}: {
  items: LightboxGalleryItem[];
  setItems: React.Dispatch<React.SetStateAction<LightboxGalleryItem[]>>;
  activeId: string;
  setActiveId: React.Dispatch<React.SetStateAction<string>>;
  autoRecover: boolean;
}) {
  const [removingIds, setRemovingIds] = React.useState<ReadonlySet<string>>(() => new Set());
  const timersRef = React.useRef<Map<string, number>>(new Map());
  const itemsRef = React.useRef(items);
  const activeIdRef = React.useRef(activeId);
  const autoRecoverRef = React.useRef(autoRecover);

  React.useLayoutEffect(() => {
    itemsRef.current = items;
    activeIdRef.current = activeId;
    autoRecoverRef.current = autoRecover;
  });

  const clearPending = React.useCallback(() => {
    timersRef.current.forEach((id) => window.clearTimeout(id));
    timersRef.current.clear();
    setRemovingIds(new Set());
  }, []);

  React.useEffect(() => clearPending, [clearPending]);

  const isRemoving = React.useCallback((item: LightboxGalleryItem) => removingIds.has(item.id), [removingIds]);

  const removeAt = React.useCallback(
    (index: number) => {
      const item = itemsRef.current[index];
      if (!item) return;

      const key = item.id;
      if (timersRef.current.has(key)) return;

      const wasActive = key === activeIdRef.current;

      setRemovingIds((prev) => new Set(prev).add(key));

      const timer = window.setTimeout(() => {
        timersRef.current.delete(key);
        setItems((prev) => {
          const removeIndex = prev.findIndex((entry) => entry.id === key);
          if (removeIndex === -1) return prev;
          const next = prev.filter((entry) => entry.id !== key);
          if (autoRecoverRef.current && wasActive && next.length > 0) {
            setActiveId(next[Math.min(removeIndex, next.length - 1)]!.id);
          }
          return next;
        });
        setRemovingIds((prev) => {
          if (!prev.has(key)) return prev;
          const next = new Set(prev);
          next.delete(key);
          return next;
        });
      }, DYNAMIC_ITEM_REMOVE_MS);

      timersRef.current.set(key, timer);
    },
    [setActiveId, setItems],
  );

  return { removingIds, isRemoving, removeAt, clearPending };
}
