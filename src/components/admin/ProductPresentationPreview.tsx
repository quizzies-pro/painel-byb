import { ImageIcon, Monitor, RectangleHorizontal, Smartphone } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type PreviewMode = "banner" | "card" | "mobile";

interface ProductPresentationPreviewProps {
  coverUrl: string;
  logoUrl: string;
  title: string;
  description: string;
  productLabel: string;
  buttonEnabled: boolean;
  buttonText: string;
}

const previewModes: Array<{ value: PreviewMode; label: string; icon: typeof Monitor }> = [
  { value: "banner", label: "Banner", icon: RectangleHorizontal },
  { value: "card", label: "Card", icon: Monitor },
  { value: "mobile", label: "Celular", icon: Smartphone },
];

export default function ProductPresentationPreview({
  coverUrl,
  logoUrl,
  title,
  description,
  productLabel,
  buttonEnabled,
  buttonText,
}: ProductPresentationPreviewProps) {
  const [mode, setMode] = useState<PreviewMode>("banner");
  const hasCover = Boolean(coverUrl.trim());
  const displayTitle = title.trim() || "Título do produto";
  const displayDescription = description.trim() || "A descrição curta do produto aparecerá aqui.";

  return (
    <aside className="border-t border-border bg-muted/20 p-5 lg:border-l lg:border-t-0 lg:p-6">
      <div className="space-y-5 lg:sticky lg:top-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold">Prévia na Members</h3>
            <p className="mt-1 text-xs text-muted-foreground">Atualizada enquanto você edita.</p>
          </div>
          <div className="flex rounded-md border border-border bg-background p-0.5" aria-label="Formato da prévia">
            {previewModes.map(({ value, label, icon: Icon }) => (
              <Button
                key={value}
                type="button"
                variant="ghost"
                size="icon"
                className={cn("h-7 w-7 rounded", mode === value ? "bg-muted text-foreground" : "text-muted-foreground")}
                onClick={() => setMode(value)}
                title={label}
                aria-label={`Visualizar como ${label}`}
                aria-pressed={mode === value}
              >
                <Icon className="h-3.5 w-3.5" />
              </Button>
            ))}
          </div>
        </div>

        <div className="flex min-h-[360px] items-center justify-center rounded-md border border-border bg-background p-4 sm:p-6">
          <div
            className={cn(
              "relative overflow-hidden border border-border bg-muted shadow-sm transition-[width,max-width,aspect-ratio] duration-200",
              mode === "banner" && "aspect-video w-full rounded-md",
              mode === "card" && "aspect-[4/5] w-full max-w-[260px] rounded-md",
              mode === "mobile" && "aspect-[9/16] w-full max-w-[220px] rounded-[1.25rem] border-4 border-foreground",
            )}
          >
            {hasCover ? (
              <img src={coverUrl} alt="Prévia da imagem principal" className="absolute inset-0 h-full w-full object-cover object-center" />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-muted-foreground">
                <ImageIcon className="h-7 w-7" />
                <span className="text-xs">Adicione a imagem principal</span>
              </div>
            )}

            {hasCover && <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/20 to-transparent" />}

            <div className={cn("absolute inset-x-0 bottom-0 flex flex-col items-start", mode === "banner" ? "p-5" : "p-4")}>
              <span className="mb-2 rounded-sm bg-background/90 px-1.5 py-0.5 text-[9px] font-medium uppercase text-foreground">
                {productLabel}
              </span>
              {logoUrl.trim() ? (
                <img src={logoUrl} alt="Logo do produto" className={cn("mb-2 max-w-[65%] object-contain object-left", mode === "banner" ? "max-h-10" : "max-h-8")} />
              ) : (
                <p className={cn("font-semibold text-primary-foreground", mode === "banner" ? "text-xl" : "text-base")}>{displayTitle}</p>
              )}
              <p className={cn("mt-1 line-clamp-2 text-primary-foreground/80", mode === "banner" ? "max-w-[75%] text-xs" : "text-[11px]")}>{displayDescription}</p>
              {buttonEnabled && (
                <span className="mt-3 inline-flex min-h-7 items-center rounded-md bg-background px-3 text-[10px] font-medium text-foreground shadow-sm">
                  {buttonText.trim() || "Texto do botão"}
                </span>
              )}
            </div>
          </div>
        </div>

        <p className="text-xs leading-5 text-muted-foreground">
          Mantenha textos e elementos importantes próximos ao centro da imagem para preservar os diferentes recortes.
        </p>
      </div>
    </aside>
  );
}