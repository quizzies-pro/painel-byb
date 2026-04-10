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
  label?: string;
  hint?: string;
  aspectRatio?: string;
}

export default function CoverUpload({
  value,
  onChange,
  storagePath,
  label = "Capa",
  hint = "A imagem deve estar no formato JPG, PNG ou GIF. Dimensões ideais: 500×400 pixels. Tamanho máximo: 10 MB.",
  aspectRatio = "aspect-[5/4]",
}: CoverUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Apenas imagens são permitidas");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Tamanho máximo: 10 MB");
      return;
    }

    setUploading(true);
    const ext = file.name.split(".").pop();
    const filePath = `${storagePath}/${Date.now()}.${ext}`;

    const { error } = await supabase.storage.from("materials").upload(filePath, file);
    if (error) {
      toast.error("Erro ao enviar imagem: " + error.message);
      setUploading(false);
      return;
    }

    const { data } = supabase.storage.from("materials").getPublicUrl(filePath);
    onChange(data.publicUrl);
    toast.success("Capa atualizada");
    setUploading(false);
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleRemove = () => {
    onChange("");
  };

  return (
    <div className="space-y-3">
      <Label className="text-[13px] font-medium">{label}</Label>

      <div className="rounded-lg border border-border overflow-hidden">
        {/* Preview area */}
        <div className={`relative ${aspectRatio} bg-muted/20 flex items-center justify-center group`}>
          {value ? (
            <>
              <img src={value} alt="Capa" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-foreground/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  className="h-8 text-xs gap-1.5"
                  onClick={() => window.open(value, "_blank")}
                >
                  <Search className="h-3.5 w-3.5" />
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  className="h-8 text-xs gap-1.5"
                  disabled={uploading}
                  onClick={() => inputRef.current?.click()}
                >
                  <Upload className="h-3.5 w-3.5" />
                  Trocar
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="destructive"
                  className="h-8 text-xs gap-1.5"
                  onClick={handleRemove}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center gap-2 text-muted-foreground/50">
              <ImageIcon className="h-10 w-10" />
              <span className="text-xs">Nenhuma capa selecionada</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="p-3 border-t border-border flex items-center justify-between gap-3">
          <Input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="URL da imagem ou faça upload"
            className="bg-background border-border text-xs h-8 flex-1"
          />
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleUpload}
          />
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-8 text-xs gap-1.5 shrink-0"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
          >
            {uploading ? (
              <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-foreground border-t-transparent" />
            ) : (
              <Upload className="h-3.5 w-3.5" />
            )}
            Procurar
          </Button>
        </div>
      </div>

      <p className="text-[11px] text-muted-foreground/60">{hint}</p>
    </div>
  );
}
