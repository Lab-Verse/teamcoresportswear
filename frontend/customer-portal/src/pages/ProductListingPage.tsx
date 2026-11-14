import { Link, useParams, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Search, ArrowUpRight, SlidersHorizontal } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import { storefront } from "@/services/storefront";
import { ProductCard } from "@/components/product/ProductCard";
import { SEOHead } from "@/components/common/SEOHead";
import { NotFoundPage } from "@/pages/InformationPage";
import { BulkOrderFinder } from "@/components/discovery/BuyerGuides";
import { RecentlyViewed } from "@/components/discovery/RecentlyViewed";
import { sports } from "@/config/brand";
import { listingPageSize } from "@/lib/seo";
export default function ProductListingPage() {
  const [params, setParams] = useSearchParams();
  const { slug } = useParams();
  const page = Math.max(1, Number(params.get("page")) || 1);
  const categories = useQuery({
    queryKey: ["storefront", "categories"],
    queryFn: storefront.categories,
  });
  const category = categories.data?.find((c) => c.slug === slug);
  const sport = sports.find((s) => s.slug === slug);
  const title = category ? `Custom ${category.name} Uniforms` : "Custom Sports Uniform Catalogue";
  const description = sport
    ? `${sport.description} Explore Team Core designs for your squad and request a quote with your quantities, sizes and artwork.`
    : "Browse custom uniforms for six sports. Compare team kit designs and build a quotation request with your selected products and quantities.";
  const filter = {
    page,
    limit: listingPageSize,
    search: params.get("search") || "",
    categorySlug: slug || params.get("category") || "",
    sort: params.get("sort") || "newest",
    mode: params.get("mode") || "",
  };
  const products = useQuery({
    queryKey: ["storefront", "products", filter],
    queryFn: () => storefront.products(filter),
  });
  function change(key: string, value: string) {
    const p = new URLSearchParams(params);
    if (value) p.set(key, value);
    else p.delete(key);
    p.delete("page");
    setParams(p);
  }
  function pageLink(next: number) {
    const query = new URLSearchParams(params);
    if (next === 1) query.delete("page");
    else query.set("page", String(next));
    return { search: query.toString() };
  }
  if (slug && categories.isSuccess && !category) return <NotFoundPage />;
  return (
    <>
      <SEOHead
        title={
          filter.search
            ? `Search: ${filter.search}`
            : title + (page > 1 ? ` – Page ${page}` : "")
        }
        description={description}
      />
      <div className="page-intro">
        <div className="container-main">
          <p className="eyebrow">Team Core Sports Wear / THE COLLECTION</p>
          <h1>
            {filter.search
              ? `Results for “${filter.search}”`
              : title}
          </h1>
          <p>{description}</p>
        </div>
      </div>
      <div className="container-main catalog-layout">
        <aside className="catalog-sidebar">
          <h2>Shop by category</h2>
          <Link
            className={!filter.categorySlug ? "selected" : ""}
            to="/products"
          >
            All products <ArrowUpRight size={16} />
          </Link>
          {categories.data?.map((c) => (
            <Link
              key={c.id}
              className={filter.categorySlug === c.slug ? "selected" : ""}
              to={`/categories/${c.slug}`}
            >
              {c.name}
              <ArrowUpRight size={16} />
            </Link>
          ))}
          <div className="catalog-help">
            <span>Buying in bulk?</span>
            <p>A tailored quotation starts with your requirements.</p>
            <Link to="/wholesale">Let's talk ↗</Link>
          </div>
        </aside>
        <section className="catalog-results">
          <div className="catalog-toolbar">
            <Sheet>
              <SheetTrigger asChild>
                <button className="tc-filter-trigger">
                  <SlidersHorizontal size={16} /> Filters
                </button>
              </SheetTrigger>
              <SheetContent
                side="left"
                className="tc-filter-drawer"
                aria-describedby={undefined}
              >
                <SheetTitle>Find your uniform</SheetTitle>
                <nav aria-label="Filter by sport">
                  <SheetClose asChild>
                    <Link
                      className={!filter.categorySlug ? "selected" : ""}
                      to="/products"
                    >
                      All sports
                    </Link>
                  </SheetClose>
                  {categories.data?.map((c) => (
                    <SheetClose asChild key={c.id}>
                      <Link
                        className={
                          filter.categorySlug === c.slug ? "selected" : ""
                        }
                        key={c.id}
                        to={`/categories/${c.slug}`}
                      >
                        {c.name}
                      </Link>
                    </SheetClose>
                  ))}
                </nav>
                <label>
                  Order type
                  <select
                    value={filter.mode}
                    onChange={(e) => change("mode", e.target.value)}
                  >
                    <option value="">All uniforms</option>
                    <option value="direct">Buy online</option>
                    <option value="quote">Request a quote</option>
                  </select>
                </label>
                <label>
                  Sort by
                  <select
                    value={filter.sort}
                    onChange={(e) => change("sort", e.target.value)}
                  >
                    <option value="newest">Newest</option>
                    <option value="name_asc">Name</option>
                    <option value="price_asc">Price: low to high</option>
                    <option value="price_desc">Price: high to low</option>
                  </select>
                </label>
                <p className="text-sm text-text-muted">
                  Choose your size and other available options on the product
                  page.
                </p>
              </SheetContent>
            </Sheet>
            <span aria-live="polite">
              {products.isPending
                ? "Loading products…"
                : `${products.data?.total || 0} products`}
            </span>
            <label>
              Purchase type
              <select
                value={filter.mode}
                onChange={(e) => change("mode", e.target.value)}
              >
                <option value="">All products</option>
                <option value="direct">Buy online</option>
                <option value="quote">Request a quote</option>
              </select>
            </label>
            <label>
              Sort by
              <select
                value={filter.sort}
                onChange={(e) => change("sort", e.target.value)}
              >
                <option value="newest">Newest</option>
                <option value="name_asc">Name</option>
                <option value="price_asc">Price: low to high</option>
                <option value="price_desc">Price: high to low</option>
              </select>
            </label>
          </div>
          {(filter.mode || filter.search || filter.categorySlug) && (
            <div className="tc-active-filters">
              <span>
                {filter.search && `Search: ${filter.search} · `}
                {category?.name || ""}
                {filter.mode &&
                  ` · ${filter.mode === "quote" ? "Quote available" : "Buy online"}`}
              </span>
              <Link to="/products">Clear filters</Link>
            </div>
          )}
          {products.isPending ? (
            <div className="product-grid catalog-grid">
              {[0, 1, 2, 3, 4, 5].map((n) => (
                <div className="product-placeholder skeleton" key={n} />
              ))}
            </div>
          ) : products.isError ? (
            <div className="data-notice" role="alert">
              <h2>We couldn't load the range.</h2>
              <button
                className="action action-red"
                onClick={() => products.refetch()}
              >
                Try again
              </button>
            </div>
          ) : !products.data?.data.length ? (
            <div className="data-notice">
              <Search />
              <h2>No products match just yet.</h2>
              <p>Try a different search or explore all categories.</p>
              <Link className="text-link" to="/products">
                Clear filters →
              </Link>
            </div>
          ) : (
            <>
              <div className="product-grid catalog-grid">
                {products.data.data.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
              <nav className="pagination" aria-label="Product pages">
                {page > 1 ? <Link to={pageLink(page - 1)}>← Previous</Link> : <button disabled>← Previous</button>}
                <span>
                  Page {page} of {products.data.totalPages}
                </span>
                {page < products.data.totalPages ? <Link to={pageLink(page + 1)}>Next →</Link> : <button disabled>Next →</button>}
              </nav>
            </>
          )}
        </section>
      </div>
      <BulkOrderFinder />
      <RecentlyViewed />
    </>
  );
}
