import { create } from "zustand";
import { persist } from "zustand/middleware";
export interface BasketLine {
  variantId: string;
  quantity: number;
}
interface BasketState {
  cart: BasketLine[];
  quotes: BasketLine[];
  add: (kind: "cart" | "quotes", variantId: string, quantity: number) => void;
  update: (
    kind: "cart" | "quotes",
    variantId: string,
    quantity: number,
  ) => void;
  clear: (kind: "cart" | "quotes") => void;
}
export function mergeLine(
  lines: BasketLine[],
  variantId: string,
  quantity: number,
): BasketLine[] {
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 1000000)
    return lines;
  const existing = lines.find((l) => l.variantId === variantId);
  if (!existing && lines.length >= 100) return lines;
  return existing
    ? lines.map((l) =>
        l.variantId === variantId
          ? { ...l, quantity: Math.min(1000000, l.quantity + quantity) }
          : l,
      )
    : [...lines, { variantId, quantity }];
}
export const useBasket = create<BasketState>()(
  persist(
    (set) => ({
      cart: [],
      quotes: [],
      add: (kind, variantId, quantity) =>
        set((s) => ({ [kind]: mergeLine(s[kind], variantId, quantity) })),
      update: (kind, variantId, quantity) =>
        set((s) => ({
          [kind]:
            quantity === 0
              ? s[kind].filter((l) => l.variantId !== variantId)
              : s[kind].map((l) =>
                  l.variantId === variantId &&
                  Number.isInteger(quantity) &&
                  quantity > 0 &&
                  quantity <= 1000000
                    ? { ...l, quantity }
                    : l,
                ),
        })),
      clear: (kind) => set({ [kind]: [] }),
    }),
    { name: "teamcore-baskets-v1", version: 1 },
  ),
);
