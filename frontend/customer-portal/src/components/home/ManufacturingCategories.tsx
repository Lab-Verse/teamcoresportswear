import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import useEmblaCarousel from "embla-carousel-react";
import { ArrowLeft, ArrowRight, Shirt } from "lucide-react";
import type { Category } from "@/types";

const featuredSlugs = [
  "catalog-sportswear-training-fitness-hoodies",
  "catalog-sportswear-team-sports-soccer",
  "catalog-sportswear-training-fitness-tracksuits",
  "catalog-sportswear-team-sports-basketball",
  "catalog-sportswear-team-sports-t-shirts",
  "catalog-sportswear-team-sports-polo",
  "catalog-teamcore-leather-311-228-jackets",
  "catalog-teamcore-leather-311-230-leather-vest",
  "catalog-teamcore-leather-312-232-jackets",
  "catalog-teamcore-leather-212-213-motorbike-suits",
  "catalog-teamcore-leather-311-317-gloves",
  "catalog-teamcore-leather-311-236-bags",
];

function categoryCopy(category: Category) {
  if (category.slug.includes("motorbike"))
    return {
      label: "Riding collections · Individual style",
      description:
        "Explore the riding range and discuss materials, sizing and branding for your order.",
    };
  if (category.slug.includes("leather"))
    return {
      label: "Leather & lifestyle · Your collection",
      description:
        "Discover distinctive styles and build a collection around your brand’s requirements.",
    };
  if (/hoodies|tracksuits|t-shirts|polo|tshirt/.test(category.slug))
    return {
      label: "Everyday wear · Team identity",
      description:
        "From training days to everyday layers. Find the right starting point for your next collection.",
    };
  return {
    label: "Teamwear · Made for your game",
    description:
      "Explore gear for your sport, choose your favourites and discuss your team’s requirements.",
  };
}

export function ManufacturingCard({
  category,
  index,
}: {
  category: Category;
  index: number;
}) {
  const [failed, setFailed] = useState(false);
  const copy = categoryCopy(category);
  return (
    <Link className="manufacturing-card" to={`/categories/${category.slug}`}>
      <div className="manufacturing-image">
        {category.imageUrl && !failed ? (
          <img
            src={category.imageUrl}
            alt=""
            loading="lazy"
            width="600"
            height="540"
            onError={() => setFailed(true)}
          />
        ) : (
          <div className="manufacturing-placeholder">
            <Shirt size={88} strokeWidth={1} />
            <span>Team Core Sports Wear</span>
          </div>
        )}
        <span className="manufacturing-image-label" aria-hidden="true">
          THE TEAM CORE COLLECTION
        </span>
      </div>
      <div className="manufacturing-copy">
        <span className="manufacturing-number" aria-hidden="true">
          {String(index + 1).padStart(2, "0")}
          <span />
        </span>
        <h3>{category.name}</h3>
        <p className="manufacturing-label">{copy.label}</p>
        <p className="manufacturing-description">{copy.description}</p>
        <span className="manufacturing-cta">
          Explore collection{" "}
          <span>
            <ArrowRight size={21} />
          </span>
        </span>
      </div>
    </Link>
  );
}

export function ManufacturingCategories({
  categories,
}: {
  categories: Category[];
}) {
  const featured = featuredSlugs.flatMap(
    (slug) => categories.find((c) => c.slug === slug) ?? [],
  );
  const items = featured.length >= 3 ? featured : categories.slice(0, 12);
  const [viewport, api] = useEmblaCarousel({
    align: "start",
    slidesToScroll: "auto",
    containScroll: "trimSnaps",
  });
  const [selected, setSelected] = useState(0);
  const [snaps, setSnaps] = useState<number[]>([]);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);
  const update = useCallback(() => {
    if (!api) return;
    setSelected(api.selectedScrollSnap());
    setSnaps(api.scrollSnapList());
    setCanPrev(api.canScrollPrev());
    setCanNext(api.canScrollNext());
  }, [api]);
  useEffect(() => {
    if (!api) return;
    const frame = requestAnimationFrame(update);
    api.on("select", update).on("reInit", update);
    return () => {
      cancelAnimationFrame(frame);
      api.off("select", update).off("reInit", update);
    };
  }, [api, update]);
  const move = (page: number) =>
    api?.scrollTo(
      page,
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    );
  return (
    <div
      className="manufacturing-carousel"
      role="region"
      aria-label="Featured manufacturing categories"
      aria-roledescription="carousel"
    >
      <div
        className="manufacturing-viewport"
        ref={viewport}
        id="manufacturing-collections"
        tabIndex={0}
        aria-label="Collections. Use left and right arrow keys to browse."
        onKeyDown={(event) => {
          if (event.target !== event.currentTarget) return;
          if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
            event.preventDefault();
            move(selected + (event.key === "ArrowRight" ? 1 : -1));
          }
        }}
      >
        <div className="manufacturing-track">
          {items.map((category, index) => (
            <div
              className="manufacturing-slide"
              key={category.id}
              role="group"
              aria-label={`${index + 1} of ${items.length}`}
              aria-roledescription="slide"
            >
              <ManufacturingCard category={category} index={index} />
            </div>
          ))}
        </div>
      </div>
      <div className="manufacturing-navigation">
        <div
          className="manufacturing-progress"
          aria-live="polite"
          aria-atomic="true"
        >
          <span>{String(selected + 1).padStart(2, "0")}</span>
          <span className="manufacturing-progress-track" aria-hidden="true">
            <span
              style={{
                width: `${((selected + 1) / Math.max(snaps.length, 1)) * 100}%`,
              }}
            />
          </span>
          <span className="sr-only">of </span>
          <span>{String(Math.max(snaps.length, 1)).padStart(2, "0")}</span>
          <span className="sr-only"> collection pages</span>
        </div>
        <div className="manufacturing-dots" aria-label="Choose collection page">
          {snaps.map((_, index) => (
            <button
              key={index}
              type="button"
              aria-label={`Go to collection page ${index + 1}`}
              aria-current={index === selected ? "true" : undefined}
              onClick={() => move(index)}
            >
              <span />
            </button>
          ))}
        </div>
        <div className="manufacturing-arrows">
          <button
            type="button"
            aria-label="Previous collections"
            aria-controls="manufacturing-collections"
            disabled={!canPrev}
            onClick={() => move(selected - 1)}
          >
            <ArrowLeft size={20} />
          </button>
          <button
            type="button"
            aria-label="Next collections"
            aria-controls="manufacturing-collections"
            disabled={!canNext}
            onClick={() => move(selected + 1)}
          >
            <ArrowRight size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
