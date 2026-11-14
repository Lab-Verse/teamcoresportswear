import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, Shirt } from "lucide-react";
import { formatPrice } from "@/lib/format";
import type { Product } from "@/types";
interface Props {
  product?: Product;
  flashPrice?: number;
  compact?: boolean;
  className?: string;
  onAddToCart?: () => void;
  onToggleWishlist?: () => void;
  isWishlisted?: boolean;
}
export function ProductCard({ product, className = "" }: Props) {
  const [failed, setFailed] = useState(false);
  if (!product) return null;
  const photo = product.images?.find((i) => i.isPrimary) || product.images?.[0];
  const quote = product.purchaseMode === "quote_only";
  return (
    <article className={`sport-product tc-product ${className}`}>
      <Link
        to={`/products/${product.slug}`}
        className="sport-product-image"
        aria-label={`View ${product.name}`}
      >
        {photo && !failed ? (
          <img
            src={photo.url}
            alt={photo.altText || product.name}
            width="550"
            height="550"
            loading="lazy"
            onError={() => setFailed(true)}
          />
        ) : (
          <div className="product-monogram">
            <Shirt size={65} aria-hidden="true" />
            <span>TEAM CORE</span>
          </div>
        )}
        <span className="product-mode">
          {quote ? "CUSTOM ORDER" : "EXPLORE UNIFORM"}
        </span>
        <span className="product-arrow">
          <ArrowUpRight size={19} />
        </span>
      </Link>
      <div className="sport-product-info">
        <p>{product.category?.name || "Team Core Sports Wear"}</p>
        <h3>
          <Link to={`/products/${product.slug}`}>{product.name}</Link>
        </h3>
        <div className="tc-product-facts">
          <span>
            {quote
              ? "Request pricing"
              : formatPrice(product.basePrice, product.currency)}
          </span>
          {product.minimumOrderQuantity && (
            <small>
              {quote && product.minimumOrderQuantity === 1 ? (
                "Quantity by quotation"
              ) : (
                <>
                  Min. {product.minimumOrderQuantity}{" "}
                  {product.minimumOrderQuantity === 1 ? "unit" : "units"}
                </>
              )}
            </small>
          )}
        </div>
        <Link className="tc-product-detail" to={`/products/${product.slug}`}>
          View details <ArrowUpRight size={15} />
        </Link>
      </div>
    </article>
  );
}
