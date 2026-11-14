import api from "@/config/api";
import type { Product, Category, PaginatedResponse, Order } from "@/types";
import type { BasketLine } from "@/store/basket.store";
export interface CheckoutAddress {
  shippingLine1: string;
  shippingCity: string;
  shippingCountry: string;
  shippingPostalCode?: string;
  shippingState?: string;
}
export interface CheckoutPreview {
  items: {
    variantId: string;
    quantity: number;
    name: string;
    sku: string;
    unitPrice: number;
    purchaseMode: "direct" | "quote_only" | "both";
    minimumOrderQuantity: number;
    quantityIncrement: number;
    image?: string;
    productSlug: string;
    currency: string;
  }[];
  currency: string;
  subtotal: number;
  shippingAmount: number;
  taxAmount: number;
  totalAmount: number;
}
export const storefront = {
  products: (params: Record<string, unknown> = {}) =>
    api
      .get<
        PaginatedResponse<Product> & { items?: Product[] }
      >("/storefront/products", { params })
      .then((r) => ({ ...r.data, data: r.data.data ?? r.data.items ?? [] })),
  product: (slug: string) =>
    api
      .get<Product>(`/storefront/products/${encodeURIComponent(slug)}`)
      .then((r) => r.data),
  reviews: (slug: string) =>
    api
      .get<
        {
          id: string;
          rating: number;
          title?: string;
          body?: string;
          firstName?: string;
          isVerified: boolean;
          sellerReply?: string;
          createdAt: string;
        }[]
      >(`/storefront/products/${encodeURIComponent(slug)}/reviews`)
      .then((r) => r.data),
  categories: () =>
    api.get<Category[]>("/storefront/categories").then((r) => r.data),
  resolve: (items: BasketLine[]) =>
    api
      .post<CheckoutPreview["items"]>("/storefront/basket", { items })
      .then((r) => r.data),
  preview: (data: { items: BasketLine[]; address: CheckoutAddress }) =>
    api
      .post<CheckoutPreview>("/storefront/checkout/preview", data)
      .then((r) => r.data),
  checkout: (data: {
    items: BasketLine[];
    address: CheckoutAddress;
    idempotencyKey: string;
  }) =>
    api
      .post<{ order: Order; url: string }>("/storefront/checkout", data)
      .then((r) => r.data),
  pay: (id: string) =>
    api
      .post<{ url: string }>(`/storefront/orders/${id}/pay`)
      .then((r) => r.data),
  paymentState: (id: string) =>
    api
      .get<{ order: Order; paid: boolean }>(`/storefront/orders/${id}/payment`)
      .then((r) => r.data),
  contact: (data: {
    name: string;
    email: string;
    subject: string;
    message: string;
  }) =>
    api
      .post<{ reference: string }>("/storefront/contact", data)
      .then((r) => r.data),
};
export function errorMessage(error: unknown) {
  const e = error as { response?: { data?: { message?: string | string[] } } };
  const message = e?.response?.data?.message;
  return Array.isArray(message)
    ? message.join(". ")
    : message || "We could not complete that request. Please try again.";
}
