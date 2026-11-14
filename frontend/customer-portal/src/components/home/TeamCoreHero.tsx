import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
  Shirt,
} from "lucide-react";
import { storefront } from "@/services/storefront";
import { collectionKey, sportCollection } from "@/lib/collections";
import { sports } from "@/config/brand";

function subscribeMotion(listener: () => void) {
  const media = window.matchMedia("(prefers-reduced-motion: reduce)");
  media.addEventListener("change", listener);
  return () => media.removeEventListener("change", listener);
}
function subscribeVisibility(listener: () => void) {
  document.addEventListener("visibilitychange", listener);
  return () => document.removeEventListener("visibilitychange", listener);
}
function HeroImage({
  url,
  name,
  position,
}: {
  url: string;
  name: string;
  position: number;
}) {
  const [failed, setFailed] = useState(false);
  return (
    <div className={`tc-carousel-garment tc-carousel-garment-${position}`}>
      {failed ? (
        <div className="tc-carousel-image-fallback">
          <Shirt size={70} />
          <span>{name}</span>
        </div>
      ) : (
        <img
          src={url}
          alt={name}
          width="550"
          height="550"
          fetchPriority={position === 1 ? "high" : "auto"}
          draggable={false}
          onError={() => setFailed(true)}
        />
      )}
    </div>
  );
}
export function TeamCoreHero() {
  const categories = useQuery({
    queryKey: ["storefront", "categories"],
    queryFn: storefront.categories,
  });
  const ordered = [
    "soccer",
    "basketball",
    "american-football",
    "baseball",
    "ice-hockey",
    "rugby",
  ];
  const slides = categories.data
    ? ordered.flatMap(
        (slug) => categories.data?.find((c) => c.slug === slug) || [],
      )
    : [];
  const [index, setIndex] = useState(0);
  const [auto, setAuto] = useState(true);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const startX = useRef<number | null>(null);
  const reduced = useSyncExternalStore(
    subscribeMotion,
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => true,
  );
  const visible = useSyncExternalStore(
    subscribeVisibility,
    () => document.visibilityState === "visible",
    () => false,
  );
  const activeIndex = slides.length ? index % slides.length : 0;
  const active = slides[activeIndex];
  const params = sportCollection(active?.slug || "soccer");
  const products = useQuery({
    queryKey: collectionKey(params),
    queryFn: () => storefront.products(params),
    enabled: !!active,
  });
  const nextParams = sportCollection(
    slides[(activeIndex + 1) % slides.length]?.slug || "soccer",
  );
  useQuery({
    queryKey: collectionKey(nextParams),
    queryFn: () => storefront.products(nextParams),
    enabled: typeof window !== "undefined" && slides.length > 1,
  });
  useEffect(() => {
    if (!auto || hovered || focused || reduced || !visible || slides.length < 2)
      return;
    const timer = window.setInterval(
      () => setIndex((i) => (i + 1) % slides.length),
      7000,
    );
    return () => window.clearInterval(timer);
  }, [auto, hovered, focused, reduced, visible, slides.length]);
  function go(next: number) {
    setAuto(false);
    setIndex((next + slides.length) % slides.length);
  }
  const garments =
    products.data?.data.filter((p) => p.images?.length).slice(0, 1) || [];
  const description = sports.find((s) => s.slug === active?.slug)?.description;
  return (
    <section
      className="tc-carousel"
      aria-label="Team Core uniform collections"
      aria-roledescription="carousel"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocusCapture={() => setFocused(true)}
      onBlurCapture={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null))
          setFocused(false);
      }}
      onKeyDown={(e) => {
        if (slides.length > 1 && ["ArrowLeft", "ArrowRight"].includes(e.key)) {
          e.preventDefault();
          go(activeIndex + (e.key === "ArrowRight" ? 1 : -1));
        }
      }}
    >
      <div className="container-main tc-carousel-inner">
        <div className="tc-carousel-copy">
          <p className="eyebrow">
            <span /> CUSTOM SPORTSWEAR · SIALKOT, PAKISTAN
          </p>
          <h1>
            TEAM CORE
            <br />
            SPORTS WEAR.
            <br />
            <em>
              MADE FOR
              <br />
              YOUR TEAM.
            </em>
          </h1>
          <p>
            Custom sports uniforms for clubs, schools and apparel brands. Bring
            your colours, your players and your identity into every detail.
          </p>
          <div className="tc-carousel-actions">
            <Link
              className="action action-red"
              to={
                active
                  ? `/categories/${encodeURIComponent(active.slug)}`
                  : "/products"
              }
            >
              Explore {active?.name || "uniforms"} <ArrowRight size={18} />
            </Link>
            <Link className="action tc-carousel-quote" to="/wholesale">
              Request a quote <ArrowRight size={18} />
            </Link>
          </div>
          <p className="tc-carousel-footnote">
            Your sport. Your design. A clear path to your next kit.
          </p>
        </div>
        <div className="tc-carousel-stage-wrap">
          <div
            className="tc-carousel-stage"
            onPointerDown={(e) => {
              startX.current = e.clientX;
            }}
            onPointerUp={(e) => {
              const delta =
                startX.current === null ? 0 : e.clientX - startX.current;
              startX.current = null;
              if (slides.length > 1 && Math.abs(delta) > 45)
                go(activeIndex + (delta < 0 ? 1 : -1));
            }}
            onPointerCancel={() => {
              startX.current = null;
            }}
          >
            <div className="tc-carousel-halo" aria-hidden="true" />
            <div
              className="tc-carousel-products"
              key={active?.slug || "loading"}
              role="group"
              aria-roledescription="slide"
              aria-label={
                active
                  ? `${activeIndex + 1} of ${slides.length}: ${active.name}`
                  : "Team Core collection"
              }
            >
              {categories.isPending || (active && products.isPending) ? (
                <div className="tc-carousel-loading" role="status">
                  <Shirt size={74} strokeWidth={1} />
                  <span>Preparing your team's next look…</span>
                </div>
              ) : categories.isError || products.isError ? (
                <div className="tc-carousel-loading" role="alert">
                  <Shirt size={74} strokeWidth={1} />
                  <span>Uniform images are temporarily unavailable.</span>
                  <button
                    className="text-link"
                    onClick={() => {
                      void categories.refetch();
                      void products.refetch();
                    }}
                  >
                    Reload collection
                  </button>
                </div>
              ) : garments.length ? (
                garments.map((p, i) => (
                  <HeroImage
                    key={p.id}
                    url={
                      (
                        p.images?.find((image) => image.isPrimary) ||
                        p.images?.[0]
                      )?.url || ""
                    }
                    name={p.name}
                    position={garments.length === 1 ? 1 : i}
                  />
                ))
              ) : (
                <div className="tc-carousel-loading">
                  <Shirt size={74} strokeWidth={1} />
                  <span>Tell us about your next custom uniform.</span>
                  <Link className="text-link" to="/contact">
                    Discuss your kit →
                  </Link>
                </div>
              )}
            </div>
            <div className="tc-carousel-platform" aria-hidden="true">
              <span>
                TEAM CORE <b>SPORTS WEAR</b>
              </span>
            </div>
            {slides.length > 1 && (
              <>
                <button
                  className="tc-carousel-arrow tc-carousel-prev"
                  aria-label="Previous uniform collection"
                  onClick={() => go(activeIndex - 1)}
                >
                  <ChevronLeft size={22} />
                </button>
                <button
                  className="tc-carousel-arrow tc-carousel-next"
                  aria-label="Next uniform collection"
                  onClick={() => go(activeIndex + 1)}
                >
                  <ChevronRight size={22} />
                </button>
              </>
            )}
          </div>
          <div className="tc-carousel-caption">
            <span className="eyebrow">
              {active?.name || "THE TEAM CORE COLLECTION"}
            </span>
            <p>
              {description || "Custom uniforms built around your identity."}
            </p>
          </div>
          {slides.length > 1 && (
            <div className="tc-carousel-controls">
              <div role="group" aria-label="Select a uniform collection">
                {slides.map((slide, i) => (
                  <button
                    key={slide.id}
                    className="tc-carousel-dot"
                    aria-label={`Show ${slide.name} uniforms`}
                    aria-pressed={activeIndex === i}
                    onClick={() => go(i)}
                  >
                    <span />
                  </button>
                ))}
              </div>
              {!reduced && (
                <button
                  className="tc-carousel-play"
                  aria-label={
                    auto ? "Pause uniform slideshow" : "Play uniform slideshow"
                  }
                  onClick={() => setAuto((value) => !value)}
                >
                  {auto ? <Pause size={15} /> : <Play size={15} />}
                </button>
              )}
            </div>
          )}
          <span
            className="sr-only"
            role="status"
            aria-live={auto ? "off" : "polite"}
          >
            {active
              ? `${active.name} collection, slide ${activeIndex + 1} of ${slides.length}`
              : "Team Core uniform collection"}
          </span>
        </div>
      </div>
    </section>
  );
}
