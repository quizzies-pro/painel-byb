import { ImageIcon } from "lucide-react";
import CoverUpload from "@/components/CoverUpload";
import { Badge } from "@/components/ui/badge";
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

  return (
    <div className="min-w-0 rounded-md border border-border bg-background p-3">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium">{ratio}</p>
          <p className="text-[11px] text-muted-foreground">{dimensions}</p>
        </div>
        <Badge variant={usingFallback ? "secondary" : value.trim() ? "outline" : "secondary"} className="shrink-0 text-[9px] font-medium">
          {usingFallback ? "Fallback" : value.trim() ? "Própria" : "Pendente"}
        </Badge>
      </div>

      {usingFallback && (
        <div className={`relative mb-3 overflow-hidden rounded border border-dashed border-border bg-muted/30 ${aspect}`}>
          <img src={fallbackUrl} alt={`Fallback ${ratio}`} className="h-full w-full object-cover" />
          <div className="absolute inset-x-0 bottom-0 bg-foreground/70 px-2 py-1 text-[9px] text-primary-foreground">
            Usando {fallbackSource}
          </div>
        </div>
      )}

      {!value.trim() && !fallbackUrl && (
        <div className={`mb-3 flex items-center justify-center rounded border border-dashed border-border bg-muted/20 text-muted-foreground ${aspect}`}>
          <ImageIcon className="h-5 w-5" />
        </div>
      )}

      <CoverUpload
        value={value}
        onChange={(url) => onChange(field, url)}
        storagePath={storagePath}
        label={`Arquivo ${ratio}`}
        aspectRatio={aspect}
        showImagePreview={Boolean(value.trim())}
        hint="JPG, PNG ou WebP. Máx. 10 MB."
      />
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
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
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
        <div className="grid gap-4 sm:grid-cols-2">
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