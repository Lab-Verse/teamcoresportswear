import { renderToString } from "react-dom/server";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import {
  QueryClient,
  QueryClientProvider,
  dehydrate,
} from "@tanstack/react-query";
import type { HelmetServerState } from "react-helmet-async";
import { HelmetProvider } from "react-helmet-async";
import { MainLayout } from "@/components/layout/MainLayout";
import Home from "@/pages/HomePage";
import Products from "@/pages/ProductListingPage";
import ProductPage from "@/pages/ProductDetailPage";
import Categories from "@/pages/CategoriesPage";
import Information, {
  informationPaths,
  FAQPage,
  NotFoundPage,
} from "@/pages/InformationPage";
import Contact from "@/pages/ContactPage";
import { SEOHead } from "@/components/common/SEOHead";
import type { Product, Category, PaginatedResponse } from "@/types";
import { collectionKey, type CollectionParams } from "@/lib/collections";
import { listingPageSize, seoRoute } from "@/lib/seo";
export { listingPageSize, seoRoute } from "@/lib/seo";
export const publicPaths = [
  "/",
  "/products",
  "/categories",
  "/contact",
  "/faq",
  "/design-studio",
  ...informationPaths,
];
type Snapshot = {
  categories: Category[];
  products: PaginatedResponse<Product>;
  product?: Product;
  collections?: {
    params: CollectionParams;
    products: PaginatedResponse<Product>;
  }[];
};
export function renderRoute(path: string, snapshot: Snapshot, search = "") {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: 60000 } },
  });
  client.setQueryData(["storefront", "categories"], snapshot.categories);
  snapshot.collections?.forEach((c) =>
    client.setQueryData(collectionKey(c.params), c.products),
  );
  if (path === "/")
    client.setQueryData(["storefront", "home"], {
      ...snapshot.products,
      data: snapshot.products.data.slice(0, 8),
    });
  const categorySlug = path.startsWith("/categories/")
    ? decodeURIComponent(path.slice(12))
    : "";
  client.setQueryData(
    [
      "storefront",
      "products",
      {
        page: seoRoute(path, search).page,
        limit: listingPageSize,
        search: "",
        categorySlug,
        sort: "newest",
        mode: "",
      },
    ],
    snapshot.products,
  );
  if (snapshot.product)
    client.setQueryData(
      ["storefront", "product", snapshot.product.slug],
      snapshot.product,
    );
  const context = {} as { helmet?: HelmetServerState };
  const body = renderToString(
    <HelmetProvider context={context}>
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={[path + search]}>
          <Routes>
            <Route element={<MainLayout />}>
              <Route index element={<Home />} />
              <Route path="/products" element={<Products />} />
              <Route path="/products/:slug" element={<ProductPage />} />
              <Route path="/categories" element={<Categories />} />
              <Route path="/categories/:slug" element={<Products />} />
              {informationPaths.map((p) => (
                <Route key={p} path={p} element={<Information />} />
              ))}
              <Route path="/contact" element={<Contact />} />
              <Route path="/faq" element={<FAQPage />} />
              <Route
                path="/design-studio"
                element={
                  <section className="container py-20">
                    <SEOHead
                      title="TEAM CORE Design Studio"
                      description="Design your team's sportswear, personalize every player and request a quotation from Team Core Sports Wear."
                    />
                    <p>TEAM CORE DESIGN STUDIO</p>
                    <h1>Your team. Your signature.</h1>
                    <p>
                      Choose a garment, set your colours, add your artwork and
                      build your squad. Save your design, request a quotation
                      and approve your production proof.
                    </p>
                    <p>Preparing your interactive studio…</p>
                    <noscript>
                      Enable JavaScript to design your kit, or{" "}
                      <a href="/contact">contact TEAM CORE</a> for help.
                    </noscript>
                  </section>
                }
              />
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    </HelmetProvider>,
  );
  const h = context.helmet;
  return {
    body,
    head: h
      ? [h.title, h.meta, h.link, h.script]
          .map((value) => value.toString())
          .join("")
      : "",
    state: JSON.stringify(dehydrate(client)).replace(/</g, "\\u003c"),
  };
}
