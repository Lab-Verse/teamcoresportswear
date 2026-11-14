export type CollectionParams = {
  limit: number;
  sort: string;
  categorySlug?: string;
  mode?: string;
};
export const collectionKey = (params: CollectionParams) => [
  "storefront",
  "collection",
  params,
];
export const latestCollection: CollectionParams = { limit: 4, sort: "newest" };
export const quoteCollection: CollectionParams = {
  limit: 4,
  sort: "name_asc",
  mode: "quote",
};
export const sportCollection = (categorySlug: string): CollectionParams => ({
  limit: 4,
  sort: "newest",
  categorySlug,
});
export const relatedCollection = (categorySlug: string): CollectionParams => ({
  limit: 5,
  sort: "newest",
  categorySlug,
});
