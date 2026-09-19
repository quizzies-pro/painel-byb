import type { Database } from "@/integrations/supabase/types";

export type PackFormat = Database["public"]["Enums"]["pack_format"];

export const PACK_FORMATS: Record<PackFormat, {
  label: string;
  description: string;
}> = {
  canva: {
    label: "Canva",
    description: "Galeria visual de designs com acesso direto aos links de duplicação.",
  },
  textual: {
    label: "Textual",
    description: "Roteiros, textos, prompts e instruções cadastrados no próprio Hub.",
  },
  drive: {
    label: "Google Drive",
    description: "Biblioteca organizada de vídeos, PDFs e outros arquivos da conta da empresa.",
  },
};

export const isPackFormat = (value: unknown): value is PackFormat =>
  value === "canva" || value === "textual" || value === "drive";