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
    <div className="space-y-2">
      <Label className="text-[13px] font-medium">{label}</Label>

      <div className="rounded-md border border-border overflow-hidden">
        {/* Preview area */}
        <div className={`relative ${aspectRatio} max-h-40 bg-muted/20 flex items-center justify-center group`}>
          {value ? (
            <>
              <img src={value} alt="Capa" className="w-full h-full object-cover object-center" />
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
            accept="image/*"
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
    </div>
  );
}
