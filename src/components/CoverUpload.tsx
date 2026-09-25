import { useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ImageIcon, Upload, Trash2, Search } from "lucide-react";
import { toast } from "sonner";

interface CoverUploadProps {
  value: string;
  onChange: (url: string) => void;
  storagePath: string;
  bucket?: string;
  label?: string;
  hint?: string;
  aspectRatio?: string;
  showResponsivePreviews?: boolean;
}

const MAX_IMAGE_DIMENSION = 2000;

const optimizeImage = (file: File): Promise<File> => new Promise((resolve, reject) => {
  const image = new Image();
  const objectUrl = URL.createObjectURL(file);
  image.onload = () => {
    const scale = Math.min(1, MAX_IMAGE_DIMENSION / Math.max(image.width, image.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.width * scale));
    canvas.height = Math.max(1, Math.round(image.height * scale));
    const context = canvas.getContext("2d");
    if (!context) {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Não foi possível preparar a imagem."));
      return;
    }
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    canvas.toBlob((blob) => {
      URL.revokeObjectURL(objectUrl);
      if (!blob) {
        reject(new Error("Não foi possível otimizar a imagem."));
        return;
      }
      resolve(new File([blob], `${file.name.replace(/\.[^.]+$/, "")}.webp`, { type: "image/webp" }));
    }, "image/webp", 0.86);
  };
  image.onerror = () => {
    URL.revokeObjectURL(objectUrl);
    reject(new Error("O arquivo de imagem não pôde ser lido."));
  };
  image.src = objectUrl;
});

export default function CoverUpload({
  value,
  onChange,
  storagePath,
  bucket = "course-covers",
  label = "Capa",
  hint = "A imagem deve estar no formato JPG, PNG ou GIF. Dimensões ideais: 500×400 pixels. Tamanho máximo: 10 MB.",
  aspectRatio = "aspect-[5/4]",
  showResponsivePreviews = false,
}: CoverUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      toast.error("Use uma imagem JPG, PNG ou WebP");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Tamanho máximo: 10 MB");
      return;
    }

    setUploading(true);
    let optimizedFile: File;
    try {
      optimizedFile = await optimizeImage(file);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível preparar a imagem");
      setUploading(false);
      return;
    }
    const filePath = `${storagePath}/${Date.now()}.webp`;

    const { error } = await supabase.storage.from(bucket).upload(filePath, optimizedFile, { contentType: "image/webp" });
    if (error) {
      toast.error("Erro ao enviar imagem: " + error.message);
      setUploading(false);
      return;
    }

    const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
    onChange(data.publicUrl);
    toast.success("Imagem atualizada e otimizada");
    setUploading(false);
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleRemove = () => {
    onChange("");
  };

  return (
    <div className="space-y-2">
      <Label className="text-[13px] font-medium">{label}</Label>

      <div className="rounded-md border border-border overflow-hidden">
        {/* Preview area */}
        <div className={`relative bg-muted/20 flex items-center justify-center group overflow-hidden ${aspectRatio}`}>
          {value ? (
            <>
              <img
                src={value}
                alt={label}
                className="w-full h-full object-cover object-center"
                onError={(event) => {
                  event.currentTarget.style.display = "none";
                  event.currentTarget.nextElementSibling?.classList.replace("hidden", "flex");
                }}
              />
              <div className="hidden absolute inset-0 items-center justify-center bg-muted text-muted-foreground">
                <ImageIcon className="h-7 w-7" />
              </div>
              <div className="absolute inset-0 bg-foreground/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  className="h-7 w-7 p-0"
                  onClick={() => window.open(value, "_blank")}
                >
                  <Search className="h-3 w-3" />
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  className="h-7 px-2 text-[11px] gap-1"
                  disabled={uploading}
                  onClick={() => inputRef.current?.click()}
                >
                  <Upload className="h-3 w-3" />
                  Trocar
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="destructive"
                  className="h-7 w-7 p-0"
                  onClick={handleRemove}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center gap-1.5 text-muted-foreground/50">
              <ImageIcon className="h-7 w-7" />
              <span className="text-[11px]">Nenhuma imagem</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="p-2 border-t border-border flex items-center gap-2">
          <Input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="URL da imagem"
            className="bg-background border-border text-[11px] h-7 flex-1"
          />
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleUpload}
          />
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-7 text-[11px] gap-1 shrink-0 px-2"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
          >
            {uploading ? (
              <div className="h-3 w-3 animate-spin rounded-full border-2 border-foreground border-t-transparent" />
            ) : (
              <Upload className="h-3 w-3" />
            )}
            Upload
          </Button>
        </div>
      </div>

      <p className="text-[10px] text-muted-foreground/50">{hint}</p>
      {showResponsivePreviews && value && (
        <div className="grid grid-cols-[1fr_8rem] gap-3 border-t border-border pt-3">
          <div>
            <p className="mb-1.5 text-[10px] text-muted-foreground">Banner</p>
            <div className="aspect-video overflow-hidden rounded border border-border bg-muted"><img src={value} alt="Prévia em banner" className="h-full w-full object-cover" /></div>
          </div>
          <div>
            <p className="mb-1.5 text-[10px] text-muted-foreground">Card</p>
            <div className="aspect-[4/3] overflow-hidden rounded border border-border bg-muted"><img src={value} alt="Prévia em card" className="h-full w-full object-cover" /></div>
          </div>
        </div>
      )}
    </div>
  );
}
