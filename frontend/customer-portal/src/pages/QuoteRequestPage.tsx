import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ArrowUpRight, CheckCircle2 } from "lucide-react";
import { useBasket } from "@/store/basket.store";
import { useAuthStore } from "@/store/auth.store";
import { wholesaleApi } from "@/services/api";
import { storefront, errorMessage } from "@/services/storefront";
import { SEOHead } from "@/components/common/SEOHead";
export function QuoteSuccessPage() {
  const { id = "" } = useParams();
  const inquiry = useQuery({
    queryKey: ["inquiry", id],
    queryFn: () => wholesaleApi.getInquiry(id),
  });
  return (
    <div className="container-main section data-notice">
      <SEOHead title="Quotation request received" />
      <CheckCircle2 size={45} />
      <h1 className="content-title">Your requirements are with us.</h1>
      {inquiry.data ? (
        <p>
          Reference: {inquiry.data.reference}. Follow progress and review
          quotations from your account.
        </p>
      ) : (
        <p>
          {inquiry.isError
            ? "Sign in with the account that submitted this request to view its details."
            : "Loading your reference…"}
        </p>
      )}
      <Link className="action action-red" to="/account/wholesale">
        View your enquiries
      </Link>
    </div>
  );
}
export default function QuoteRequestPage() {
  const user = useAuthStore((s) => s.user);
  const items = useBasket((s) => s.quotes);
  const clear = useBasket((s) => s.clear);
  const navigate = useNavigate();
  const [form, setForm] = useState(() => {
    const defaults = {
      companyName: "",
      contactName: `${user?.firstName || ""} ${user?.lastName || ""}`.trim(),
      contactEmail: user?.email || "",
      contactPhone: "",
      deliveryCountry: "",
      deliveryCity: "",
      deliveryAddress: "",
      notes: "",
    };
    try {
      const saved = JSON.parse(
        sessionStorage.getItem("teamcore-quote-draft:" + user?.id) || "{}",
      );
      return Object.fromEntries(
        Object.entries(defaults).map(([key, value]) => [
          key,
          typeof saved[key] === "string" ? saved[key] : value,
        ]),
      ) as typeof defaults;
    } catch {
      return defaults;
    }
  });
  const resolved = useQuery({
    queryKey: ["quote-basket", items],
    queryFn: () => storefront.resolve(items),
    enabled: items.length > 0,
  });
  const send = useMutation({
    mutationFn: () =>
      wholesaleApi.createInquiry({
        ...form,
        contactPhone: form.contactPhone || undefined,
        deliveryCountry: form.deliveryCountry.toUpperCase(),
        items: items.map((i) => ({
          variantId: i.variantId,
          requestedQuantity: i.quantity,
        })),
      }),
    onSuccess: (r) => {
      sessionStorage.removeItem("teamcore-quote-draft:" + user?.id);
      clear("quotes");
      navigate(`/request-quote/success/${r.id}`, { replace: true });
    },
  });
  if (!items.length)
    return (
      <div className="container-main section data-notice">
        <h1>Your quote basket is empty.</h1>
        <Link className="action action-red" to="/products">
          Choose products
        </Link>
      </div>
    );
  return (
    <>
      <SEOHead title="Request a quotation" />
      <div className="page-intro">
        <div className="container-main">
          <p className="eyebrow">TEAM & TRADE</p>
          <h1>Let's build your next order.</h1>
          <p>
            Tell us about your requirements. No payment is collected when you
            send an enquiry.
          </p>
        </div>
      </div>
      <div className="container-main section basket-layout">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send.mutate();
          }}
        >
          <div className="form-grid">
            {(
              [
                ["companyName", "Company / team name", "text"],
                ["contactName", "Contact name", "text"],
                ["contactEmail", "Email address", "email"],
                ["contactPhone", "Phone (optional)", "tel"],
                ["deliveryCountry", "Country code (e.g. PK)", "text"],
                ["deliveryCity", "Delivery city", "text"],
                ["deliveryAddress", "Delivery address", "text"],
              ] as const
            ).map(([name, label, type]) => (
              <label key={name}>
                <span className="field-label">{label}</span>
                <input
                  className="field"
                  type={type}
                  required={name !== "contactPhone"}
                  minLength={
                    ["companyName", "contactName", "deliveryCountry"].includes(
                      name,
                    )
                      ? 2
                      : undefined
                  }
                  maxLength={
                    name === "deliveryCountry"
                      ? 2
                      : name === "contactEmail"
                        ? 320
                        : name === "contactPhone"
                          ? 25
                          : 200
                  }
                  value={form[name]}
                  onChange={(e) => {
                    const next = { ...form, [name]: e.target.value };
                    setForm(next);
                    sessionStorage.setItem(
                      "teamcore-quote-draft:" + user?.id,
                      JSON.stringify(next),
                    );
                  }}
                />
              </label>
            ))}
          </div>
          <label>
            <span className="field-label">Anything else we should know?</span>
            <textarea
              className="field"
              rows={5}
              maxLength={3000}
              value={form.notes}
              onChange={(e) => {
                const next = { ...form, notes: e.target.value };
                setForm(next);
                sessionStorage.setItem(
                  "teamcore-quote-draft:" + user?.id,
                  JSON.stringify(next),
                );
              }}
              placeholder="Delivery requirements, quantities or questions for our team…"
            />
          </label>
          <button
            className="action action-red mt-6"
            disabled={send.isPending || resolved.isError || resolved.isPending}
          >
            {send.isPending
              ? "Sending your request…"
              : "Send quotation request"}{" "}
            <ArrowUpRight size={18} />
          </button>
          {send.isError && (
            <p className="form-error" role="alert">
              {errorMessage(send.error)}
            </p>
          )}
        </form>
        <aside className="summary-panel">
          <h2>Your selected products</h2>
          {resolved.data?.map((i) => (
            <div className="summary-row" key={i.variantId}>
              <span>
                {i.name}
                <br />
                <small>{i.sku}</small>
              </span>
              <span>× {i.quantity}</span>
            </div>
          ))}
          {resolved.isError && (
            <p className="form-error" role="alert">
              {errorMessage(resolved.error)}
            </p>
          )}
          <p>
            Our team will confirm availability, prices, delivery and terms in
            your quotation.
          </p>
          <Link className="text-link mt-6" to="/quote-basket">
            Edit your requirements →
          </Link>
        </aside>
      </div>
    </>
  );
}
