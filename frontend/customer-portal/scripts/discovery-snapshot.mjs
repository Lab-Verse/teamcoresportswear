// Route-specific public collections use the same parameters as browser queries.
export async function discoverySnapshot(path, categories, product, get) {
  const params = [];
  if (["/", "/categories"].includes(path)) {
    const category =
      categories.find((c) => c.slug === "soccer") || categories[0];
    if (category)
      params.push({ limit: 4, sort: "newest", categorySlug: category.slug });
  }
  if (
    [
      "/",
      "/about",
      "/wholesale",
      "/custom-uniforms",
      "/private-label",
    ].includes(path)
  )
    params.push({ limit: 4, sort: "name_asc", mode: "quote" });
  if (product?.category?.slug)
    params.push({
      limit: 5,
      sort: "newest",
      categorySlug: product.category.slug,
    });
  return Promise.all(
    params.map(async (params) => ({
      params,
      products: await get(
        "/storefront/products?" + new URLSearchParams(params),
      ),
    })),
  );
}
