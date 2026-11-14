// @vitest-environment node
import { beforeEach, describe, expect, it } from "vitest";
import {
  checkoutKey,
  rememberPurchasedItems,
  subtractPurchased,
  takePurchasedItems,
} from "./checkout-attempt";
import { mergeLine } from "@/store/basket.store";

beforeEach(() => {
  const storage = new Map<string, string>();
  Object.defineProperty(globalThis, "sessionStorage", {
    configurable: true,
    value: {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => storage.set(key, value),
      removeItem: (key: string) => storage.delete(key),
      clear: () => storage.clear(),
    },
  });
});
describe("checkout recovery", () => {
  it("reuses the key only for the same buyer and payload", () => {
    const payload = {
      items: [{ variantId: "a", quantity: 2 }],
      address: { shippingCity: "Lahore" },
    };
    const key = checkoutKey("buyer", payload);
    expect(checkoutKey("buyer", payload)).toBe(key);
    expect(checkoutKey("other", payload)).not.toBe(key);
    expect(
      checkoutKey("buyer", {
        ...payload,
        address: { shippingCity: "Karachi" },
      }),
    ).not.toBe(key);
  });
  it("clears only purchased quantities and preserves later additions", () => {
    const bought = [{ variantId: "a", quantity: 2 }];
    rememberPurchasedItems("order", bought);
    expect(
      subtractPurchased(
        [
          { variantId: "a", quantity: 3 },
          { variantId: "b", quantity: 5 },
        ],
        takePurchasedItems("order"),
      ),
    ).toEqual([
      { variantId: "a", quantity: 1 },
      { variantId: "b", quantity: 5 },
    ]);
    expect(takePurchasedItems("order")).toEqual([]);
  });
  it("does not admit invalid or unbounded basket quantities", () => {
    expect(mergeLine([], "a", 0)).toEqual([]);
    expect(mergeLine([], "a", 1.1)).toEqual([]);
    expect(mergeLine([{ variantId: "a", quantity: 2 }], "a", 3)).toEqual([
      { variantId: "a", quantity: 5 },
    ]);
  });
});
