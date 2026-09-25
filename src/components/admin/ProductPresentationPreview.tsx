import { ImageIcon } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  ProductCoverRatio,
  ProductHeroRatio,
  ProductMediaUsage,
  ProductPresentationMedia,
  resolveProductImage,
} from "@/lib/product-presentation-media";

interface ProductPresentationPreviewProps {
  media: ProductPresentationMedia;
  logoUrl: string;
  title: string;
  description: string;
  productLabel: string;
  buttonEnabled: boolean;
  buttonText: string;
}

const coverRatios: ProductCoverRatio[] = ["16:9", "4:3", "1:1", "3:4", "9:16"];
const heroRatios: ProductHeroRatio[] = ["16:9", "4:3"];

const aspectClasses: Record<ProductCoverRatio, string> = {
  "16:9": "aspect-video w-full",
  "4:3": "aspect-[4/3] w-full max-w-[300px]",
  "1:1": "aspect-square w-full max-w-[280px]",
  "3:4": "aspect-[3/4] w-full max-w-[245px]",
  "9:16": "aspect-[9/16] w-full max-w-[210px]",
};

export default function ProductPresentationPreview({
  media,
  logoUrl,
  title,
  description,
  productLabel,
  buttonEnabled,
  buttonText,
}: ProductPresentationPreviewProps) {
  const [usage, setUsage] = useState<ProductMediaUsage>("cover");
  const [coverRatio, setCoverRatio] = useState<ProductCoverRatio>("16:9");
  const [heroRatio, setHeroRatio] = useState<ProductHeroRatio>("16:9");
  const activeRatio = usage === "hero" ? heroRatio : coverRatio;
  const resolved = resolveProductImage(media, usage, activeRatio);
  const displayTitle = title.trim() || "Título do produto";
  const displayDescription = description.trim() || "A descrição curta do produto aparecerá aqui.";
  const ratios = usage === "hero" ? heroRatios : coverRatios;

  return (
    <aside className="border-t border-border bg-muted/20 p-5 lg:border-l lg:border-t-0 lg:p-6">
      <div className="space-y-5 lg:sticky lg:top-6">
        <div>
          <h3 className="text-sm font-semibold">Prévia na Members</h3>
          <p className="mt-1 text-xs text-muted-foreground">Atualizada enquanto você edita.</p>
        </div>

        <div className="space-y-2">
          <div className="grid grid-cols-2 rounded-md border border-border bg-background p-0.5">
            <Button type="button" size="sm" variant="ghost" className={cn("h-8 rounded", usage === "cover" && "bg-muted")} onClick={() => setUsage("cover")}>Capa</Button>
            <Button type="button" size="sm" variant="ghost" className={cn("h-8 rounded", usage === "hero" && "bg-muted")} onClick={() => setUsage("hero")}>Banner</Button>
          </div>
          <div className="flex flex-wrap gap-1" aria-label="Proporção da prévia">
            {ratios.map((ratio) => (
              <Button
                key={ratio}
                type="button"
                size="sm"
                variant={activeRatio === ratio ? "secondary" : "ghost"}
                className="h-7 min-w-11 px-2 text-[10px]"
                onClick={() => usage === "hero" ? setHeroRatio(ratio as ProductHeroRatio) : setCoverRatio(ratio as ProductCoverRatio)}
                aria-pressed={activeRatio === ratio}
              >
                {ratio}
              </Button>
            ))}
          </div>
        </div>

        <div className="flex min-h-[390px] items-center justify-center rounded-md border border-border bg-background p-4 sm:p-6">
          <div className={cn("relative overflow-hidden rounded-md border border-border bg-muted shadow-sm transition-[width,aspect-ratio] duration-200 motion-reduce:transition-none", aspectClasses[activeRatio])}>
            {resolved.url ? (
              <img src={resolved.url} alt={`Prévia ${usage === "hero" ? "do banner" : "da capa"} ${activeRatio}`} className="absolute inset-0 h-full w-full object-cover object-center" />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-muted-foreground">
                <ImageIcon className="h-7 w-7" />
                <span className="text-xs">Adicione esta imagem</span>
              </div>
            )}

            {resolved.url && <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/20 to-transparent" />}

            <div className="absolute inset-x-0 bottom-0 flex flex-col items-start p-4">
              <span className="mb-2 rounded-sm bg-background/90 px-1.5 py-0.5 text-[9px] font-medium uppercase text-foreground">{productLabel}</span>
              {logoUrl.trim() ? (
                <img src={logoUrl} alt="Logo do produto" className="mb-2 max-h-9 max-w-[65%] object-contain object-left" />
              ) : (
                <p className={cn("font-semibold text-primary-foreground", activeRatio === "16:9" ? "text-xl" : "text-base")}>{displayTitle}</p>
              )}
              <p className="mt-1 line-clamp-2 text-[11px] text-primary-foreground/80">{displayDescription}</p>
              {buttonEnabled && <span className="mt-3 inline-flex min-h-7 items-center rounded-md bg-background px-3 text-[10px] font-medium text-foreground shadow-sm">{buttonText.trim() || "Texto do botão"}</span>}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">{usage === "hero" ? "Banner da hero" : "Capa do produto"} · {activeRatio}</p>
          {resolved.isFallback && <Badge variant="secondary" className="text-[9px]">Fallback: {resolved.source}</Badge>}
        </div>
      </div>
    </aside>
  );
}