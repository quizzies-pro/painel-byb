export type ProductCoverRatio = "16:9" | "4:3" | "1:1" | "3:4" | "9:16";
export type ProductHeroRatio = "16:9" | "4:3";
export type ProductMediaUsage = "cover" | "hero";

export interface ProductPresentationMedia {
  cover_16_9_url?: string | null;
  cover_4_3_url?: string | null;
  cover_1_1_url?: string | null;
  cover_3_4_url?: string | null;
  cover_9_16_url?: string | null;
  hero_16_9_url?: string | null;
  hero_4_3_url?: string | null;
  cover_url?: string | null;
  banner_url?: string | null;
}

export interface ResolvedProductImage {
  url: string;
  isFallback: boolean;
  source: string | null;
}

const clean = (value?: string | null) => value?.trim() || "";

const coverKeys: Record<ProductCoverRatio, keyof ProductPresentationMedia> = {
  "16:9": "cover_16_9_url",
  "4:3": "cover_4_3_url",
  "1:1": "cover_1_1_url",
  "3:4": "cover_3_4_url",
  "9:16": "cover_9_16_url",
};

const coverFallbackOrder: Record<ProductCoverRatio, ProductCoverRatio[]> = {
  "16:9": ["4:3", "1:1", "3:4", "9:16"],
  "4:3": ["16:9", "1:1", "3:4", "9:16"],
  "1:1": ["4:3", "3:4", "16:9", "9:16"],
  "3:4": ["1:1", "9:16", "4:3", "16:9"],
  "9:16": ["3:4", "1:1", "4:3", "16:9"],
};

export const resolveProductCover = (
  media: ProductPresentationMedia,
  ratio: ProductCoverRatio,
): ResolvedProductImage => {
  const exact = clean(media[coverKeys[ratio]]);
  if (exact) return { url: exact, isFallback: false, source: `Capa ${ratio}` };

  for (const fallbackRatio of coverFallbackOrder[ratio]) {
    const fallback = clean(media[coverKeys[fallbackRatio]]);
    if (fallback) return { url: fallback, isFallback: true, source: `Capa ${fallbackRatio}` };
  }

  const legacy = clean(media.cover_url);
  return { url: legacy, isFallback: Boolean(legacy), source: legacy ? "Imagem legada" : null };
};

export const resolveProductHero = (
  media: ProductPresentationMedia,
  ratio: ProductHeroRatio,
): ResolvedProductImage => {
  const exactKey = ratio === "16:9" ? "hero_16_9_url" : "hero_4_3_url";
  const otherKey = ratio === "16:9" ? "hero_4_3_url" : "hero_16_9_url";
  const exact = clean(media[exactKey]);
  if (exact) return { url: exact, isFallback: false, source: `Banner ${ratio}` };

  const other = clean(media[otherKey]);
  if (other) return { url: other, isFallback: true, source: ratio === "16:9" ? "Banner 4:3" : "Banner 16:9" };

  const legacyBanner = clean(media.banner_url);
  if (legacyBanner) return { url: legacyBanner, isFallback: true, source: "Banner legado" };

  const equivalentCover = clean(media[coverKeys[ratio]]);
  if (equivalentCover) return { url: equivalentCover, isFallback: true, source: `Capa ${ratio}` };

  const cover = resolveProductCover(media, "16:9");
  return { ...cover, isFallback: Boolean(cover.url) };
};

export const resolveProductImage = (
  media: ProductPresentationMedia,
  usage: ProductMediaUsage,
  ratio: ProductCoverRatio,
) => usage === "hero"
  ? resolveProductHero(media, ratio === "4:3" ? "4:3" : "16:9")
  : resolveProductCover(media, ratio);