"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import type { BoxSize } from "@/lib/types";
import { BOX_SIZES, SUBSCRIBE_RATE, productsById } from "@/data/products";

export type PurchaseMode = "once" | "subscribe";

/** One filled slot in the box — a single pack of a given SKU. */
export interface BoxSlot {
  productId: string;
}

interface BoxContextValue {
  /** Quantity per SKU id. */
  items: Record<string, number>;
  /** Flat list of filled slots, in insertion order — drives the filling box graphic. */
  slots: BoxSlot[];
  size: BoxSize;
  mode: PurchaseMode;

  count: number;
  capacity: number;
  remaining: number;
  isFull: boolean;

  subtotal: number;
  discountRate: number;
  total: number;
  savings: number;

  /** Increments any time an add is rejected for being over capacity — UI can react with a nudge. */
  blockedAt: number;

  add: (id: string) => void;
  decrement: (id: string) => void;
  setSize: (size: BoxSize) => void;
  setMode: (mode: PurchaseMode) => void;
  clear: () => void;
}

const BoxContext = createContext<BoxContextValue | null>(null);

function totalCount(items: Record<string, number>): number {
  let n = 0;
  for (const id in items) n += items[id];
  return n;
}

/** Trim the box down to a capacity, removing most-recently-added packs first. */
function trimToCapacity(
  items: Record<string, number>,
  capacity: number,
): Record<string, number> {
  if (totalCount(items) <= capacity) return items;
  const next = { ...items };
  const ids = Object.keys(next); // insertion order
  let over = totalCount(next) - capacity;
  for (let i = ids.length - 1; i >= 0 && over > 0; i--) {
    const id = ids[i];
    const take = Math.min(next[id], over);
    next[id] -= take;
    over -= take;
    if (next[id] <= 0) delete next[id];
  }
  return next;
}

export function BoxProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<Record<string, number>>({});
  const [size, setSizeState] = useState<BoxSize>("small");
  const [mode, setMode] = useState<PurchaseMode>("subscribe");
  const [blockedAt, setBlockedAt] = useState(0);

  const capacity = BOX_SIZES[size].capacity;
  const count = useMemo(() => totalCount(items), [items]);
  const isFull = count >= capacity;
  const remaining = Math.max(0, capacity - count);

  const add = useCallback(
    (id: string) => {
      setItems((prev) => {
        if (totalCount(prev) >= BOX_SIZES[size].capacity) {
          setBlockedAt(Date.now());
          return prev;
        }
        return { ...prev, [id]: (prev[id] ?? 0) + 1 };
      });
    },
    [size],
  );

  const decrement = useCallback((id: string) => {
    setItems((prev) => {
      if (!prev[id]) return prev;
      const next = { ...prev };
      if (next[id] <= 1) delete next[id];
      else next[id] -= 1;
      return next;
    });
  }, []);

  const setSize = useCallback((nextSize: BoxSize) => {
    setSizeState(nextSize);
    setItems((prev) => trimToCapacity(prev, BOX_SIZES[nextSize].capacity));
  }, []);

  const clear = useCallback(() => setItems({}), []);

  const slots = useMemo<BoxSlot[]>(() => {
    const out: BoxSlot[] = [];
    for (const id in items) {
      for (let i = 0; i < items[id]; i++) out.push({ productId: id });
    }
    return out;
  }, [items]);

  const subtotal = useMemo(() => {
    let sum = 0;
    for (const id in items) {
      const product = productsById[id];
      if (product) sum += product.price * items[id];
    }
    return sum;
  }, [items]);

  const discountRate =
    BOX_SIZES[size].bulkRate + (mode === "subscribe" ? SUBSCRIBE_RATE : 0);
  const total = subtotal * (1 - discountRate);
  const savings = subtotal - total;

  const value: BoxContextValue = {
    items,
    slots,
    size,
    mode,
    count,
    capacity,
    remaining,
    isFull,
    subtotal,
    discountRate,
    total,
    savings,
    blockedAt,
    add,
    decrement,
    setSize,
    setMode,
    clear,
  };

  return <BoxContext.Provider value={value}>{children}</BoxContext.Provider>;
}

export function useBox(): BoxContextValue {
  const ctx = useContext(BoxContext);
  if (!ctx) throw new Error("useBox must be used within a BoxProvider");
  return ctx;
}
