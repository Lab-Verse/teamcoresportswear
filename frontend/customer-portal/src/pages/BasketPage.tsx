import { toast } from "sonner";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ShoppingBag, FileText, ArrowUpRight } from "lucide-react";
import { useBasket } from "@/store/basket.store";
import { storefront, errorMessage } from "@/services/storefront";
import { formatPrice } from "@/lib/format";
import { SEOHead } from "@/components/common/SEOHead";
export default function BasketPage({ quote = false }: { quote?: boolean }) {
  const kind = quote ? "quotes" : "cart";
  const lines = useBasket((s) => s[kind]);
  const update = useBasket((s) => s.update);
  const data = useQuery({
    queryKey: ["basket", kind, lines],
    queryFn: () => storefront.resolve(lines),
    enabled: lines.length > 0,
    retry: false,
  });
  const title = quote ? "Your quote basket." : "Your shopping bag.";
  return (
    <>
      <SEOHead title={title} />
      <div className="page-intro">
        <div className="container-main">
          <p className="eyebrow">
            {quote ? "TEAM & TRADE" : "READY FOR YOUR NEXT GAME"}
          </p>
          <h1>{title}</h1>
          <p>
            {quote
              ? "Tell us what you need. A quote request is not an order."
              : "Review your selection before heading to checkout."}
          </p>
        </div>
      </div>
      <div className="container-main section">
        {!lines.length ? (
          <div className="data-notice">
            {quote ? <FileText size={35} /> : <ShoppingBag size={35} />}
            <h2>A little room for possibility.</h2>
            <p>
              Add a product to start{" "}
              {quote ? "your quotation request" : "your order"}.
            </p>
            <Link className="action action-red" to="/products">
              Explore the range <ArrowUpRight size={18} />
            </Link>
          </div>
        ) : (
          <div className="basket-layout">
            <section>
              {data.isPending ? (
                <p aria-live="polite">Checking your products…</p>
              ) : data.isError ? (
                <div role="alert">
                  <p className="form-error">{errorMessage(data.error)}</p>
                  <button className="text-link" onClick={() => data.refetch()}>
                    Try again
                  </button>
                  {lines.map((l) => (
                    <div className="basket-line" key={l.variantId}>
                      <p>
                        Variant {l.variantId.slice(0, 8)} · {l.quantity} units
                      </p>
                      <button onClick={() => update(kind, l.variantId, 0)}>
                        Remove item
                      </button>
                      <label>
                        <span className="field-label">Adjust quantity</span>
                        <input
                          className="field"
                          type="number"
                          min="1"
                          max="1000000"
                          defaultValue={l.quantity}
                          onBlur={(event) => {
                            if (event.target.value)
                              update(
                                kind,
                                l.variantId,
                                Number(event.target.value),
                              );
                          }}
                        />
                      </label>
                    </div>
                  ))}
                </div>
              ) : (
                data.data?.map((item) => (
                  <article className="basket-line" key={item.variantId}>
                    {item.image ? (
                      <img src={item.image} alt="" width="80" height="90" />
                    ) : (
                      <ShoppingBag />
                    )}
                    <div>
                      <h2>
                        <Link to={`/products/${item.productSlug}`}>
                          {item.name}
                        </Link>
                      </h2>
                      <p>SKU: {item.sku}</p>
                      {!quote && (
                        <p>
                          {formatPrice(item.unitPrice, item.currency)} / unit
                        </p>
                      )}
                      <button onClick={() => update(kind, item.variantId, 0)}>
                        Remove
                      </button>
                    </div>
                    <div>
                      <label className="sr-only" htmlFor={item.variantId}>
                        Quantity for {item.name}
                      </label>
                      <input
                        className="field"
                        id={item.variantId}
                        type="number"
                        min={item.minimumOrderQuantity}
                        step={item.quantityIncrement}
                        max="1000000"
                        key={item.quantity}
                        defaultValue={item.quantity}
                        onBlur={(e) => {
                          if (e.target.value)
                            update(
                              kind,
                              item.variantId,
                              Number(e.target.value),
                            );
                        }}
                      />
                    </div>
                  </article>
                ))
              )}
            </section>
            <aside className="summary-panel">
              <h2>{quote ? "Your requirements" : "Order overview"}</h2>
              <div className="summary-row">
                <span>Product variants</span>
                <span>{lines.length}</span>
              </div>
              <div className="summary-row">
                <span>Total units</span>
                <span>{lines.reduce((s, l) => s + l.quantity, 0)}</span>
              </div>
              <p>
                {quote
                  ? "Your final prices, delivery and terms will be included in a formal quotation."
                  : "Shipping, taxes and current product prices are calculated at checkout for your destination."}
              </p>
              {data.isSuccess && (
                <Link
                  className="action action-red"
                  to={quote ? "/request-quote" : "/checkout"}
                >
                  {quote ? "Request your quotation" : "Continue to checkout"}{" "}
                  <ArrowUpRight size={18} />
                </Link>
              )}
              {!quote &&
                data.data?.some((i) => i.purchaseMode !== "direct") && (
                  <button
                    className="text-link mt-6"
                    onClick={() => {
                      const eligible = (data.data || []).filter(
                        (item) => item.purchaseMode !== "direct",
                      );
                      const existing = useBasket.getState().quotes;
                      if (
                        new Set(
                          [...eligible, ...existing].map(
                            (item) => item.variantId,
                          ),
                        ).size > 100
                      ) {
                        toast.error(
                          "Your quote basket is full. Submit it before adding more products.",
                        );
                        return;
                      }
                      for (const item of eligible) {
                        const quantity =
                          item.quantity +
                          (existing.find(
                            (line) => line.variantId === item.variantId,
                          )?.quantity || 0);
                        if (
                          quantity > 1000000 ||
                          (quantity - item.minimumOrderQuantity) %
                            item.quantityIncrement !==
                            0
                        ) {
                          toast.error(
                            "Adjust your existing quote quantities before copying these items.",
                          );
                          return;
                        }
                      }
                      for (const item of eligible)
                        useBasket
                          .getState()
                          .add("quotes", item.variantId, item.quantity);
                      toast.success(
                        "Eligible products copied to your quote basket",
                      );
                    }}
                  >
                    Copy eligible items to quote basket →
                  </button>
                )}
              <Link className="text-link mt-6" to="/products">
                Continue exploring →
              </Link>
            </aside>
          </div>
        )}
      </div>
    </>
  );
}
