import { describe, expect, it } from "vitest";
import { resolveProductCover, resolveProductHero } from "./product-presentation-media";

describe("product presentation media resolver", () => {
  it("prefers the exact cover ratio", () => {
    expect(resolveProductCover({ cover_4_3_url: "cover-4-3", cover_16_9_url: "cover-16-9" }, "4:3"))
      .toEqual({ url: "cover-4-3", isFallback: false, source: "Capa 4:3" });
  });

  it("uses the nearest cover before the legacy image", () => {
    expect(resolveProductCover({ cover_1_1_url: "cover-square", cover_url: "legacy" }, "3:4"))
      .toEqual({ url: "cover-square", isFallback: true, source: "Capa 1:1" });
  });

  it("keeps hero fallback inside hero assets before covers", () => {
    expect(resolveProductHero({ hero_16_9_url: "hero-wide", cover_4_3_url: "cover-4-3" }, "4:3"))
      .toEqual({ url: "hero-wide", isFallback: true, source: "Banner 16:9" });
  });

  it("falls back from hero to the equivalent cover", () => {
    expect(resolveProductHero({ cover_4_3_url: "cover-4-3" }, "4:3"))
      .toEqual({ url: "cover-4-3", isFallback: true, source: "Capa 4:3" });
  });
});