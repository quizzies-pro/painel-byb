import { ImageIcon } from "lucide-react";
import CoverUpload from "@/components/CoverUpload";
import type { ProductPresentationMedia } from "@/lib/product-presentation-media";
import { resolveProductCover, resolveProductHero } from "@/lib/product-presentation-media";

type MediaField = Exclude<keyof ProductPresentationMedia, "cover_url" | "banner_url">;

interface ProductMediaLibraryProps {
  media: ProductPresentationMedia;
  productId: string;
  onChange: (field: MediaField, url: string) => void;
}

const coverFormats = [
  { field: "cover_16_9_url", ratio: "16:9", dimensions: "1600 × 900 px", aspect: "aspect-video" },
  { field: "cover_4_3_url", ratio: "4:3", dimensions: "1200 × 900 px", aspect: "aspect-[4/3]" },
  { field: "cover_1_1_url", ratio: "1:1", dimensions: "1200 × 1200 px", aspect: "aspect-square" },
  { field: "cover_3_4_url", ratio: "3:4", dimensions: "1200 × 1600 px", aspect: "aspect-[3/4]" },
  { field: "cover_9_16_url", ratio: "9:16", dimensions: "1080 × 1920 px", aspect: "aspect-[9/16]" },
] as const;

const heroFormats = [
  { field: "hero_16_9_url", ratio: "16:9", dimensions: "1920 × 1080 px", aspect: "aspect-video" },
  { field: "hero_4_3_url", ratio: "4:3", dimensions: "1600 × 1200 px", aspect: "aspect-[4/3]" },
] as const;

function MediaSlot({
  field,
  ratio,
  dimensions,
  aspect,
  value,
  fallbackUrl,
  fallbackSource,
  storagePath,
  onChange,
}: {
  field: MediaField;
  ratio: string;
  dimensions: string;
  aspect: string;
  value: string;
  fallbackUrl: string;
  fallbackSource: string | null;
  storagePath: string;
  onChange: (field: MediaField, url: string) => void;
}) {
  const usingFallback = !value.trim() && Boolean(fallbackUrl);
  const previewUrl = value.trim() || fallbackUrl;
  const status = value.trim() ? "Própria" : usingFallback ? "Fallback" : "Pendente";

  return (
    <div className="group min-w-0 rounded-md border border-border bg-background p-3 transition-colors hover:border-muted-foreground/30">
      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex h-14 w-20 shrink-0 items-center justify-center overflow-hidden rounded border border-border bg-muted/30">
          {previewUrl ? (
            <div className={`relative max-h-full max-w-full overflow-hidden ${aspect} ${usingFallback ? "opacity-50" : ""}`}>
              <img src={previewUrl} alt={`${status} ${ratio}`} className="h-full w-full object-cover" />
            </div>
          ) : (
            <ImageIcon className="h-5 w-5 text-muted-foreground/50" />
          )}
        </div>
        <div className="w-28 shrink-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold">{ratio}</p>
            <span className={`h-1.5 w-1.5 rounded-full ${value.trim() ? "bg-foreground" : "bg-muted-foreground/40"}`} />
          </div>
          <p className="mt-0.5 text-[10px] text-muted-foreground">{dimensions}</p>
          <p className="mt-1 text-[10px] font-medium uppercase text-muted-foreground">{status}</p>
        </div>
        <div className="min-w-0 flex-1">
          <CoverUpload
            value={value}
            onChange={(url) => onChange(field, url)}
            storagePath={storagePath}
            label={`Arquivo ${ratio}`}
            layout="compact"
          />
          {usingFallback && <p className="mt-1.5 truncate text-[10px] text-muted-foreground">Usando {fallbackSource}</p>}
        </div>
      </div>
    </div>
  );
}

export default function ProductMediaLibrary({ media, productId, onChange }: ProductMediaLibraryProps) {
  return (
    <div className="space-y-8">
      <section>
        <div className="mb-4">
          <h2 className="text-base font-semibold">Capas do produto</h2>
          <p className="mt-1 text-xs text-muted-foreground">Uma arte própria para cada formato usado em cards e páginas.</p>
        </div>
        <div className="space-y-2">
          {coverFormats.map((format) => {
            const resolved = resolveProductCover(media, format.ratio);
            return (
              <MediaSlot
                key={format.field}
                {...format}
                value={media[format.field] ?? ""}
                fallbackUrl={resolved.isFallback ? resolved.url : ""}
                fallbackSource={resolved.isFallback ? resolved.source : null}
                storagePath={`products/${productId}/covers/${format.ratio.replace(":", "x")}`}
                onChange={onChange}
              />
            );
          })}
        </div>
      </section>

      <section className="border-t border-border pt-8">
        <div className="mb-4">
          <h2 className="text-base font-semibold">Banners da hero</h2>
          <p className="mt-1 text-xs text-muted-foreground">Artes amplas para os destaques principais da Members.</p>
        </div>
        <div className="space-y-2">
          {heroFormats.map((format) => {
            const resolved = resolveProductHero(media, format.ratio);
            return (
              <MediaSlot
                key={format.field}
                {...format}
                value={media[format.field] ?? ""}
                fallbackUrl={resolved.isFallback ? resolved.url : ""}
                fallbackSource={resolved.isFallback ? resolved.source : null}
                storagePath={`products/${productId}/heroes/${format.ratio.replace(":", "x")}`}
                onChange={onChange}
              />
            );
          })}
        </div>
      </section>
    </div>
  );
}