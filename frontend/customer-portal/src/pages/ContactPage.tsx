import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowUpRight, CheckCircle2, Phone, Mail, MapPin } from "lucide-react";
import { brand } from "@/config/brand";
import { storefront, errorMessage } from "@/services/storefront";
import { SEOHead } from "@/components/common/SEOHead";
export default function ContactPage() {
  const [params] = useSearchParams();
  const categories = useQuery({
    queryKey: ["storefront", "categories"],
    queryFn: storefront.categories,
  });
  const [requirements, setRequirements] = useState({
    sport: (params.get("sport") || "").slice(0, 200),
    quantity:
      /^\d{1,7}$/.test(params.get("quantity") || "") &&
      Number(params.get("quantity")) > 0 &&
      Number(params.get("quantity")) <= 1000000
        ? params.get("quantity") || ""
        : "",
    country: "",
    deadline: "",
  });
  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: params.get("topic") || "",
    message: [
      "Club or team",
      "School or academy",
      "League or event",
      "Brand or reseller",
    ].includes(params.get("buyer") || "")
      ? `Buying for: ${params.get("buyer")}\n\n`
      : "",
  });
  const selectedSport =
    categories.data?.find((c) => c.slug === requirements.sport)?.name ||
    requirements.sport;
  const send = useMutation({
    mutationFn: () =>
      storefront.contact({
        ...form,
        message: [
          form.message,
          ...Object.entries({ ...requirements, sport: selectedSport })
            .filter(([, value]) => value)
            .map(([key, value]) => `${key}: ${value}`),
        ].join("\n"),
      }),
  });
  return (
    <>
      <SEOHead title="Contact Team Core Sports Wear" description="Ask our Sialkot team about custom sports uniforms, private-label sportswear, or a quotation for your team or club." />
      <div className="page-intro">
        <div className="container-main">
          <p className="eyebrow">LET'S TALK SPORT</p>
          <h1>Let's talk about your next kit.</h1>
          <p>
            Share your sport, quantities and customization requirements. We can
            help you work through the details.
          </p>
          <div className="tc-contact-methods">
            <a href={brand.phoneHref}>
              <Phone size={23} />
              <strong>{brand.phone}</strong>
              <small>Call our team</small>
            </a>
            <a href={`mailto:${brand.email}`}>
              <Mail size={23} />
              <strong>{brand.email}</strong>
              <small>Email your requirements</small>
            </a>
            <div>
              <MapPin size={23} />
              <strong>{brand.location}</strong>
              <a href={brand.whatsapp} target="_blank" rel="noreferrer">
                Chat on WhatsApp ↗
              </a>
            </div>
          </div>
        </div>
      </div>
      <div className="container-main section content-layout">
        {send.isSuccess ? (
          <div className="data-notice">
            <CheckCircle2 size={40} />
            <h2>Your message has been received.</h2>
            <p>
              Reference: {send.data.reference}. Keep this for any follow-up.
            </p>
            <button
              className="text-link"
              onClick={() => {
                send.reset();
                setForm({ name: "", email: "", subject: "", message: "" });
                setRequirements({
                  sport: "",
                  quantity: "",
                  country: "",
                  deadline: "",
                });
              }}
            >
              Send another message →
            </button>
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send.mutate();
            }}
          >
            <div className="form-grid">
              {(
                [
                  ["name", "Your name", "text"],
                  ["email", "Email address", "email"],
                  ["subject", "What can we help with?", "text"],
                ] as const
              ).map(([key, label, type]) => (
                <label key={key} className={key === "subject" ? "full" : ""}>
                  <span className="field-label">{label}</span>
                  <input
                    required
                    className="field"
                    type={type}
                    value={form[key]}
                    minLength={key === "name" ? 2 : 3}
                    maxLength={key === "email" ? 320 : 200}
                    onChange={(e) =>
                      setForm({ ...form, [key]: e.target.value })
                    }
                  />
                </label>
              ))}
            </div>
            <label>
              <span className="field-label">Your message</span>
              <textarea
                className="field"
                required
                minLength={10}
                maxLength={4000}
                rows={6}
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                placeholder="Include a product SKU or order reference if you have one."
              />
            </label>
            <details className="faq-item mt-6">
              <summary>Add team order details (optional)</summary>
              <div className="form-grid">
                <label>
                  <span className="field-label">Sport</span>
                  <select
                    className="field"
                    value={selectedSport}
                    onChange={(e) =>
                      setRequirements({
                        ...requirements,
                        sport: e.target.value,
                      })
                    }
                  >
                    <option value="">Choose a sport</option>
                    {categories.data?.map((s) => (
                      <option key={s.slug} value={s.name}>
                        {s.name}
                      </option>
                    ))}
                    <option>Other custom sportswear</option>
                  </select>
                  {categories.isError && (
                    <span role="alert">
                      Sports could not load.{" "}
                      <button
                        className="text-link"
                        type="button"
                        onClick={() => void categories.refetch()}
                      >
                        Reload sports
                      </button>
                    </span>
                  )}
                </label>
                {(
                  [
                    ["quantity", "Approximate quantity"],
                    ["country", "Delivery country"],
                    ["deadline", "Preferred deadline"],
                  ] as const
                ).map(([key, label]) => (
                  <label key={key}>
                    <span className="field-label">{label}</span>
                    <input
                      className="field"
                      value={requirements[key]}
                      maxLength={120}
                      onChange={(e) =>
                        setRequirements({
                          ...requirements,
                          [key]: e.target.value,
                        })
                      }
                    />
                  </label>
                ))}
              </div>
            </details>
            <p className="text-xs text-text-muted my-5">
              Your details are used to respond to this request. Read our{" "}
              <Link className="underline" to="/privacy-policy">
                privacy information
              </Link>
              .
            </p>
            <button className="action action-red" disabled={send.isPending}>
              {send.isPending ? "Sending…" : "Send your message"}
              <ArrowUpRight size={18} />
            </button>
            {send.isError && (
              <p className="form-error" role="alert">
                {errorMessage(send.error)}
              </p>
            )}
          </form>
        )}
        <aside className="content-aside">
          <p className="eyebrow">THE RIGHT PLACE TO START</p>
          <h2>Have a custom brief?</h2>
          <p>
            Describe your team or brand, the uniform you need and your
            destination. For an itemised quotation, choose products and
            quantities in your quote basket.
          </p>
          <Link className="text-link" to="/wholesale">
            Wholesale & team orders ↗
          </Link>
          <hr className="my-8 border-border" />
          <h2>Already have an order?</h2>
          <p>
            Your account shows order progress, quotations and conversations with
            our team.
          </p>
          <Link className="text-link" to="/account">
            Visit your account ↗
          </Link>
        </aside>
      </div>
    </>
  );
}
