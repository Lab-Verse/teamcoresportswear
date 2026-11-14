import type { BasketLine } from "@/store/basket.store";

export function checkoutKey(userId: string, payload: unknown): string {
  const storageKey = `teamcore-checkout:${userId}`;
  const fingerprint = JSON.stringify(payload);
  try {
    const prior = JSON.parse(sessionStorage.getItem(storageKey) || "null");
    if (prior?.fingerprint === fingerprint && prior?.key) return prior.key;
  } catch {
    /* Ignore a malformed browser draft. */
  }
  const key = crypto.randomUUID();
  sessionStorage.setItem(storageKey, JSON.stringify({ fingerprint, key }));
  return key;
}

export function rememberPurchasedItems(
  orderId: string,
  items: BasketLine[],
  userId?: string,
) {
  if (userId) {
    const key = "teamcore-checkout:" + userId;
    try {
      const record = JSON.parse(sessionStorage.getItem(key) || "{}");
      sessionStorage.setItem(key, JSON.stringify({ ...record, orderId }));
    } catch {
      /* The order remains available in the account. */
    }
  }
  sessionStorage.setItem(
    `teamcore-order-basket:${orderId}`,
    JSON.stringify(items),
  );
}

export function subtractPurchased(
  current: BasketLine[],
  purchased: BasketLine[],
): BasketLine[] {
  return current
    .map((line) => ({
      ...line,
      quantity: Math.max(
        0,
        line.quantity -
          (purchased.find((item) => item.variantId === line.variantId)
            ?.quantity || 0),
      ),
    }))
    .filter((line) => line.quantity > 0);
}

export function takePurchasedItems(orderId: string): BasketLine[] {
  const key = `teamcore-order-basket:${orderId}`;
  try {
    const items: unknown = JSON.parse(sessionStorage.getItem(key) || "[]");
    sessionStorage.removeItem(key);
    return Array.isArray(items)
      ? items.filter(
          (item) =>
            typeof item.variantId === "string" &&
            Number.isInteger(item.quantity) &&
            item.quantity > 0,
        )
      : [];
  } catch {
    return [];
  }
}

export function completeCheckout(userId: string, orderId: string) {
  const key = "teamcore-checkout:" + userId;
  try {
    const record = JSON.parse(sessionStorage.getItem(key) || "{}");
    if (record.orderId === orderId) sessionStorage.removeItem(key);
  } catch {
    /* No valid attempt to clear. */
  }
}
