import { useEffect, useState } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ArrowUpRight, CheckCircle2, Clock3 } from "lucide-react";
import { storefront, errorMessage } from "@/services/storefront";
import type { CheckoutAddress } from "@/services/storefront";
import { useBasket } from "@/store/basket.store";
import { formatPrice } from "@/lib/format";
import { SEOHead } from "@/components/common/SEOHead";
import { useAuthStore } from "@/store/auth.store";
import {
  checkoutKey,
  rememberPurchasedItems,
  takePurchasedItems,
  subtractPurchased,
  completeCheckout,
} from "@/lib/checkout-attempt";
export function CheckoutReturnPage() {
  const [params] = useSearchParams();
  const location = useLocation();
  const id = params.get("order") || "";
  const user = useAuthStore((s) => s.user);
  const status = useQuery({
    queryKey: ["payment", id],
    queryFn: () => storefront.paymentState(id),
    enabled: /^[0-9a-f-]{36}$/i.test(id),
    refetchInterval: (q) =>
      q.state.data?.paid ||
      q.state.data?.order.status === "cancelled" ||
      q.state.dataUpdateCount >= 15
        ? false
        : 2000,
  });
  const pay = useMutation({
    mutationFn: () => storefront.pay(id),
    onSuccess: (r) => window.location.assign(r.url),
  });
  useEffect(() => {
    if (status.data?.paid) {
      const purchased = takePurchasedItems(id);
      if (purchased.length)
        useBasket.setState((s) => ({
          cart: subtractPurchased(s.cart, purchased),
        }));
      if (user) completeCheckout(user.id, id);
    }
  }, [status.data?.paid, id, user]);
  const paid = status.data?.paid;
  const cancelled =
    location.pathname.endsWith("cancelled") ||
    status.data?.order.status === "cancelled";
  return (
    <div className="container-main section">
      <SEOHead title="Payment status" />
      <div className="data-notice">
        {paid ? <CheckCircle2 size={44} /> : <Clock3 size={44} />}
        <p className="eyebrow">YOUR ORDER</p>
        <h1 className="content-title">
          {paid
            ? "Payment received."
            : cancelled
              ? "Checkout interrupted."
              : "Checking your payment."}
        </h1>
        <p>
          {paid
            ? "Thank you. Your payment has been confirmed by our server."
            : cancelled
              ? "You have not completed this payment. Check the order status before retrying."
              : "Payment confirmation may take a moment. You can safely check your order in your account."}
        </p>
        {status.isError && (
          <p className="form-error" role="alert">
            {errorMessage(status.error)}
          </p>
        )}
        {status.data &&
          !paid &&
          ["pending_payment", "pending"].includes(status.data.order.status) && (
            <button
              disabled={pay.isPending}
              className="action action-red"
              onClick={() => pay.mutate()}
            >
              {pay.isPending ? "Opening payment…" : "Resume payment"}
            </button>
          )}
        {pay.isError && (
          <p role="alert" className="form-error">
            {errorMessage(pay.error)}
          </p>
        )}
        <Link
          className="text-link"
          to={status.data ? `/account/orders/${id}` : "/account/orders"}
        >
          View your order →
        </Link>
        <button className="text-link" onClick={() => status.refetch()}>
          Refresh status
        </button>
      </div>
    </div>
  );
}
export default function CheckoutPage() {
  const items = useBasket((s) => s.cart);
  const [address, setAddress] = useState<CheckoutAddress>({
    shippingLine1: "",
    shippingCity: "",
    shippingCountry: "",
    shippingPostalCode: "",
  });
  const user = useAuthStore((s) => s.user);
  const [reviewedItems, setReviewedItems] = useState("");
  const reviewed = reviewedItems === JSON.stringify(items);
  const [accepted, setAccepted] = useState(false);
  const preview = useMutation({
    mutationFn: () => storefront.preview({ items, address }),
    onSuccess: () => setReviewedItems(JSON.stringify(items)),
  });
  const checkout = useMutation({
    mutationFn: () =>
      storefront.checkout({
        items,
        address,
        idempotencyKey: checkoutKey(user?.id || "signed-out", {
          items,
          address,
        }),
      }),
    onSuccess: (r) => {
      rememberPurchasedItems(r.order.id, items, user?.id);
      window.location.assign(r.url);
    },
  });
  function edit(field: keyof CheckoutAddress, value: string) {
    setAddress((a) => ({ ...a, [field]: value }));
    setReviewedItems("");
    setAccepted(false);
  }
  if (!items.length)
    return (
      <div className="container-main section data-notice">
        <h1>Your shopping bag is empty.</h1>
        <Link to="/products" className="action action-red">
          Explore products
        </Link>
      </div>
    );
  return (
    <>
      <SEOHead title="Checkout" />
      <div className="page-intro">
        <div className="container-main">
          <p className="eyebrow">BAG / DELIVERY / PAYMENT</p>
          <h1>A few details. Then game on.</h1>
        </div>
      </div>
      <div className="container-main section basket-layout">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            preview.mutate();
          }}
        >
          <h2 className="content-title">Where's your gear heading?</h2>
          <div className="form-grid">
            {(
              [
                ["shippingLine1", "Delivery address", "street-address"],
                ["shippingCity", "City", "address-level2"],
                ["shippingState", "State / region", "address-level1"],
                ["shippingPostalCode", "Postal code", "postal-code"],
                [
                  "shippingCountry",
                  "Country code (e.g. PK, AE, GB)",
                  "country",
                ],
              ] as const
            ).map(([field, label, autocomplete]) => (
              <label
                className={field === "shippingLine1" ? "full" : ""}
                key={field}
              >
                <span className="field-label">{label}</span>
                <input
                  className="field"
                  autoComplete={autocomplete}
                  required={[
                    "shippingLine1",
                    "shippingCity",
                    "shippingCountry",
                  ].includes(field)}
                  minLength={field === "shippingCountry" ? 2 : undefined}
                  maxLength={
                    field === "shippingCountry"
                      ? 2
                      : field === "shippingPostalCode"
                        ? 20
                        : field === "shippingLine1"
                          ? 300
                          : 100
                  }
                  value={address[field] || ""}
                  onChange={(e) =>
                    edit(
                      field,
                      field === "shippingCountry"
                        ? e.target.value.toUpperCase()
                        : e.target.value,
                    )
                  }
                />
              </label>
            ))}
          </div>
          <button
            className="action action-outline mt-7"
            disabled={preview.isPending}
            type="submit"
          >
            {preview.isPending ? "Calculating…" : "Calculate delivery & total"}{" "}
            <ArrowUpRight size={18} />
          </button>
          {preview.isError && (
            <p className="form-error" role="alert">
              {errorMessage(preview.error)}{" "}
              <Link to="/quote-basket">View quote basket</Link>
            </p>
          )}
          <p className="text-sm text-text-muted mt-6">
            Need a different delivery arrangement?{" "}
            <Link className="text-link" to="/contact">
              Talk to our team.
            </Link>
          </p>
        </form>
        <aside className="summary-panel">
          <h2>Order summary</h2>
          {reviewed && preview.data ? (
            <>
              {preview.data.items.map((i) => (
                <div className="summary-row" key={i.variantId}>
                  <span>
                    {i.name} × {i.quantity}
                  </span>
                  <span>
                    {formatPrice(
                      i.quantity * i.unitPrice,
                      preview.data.currency,
                    )}
                  </span>
                </div>
              ))}
              {[
                ["Subtotal", preview.data.subtotal],
                ["Delivery", preview.data.shippingAmount],
                ["Tax", preview.data.taxAmount],
                ["Total", preview.data.totalAmount],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className={
                    label === "Total"
                      ? "summary-row summary-total"
                      : "summary-row"
                  }
                >
                  <span>{label}</span>
                  <span>
                    {formatPrice(Number(value), preview.data.currency)}
                  </span>
                </div>
              ))}
              <label className="flex gap-3 text-xs leading-6 mt-6">
                <input
                  type="checkbox"
                  checked={accepted}
                  onChange={(e) => setAccepted(e.target.checked)}
                />
                <span>
                  I have reviewed my order and the{" "}
                  <Link to="/terms" target="_blank" className="underline">
                    terms
                  </Link>{" "}
                  and{" "}
                  <Link
                    to="/returns-refunds"
                    target="_blank"
                    className="underline"
                  >
                    returns information
                  </Link>
                  .
                </span>
              </label>
              <button
                className="action action-red"
                disabled={!accepted || checkout.isPending}
                onClick={() => checkout.mutate()}
              >
                {checkout.isPending
                  ? "Preparing payment…"
                  : "Continue to secure payment"}{" "}
                <ArrowUpRight size={18} />
              </button>
            </>
          ) : (
            <p>
              Enter your delivery details to calculate your current total. Your
              order is created only when you continue to payment.
            </p>
          )}
          {checkout.isError && (
            <div className="form-error" role="alert">
              <p>{errorMessage(checkout.error)}</p>
              <Link className="text-link" to="/account/orders">
                Check your orders before starting a new checkout →
              </Link>
            </div>
          )}
          <p>Card details are entered on the payment provider's hosted page.</p>
        </aside>
      </div>
    </>
  );
}
