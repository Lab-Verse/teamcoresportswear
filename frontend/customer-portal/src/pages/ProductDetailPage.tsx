import { useState, useRef, useEffect } from "react";
import { useUIStore } from "@/store/ui.store";
import { ProductShelf } from "@/components/discovery/ProductShelf";
import { relatedCollection } from "@/lib/collections";
import { RecentlyViewed } from "@/components/discovery/RecentlyViewed";
import { PersonalizationGuide } from "@/components/discovery/BuyerGuides";
import { wishlistApi } from "@/services/api";
import { useAuthStore } from "@/store/auth.store";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  ShoppingBag,
  FileText,
  ArrowUpRight,
  Check,
  Palette,
  Ruler,
  Layers,
  Package,
  Minus,
  Plus,
  ZoomIn,
  ChevronLeft,
  ChevronRight,
  Heart,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { storefront, errorMessage } from "@/services/storefront";
import { useBasket } from "@/store/basket.store";
import { formatPrice } from "@/lib/format";
import { SEOHead } from "@/components/common/SEOHead";
import { sanitizeHtml } from "@/lib/sanitize";
import { NotFoundPage } from "@/pages/InformationPage";
import { studioApi } from "@/features/design/api";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  productOptions,
  effectiveSelection,
  chooseOption,
  selectedVariant,
  swatch,
  productFacts,
  type Selection,
} from "@/lib/product-options";
export default function ProductDetailPage() {
  const { slug = "" } = useParams();
  return <ProductDetails key={slug} slug={slug} />;
}
function ProductDetails({ slug }: { slug: string }) {
  const [selected, setSelected] = useState<Selection>({});
  const [zoom, setZoom] = useState(false);
  const zoomTrigger = useRef<HTMLButtonElement>(null);
  const [quantityInput, setQuantity] = useState<number | undefined>(undefined);
  const [photo, setPhoto] = useState(0);
  const product = useQuery({
    queryKey: ["storefront", "product", slug],
    queryFn: () => storefront.product(slug),
  });
  const add = useBasket((s) => s.add);
  const trackView = useUIStore((s) => s.addRecentlyViewed);
  useEffect(() => {
    if (product.data) trackView(product.data);
  }, [product.data, trackView]);
  const templates = useQuery({
    queryKey: ["studio", "templates"],
    queryFn: studioApi.templates,
    enabled: typeof window !== "undefined",
  });
  const navigate = useNavigate();
  const signedIn = useAuthStore((s) => s.isAuthenticated);
  const reviews = useQuery({
    queryKey: ["storefront", "reviews", slug],
    queryFn: () => storefront.reviews(slug),
    enabled: !!product.data,
  });
  const save = useMutation({
    mutationFn: async (variantId: string) => {
      const lists = await wishlistApi.getMine();
      const list = lists[0] || (await wishlistApi.create());
      return wishlistApi.addItem(list.id, { variantId });
    },
    onSuccess: () => toast.success("Saved to your wishlist"),
    onError: (e) => toast.error(errorMessage(e)),
  });
  if (
    (product.error as { response?: { status?: number } } | null)?.response
      ?.status === 404
  )
    return <NotFoundPage />;
  if (product.isPending)
    return (
      <div className="container-main section">
        <div
          className="product-detail skeleton min-h-[500px]"
          aria-label="Loading product"
        />
      </div>
    );
  if (product.isError || !product.data)
    return (
      <div className="container-main section data-notice">
        <h1>Product unavailable</h1>
        <p>
          This product may no longer be available, or the connection was
          interrupted.
        </p>
        <button className="action action-red" onClick={() => product.refetch()}>
          Try again
        </button>
        <Link to="/products">Back to the range</Link>
      </div>
    );
  const p = product.data;
  const variants = p.variants?.filter((v) => v.isActive) || [];
  const { groups, rows } = productOptions(variants);
  const selection = effectiveSelection(groups, selected);
  const variant = selectedVariant(groups, rows, selection);
  const { facts, tiers } = productFacts(p.fullDesc);
  const isOptionFact = (name: string) =>
    groups.some(
      (g) =>
        g.name.toLowerCase() === name.toLowerCase() ||
        (g.kind === "colour" && /^colou?r$/i.test(name)),
    );
  const specifications = facts.filter(
    (f) => !isOptionFact(f.name) && !/pric/i.test(f.name),
  );
  // Attribute choices and specification cards replace the old repeated text lists.
  const descriptionHtml = p.fullDesc?.replace(
    /<p>\s*<strong>([\s\S]*?)<\/strong>[\s\S]*?<\/p>/gi,
    (paragraph, heading: string) => {
      const name = heading
        .replace(/<[^>]*>/g, "")
        .replace(/:$/, "")
        .trim();
      return specifications.some((f) => f.name === name) ||
        isOptionFact(name) ||
        (tiers.length && /pricing$/i.test(name))
        ? ""
        : paragraph;
    },
  );
  const missing = groups.filter((g) => !selection[g.key]);
  const quoteOnly = p.purchaseMode === "quote_only";
  const images = p.images || [];
  const activePhoto = images[photo] || images[0];
  const summary = groups
    .map((g) => g.choices.find((c) => c.value === selection[g.key])?.label)
    .filter(Boolean)
    .join(" / ");
  function selectOption(key: string, value: string) {
    setSelected(chooseOption(groups, rows, selection, key, value));
    const associated = rows
      .filter((r) => r.values[key] === value)
      .map((r) => r.variant.id);
    const imageIndex = images.findIndex(
      (i) => i.variantId && associated.includes(i.variantId),
    );
    if (imageIndex >= 0) setPhoto(imageIndex);
  }
  function movePhoto(direction: number) {
    setPhoto((photo + direction + images.length) % images.length);
  }
  const min = p.minimumOrderQuantity || 1;
  const step = p.quantityIncrement || 1;
  const quantity = quantityInput ?? min;
  const valid =
    !!variant &&
    Number.isInteger(quantity) &&
    quantity >= min &&
    quantity <= 1000000 &&
    (quantity - min) % step === 0;
  function addTo(kind: "cart" | "quotes") {
    if (!variant || !valid) return;
    const lines = useBasket.getState()[kind];
    const existing = lines.find((l) => l.variantId === variant.id);
    if (
      (!existing && lines.length >= 100) ||
      (existing &&
        ((existing.quantity + quantity - min) % step !== 0 ||
          existing.quantity + quantity > 1000000))
    ) {
      toast.error(
        "Please adjust the existing basket quantity before adding more.",
      );
      return;
    }
    add(kind, variant.id, quantity);
    toast.success(
      kind === "cart"
        ? "Added to your shopping bag"
        : "Added to your quote basket",
    );
  }
  return (
    <>
      <SEOHead
        title={p.name}
        description={p.purchaseMode === "quote_only" ? `${p.name} from Team Core Sports Wear. Request a team quotation with your quantities, sizes and artwork.` : p.shortDesc}
        image={p.images?.[0]?.url}
        breadcrumbs={[
          { name: "The collection", path: "/products" },
          ...(p.category?.slug ? [{ name: p.category.name, path: `/categories/${p.category.slug}` }] : []),
          { name: p.name, path: `/products/${p.slug}` },
        ]}
      />
      <div className="container-main section">
        <nav className="breadcrumb-line pdp-breadcrumb" aria-label="Breadcrumb">
          <Link to="/products">The collection</Link>
          <span>/</span>
          {p.category?.slug && <><Link to={`/categories/${p.category.slug}`}>{p.category.name}</Link><span>/</span></>}
          <span aria-current="page">{p.name}</span>
        </nav>
        <div className="pdp-layout">
          <section className="pdp-gallery" aria-label="Product images">
            <div className="pdp-image-stage">
              {activePhoto ? (
                <button
                  className="pdp-image-open"
                  ref={zoomTrigger}
                  onClick={() => setZoom(true)}
                  aria-label="Enlarge product image"
                >
                  <img
                    src={activePhoto.url}
                    alt={activePhoto.altText || p.name}
                    width="800"
                    height="800"
                  />
                  <span className="pdp-zoom">
                    <ZoomIn size={18} /> Explore the details
                  </span>
                </button>
              ) : (
                <div className="product-monogram">
                  TC<span>TEAM CORE</span>
                </div>
              )}
              {images.length > 1 && (
                <div className="pdp-gallery-controls">
                  <button
                    onClick={() => movePhoto(-1)}
                    aria-label="Previous image"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <span aria-live="polite">
                    {photo + 1} / {images.length}
                  </span>
                  <button onClick={() => movePhoto(1)} aria-label="Next image">
                    <ChevronRight size={20} />
                  </button>
                </div>
              )}
            </div>
            <div className="pdp-thumbnails">
              {images.map((i, n) => (
                <button
                  key={i.id}
                  aria-label={`View image ${n + 1}`}
                  aria-pressed={photo === n}
                  onClick={() => setPhoto(n)}
                >
                  <img
                    src={i.url}
                    alt=""
                    width="80"
                    height="80"
                    loading="lazy"
                  />
                </button>
              ))}
            </div>
            <div className="pdp-gallery-note">
              <span className="eyebrow">Team Core Sports Wear</span>
              <span>Your team. Your colours.</span>
            </div>
          </section>
          <section className="pdp-panel" aria-labelledby="product-title">
            <div className="pdp-kicker">
              <span className="eyebrow">
                {p.category?.name || "The collection"}
              </span>
              <span className="pdp-badge">
                {quoteOnly ? "Made for your order" : "Find your fit"}
              </span>
            </div>
            <h1 id="product-title">{p.name}</h1>
            <div className="pdp-price-block">
              <p className="pdp-price">
                {quoteOnly
                  ? "Request a quotation"
                  : formatPrice(variant?.price ?? p.basePrice, p.currency)}
              </p>
              <p>
                {quoteOnly
                  ? "Select your options. We’ll confirm availability, delivery and your final price."
                  : "Choose your options and quantity to build your order."}
              </p>
            </div>
            {tiers.length > 0 && (
              <section
                className="pdp-tier-section"
                aria-label="Reference quantity pricing"
              >
                <div className="pdp-section-label">
                  <FileText size={17} />
                  <h2>Quantity pricing</h2>
                  <span>Reference only</span>
                </div>
                <div className="pdp-tiers">
                  {tiers.map((tier, i) => (
                    <div className="pdp-tier" key={i}>
                      <span>{tier.range} units</span>
                      <strong>{formatPrice(tier.price, tier.currency)}</strong>
                      <small>per {tier.unit}</small>
                    </div>
                  ))}
                </div>
                <p className="pdp-fine-print">
                  Indicative catalogue prices. Your quotation confirms the price
                  for your specification and quantity.
                </p>
              </section>
            )}
            <div className="pdp-order-facts">
              <div>
                <Package size={19} />
                <span>
                  {quoteOnly && min === 1
                    ? "Production minimum"
                    : "Minimum order"}
                  <strong>
                    {quoteOnly && min === 1 ? (
                      "Confirm in quotation"
                    ) : (
                      <>
                        {min} {min === 1 ? "unit" : "units"}
                      </>
                    )}
                  </strong>
                </span>
              </div>
              <div>
                <Layers size={19} />
                <span>
                  Order increments
                  <strong>
                    {step} {step === 1 ? "unit" : "units"}
                  </strong>
                </span>
              </div>
              <div>
                <Check size={19} />
                <span>
                  Your partner<strong>Team Core Sports Wear</strong>
                </span>
              </div>
            </div>
            <div className="pdp-configurator" id="product-options">
              <div className="pdp-section-label">
                <h2>Make it yours</h2>
                <span>
                  {groups.length} option{" "}
                  {groups.length === 1 ? "group" : "groups"}
                </span>
              </div>
              {groups.map((group) => {
                const Icon =
                  group.kind === "colour"
                    ? Palette
                    : group.kind === "size"
                      ? Ruler
                      : Layers;
                const chosen = group.choices.find(
                  (c) => c.value === selection[group.key],
                );
                return (
                  <fieldset className="pdp-option-group" key={group.key}>
                    <legend>
                      <Icon size={17} />
                      <span>{group.name}</span>
                      {chosen && <strong>{chosen.label}</strong>}
                    </legend>
                    <div className={`pdp-options pdp-options-${group.kind}`}>
                      {group.choices.map((choice) => {
                        const isSelected =
                          selection[group.key] === choice.value;
                        const colour =
                          group.kind === "colour"
                            ? swatch(choice.value, choice.label)
                            : undefined;
                        return (
                          <button
                            key={choice.value}
                            type="button"
                            className="pdp-option"
                            aria-pressed={isSelected}
                            aria-label={`${group.name}: ${choice.label}`}
                            onClick={() =>
                              selectOption(group.key, choice.value)
                            }
                          >
                            {group.kind === "colour" && (
                              <span
                                className={`pdp-swatch${colour ? "" : " pdp-swatch-unknown"}`}
                                style={
                                  colour
                                    ? { backgroundColor: colour }
                                    : undefined
                                }
                              >
                                {!colour && <Palette size={14} />}
                              </span>
                            )}
                            <span>{choice.label}</span>
                            {isSelected && (
                              <Check size={14} className="pdp-option-check" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </fieldset>
                );
              })}
              {groups.some((g) => g.kind === "size") && (
                <Link className="pdp-size-help" to="/size-guide">
                  <Ruler size={16} /> Need help with sizing?{" "}
                  <ArrowUpRight size={14} />
                </Link>
              )}
              <div
                className={`pdp-selection ${variant ? "is-complete" : ""}`}
                aria-live="polite"
              >
                {variant ? (
                  <>
                    <Check size={18} />
                    <div>
                      <strong>{summary || "Your selection is ready"}</strong>
                      <small>Product code: {variant.sku}</small>
                    </div>
                  </>
                ) : (
                  <>
                    <Layers size={18} />
                    <div>
                      <strong>
                        {missing.length
                          ? `Choose ${missing.map((g) => g.name.toLowerCase()).join(" and ")}`
                          : "No matching option available"}
                      </strong>
                      <small>
                        Only valid combinations can be added to your order.
                      </small>
                    </div>
                  </>
                )}
              </div>
              <div className="pdp-quantity-row">
                <div>
                  <label htmlFor="quantity">Quantity</label>
                  <span>
                    {quoteOnly && min === 1 ? (
                      "Enquiry quantity · production minimum confirmed in quotation"
                    ) : (
                      <>
                        Minimum {min} · increments of {step}
                      </>
                    )}
                  </span>
                </div>
                <div className="pdp-stepper">
                  <button
                    onClick={() =>
                      setQuantity(
                        Math.max(
                          min,
                          (Number.isFinite(quantity) ? quantity : min) - step,
                        ),
                      )
                    }
                    disabled={quantity <= min}
                    aria-label="Decrease quantity"
                  >
                    <Minus size={16} />
                  </button>
                  <input
                    id="quantity"
                    type="number"
                    min={min}
                    max={1000000}
                    step={step}
                    value={Number.isNaN(quantity) ? "" : quantity}
                    onChange={(e) => setQuantity(e.target.valueAsNumber)}
                    aria-invalid={
                      !Number.isInteger(quantity) ||
                      quantity < min ||
                      quantity > 1000000 ||
                      (quantity - min) % step !== 0
                    }
                  />
                  <button
                    onClick={() =>
                      setQuantity(
                        Math.min(
                          1000000,
                          (Number.isFinite(quantity) ? quantity : min) + step,
                        ),
                      )
                    }
                    disabled={quantity + step > 1000000}
                    aria-label="Increase quantity"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>
              {(!Number.isInteger(quantity) ||
                quantity < min ||
                quantity > 1000000 ||
                (quantity - min) % step !== 0) && (
                <p className="form-error" role="alert">
                  Choose a whole quantity between {min} and 1,000,000, in
                  increments of {step}.
                </p>
              )}
              <div className="pdp-actions">
                {p.purchaseMode !== "quote_only" && (
                  <button
                    className="action action-red"
                    disabled={!valid}
                    onClick={() => addTo("cart")}
                  >
                    <ShoppingBag size={18} /> Add to bag{" "}
                    <ArrowUpRight size={19} />
                  </button>
                )}
                {p.purchaseMode !== "direct" && (
                  <button
                    className={`action ${quoteOnly ? "action-red" : "action-outline"}`}
                    disabled={!valid}
                    onClick={() => addTo("quotes")}
                  >
                    <FileText size={18} /> Add to quote basket{" "}
                    <ArrowUpRight size={19} />
                  </button>
                )}
              </div>
              {!variants.length && (
                <p className="form-error">
                  This product has no available variants. Please contact us.
                </p>
              )}
              <div className="pdp-secondary-actions">
                <button
                  disabled={!variant || save.isPending}
                  onClick={() => {
                    if (!signedIn) {
                      navigate("/login", {
                        state: { from: "/products/" + slug },
                      });
                      return;
                    }
                    if (variant) save.mutate(variant.id);
                  }}
                >
                  <Heart size={17} />
                  {save.isPending ? "Saving…" : "Save selection"}
                </button>
                <Link to="/contact">
                  Ask our team <ArrowUpRight size={16} />
                </Link>
              </div>
            </div>
            {templates.data?.some((t) => t.product_id === p.id) && (
              <Link
                className="pdp-studio"
                to={`/design-studio?product=${p.id}`}
              >
                <Sparkles size={23} />
                <span>
                  <strong>Your team. Your identity.</strong>
                  <small>Personalize this garment in Design Studio</small>
                </span>
                <ArrowUpRight size={22} />
              </Link>
            )}
            <p className="pdp-assurance">
              <Check size={17} /> Shopping directly with Team Core Sports Wear.
              Delivery and final totals are confirmed before payment.
            </p>
          </section>
        </div>
        {specifications.length > 0 && (
          <section className="pdp-specs" aria-labelledby="specs-title">
            <div>
              <p className="eyebrow">THE FINER POINTS</p>
              <h2 id="specs-title">At a glance.</h2>
            </div>
            <dl>
              {specifications.map((fact, i) => (
                <div key={i}>
                  <dt>{fact.name}</dt>
                  <dd>{fact.value}</dd>
                </div>
              ))}
            </dl>
          </section>
        )}
        <Dialog open={zoom} onOpenChange={setZoom}>
          <DialogContent
            className="pdp-lightbox"
            onCloseAutoFocus={(event) => {
              event.preventDefault();
              zoomTrigger.current?.focus();
            }}
          >
            <DialogTitle>Product gallery</DialogTitle>
            <DialogDescription>
              Image {photo + 1} of {images.length}. Use the arrows to explore
              available views.
            </DialogDescription>
            {activePhoto && (
              <img src={activePhoto.url} alt={activePhoto.altText || p.name} />
            )}
            <div className="pdp-lightbox-nav">
              <button
                onClick={() => movePhoto(-1)}
                disabled={images.length < 2}
                aria-label="Previous enlarged image"
              >
                <ChevronLeft size={22} />
              </button>
              <span>
                {photo + 1} / {images.length}
              </span>
              <button
                onClick={() => movePhoto(1)}
                disabled={images.length < 2}
                aria-label="Next enlarged image"
              >
                <ChevronRight size={22} />
              </button>
            </div>
          </DialogContent>
        </Dialog>

        <div className="product-information">
          <section>
            <p className="eyebrow">THE DETAILS</p>
            <h2>Know your gear.</h2>
            {typeof window === "undefined" ? (
              <p>{p.shortDesc}</p>
            ) : (
              <div
                className="prose-content"
                dangerouslySetInnerHTML={{
                  __html: sanitizeHtml(
                    descriptionHtml ||
                      p.shortDesc ||
                      "Ask our team for detailed specifications for this product.",
                  ),
                }}
              />
            )}
          </section>
          <aside>
            <h3>Good to know</h3>
            <Link to="/size-guide">Sizing guidance ↗</Link>
            <Link to="/shipping-delivery">Delivery information ↗</Link>
            <Link to="/returns-refunds">Returns & support ↗</Link>
            <Link to="/wholesale">Buying for your team ↗</Link>
          </aside>
        </div>
        <section className="section">
          <p className="eyebrow">FROM OUR CUSTOMERS</p>
          <h2 className="content-title">Real experiences.</h2>
          {reviews.isPending ? (
            <p>Loading reviews…</p>
          ) : reviews.isError ? (
            <p>Reviews are temporarily unavailable.</p>
          ) : !reviews.data?.length ? (
            <p>No published reviews for this product yet.</p>
          ) : (
            reviews.data.map((r) => (
              <article className="py-6 border-b" key={r.id}>
                <p className="font-semibold">
                  {r.firstName || "Customer"} · {r.rating} / 5
                  {r.isVerified ? " · Verified purchase" : ""}
                </p>
                {r.title && <h3 className="font-bold mt-3">{r.title}</h3>}
                <p className="mt-2">{r.body}</p>
                {r.sellerReply && (
                  <p className="bg-surface p-4 mt-4">
                    Team Core Sports Wear: {r.sellerReply}
                  </p>
                )}
              </article>
            ))
          )}
        </section>
        {p.category?.slug && (
          <ProductShelf
            contained
            eyebrow="MORE FOR YOUR SPORT"
            title="Find another look for your team."
            params={relatedCollection(p.category.slug)}
            href={`/categories/${encodeURIComponent(p.category.slug)}`}
            excludeSlug={p.slug}
          />
        )}
        <PersonalizationGuide contained />
        <RecentlyViewed contained excludeSlug={p.slug} />
      </div>
    </>
  );
}
