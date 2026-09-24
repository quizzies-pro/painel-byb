import type { Database } from "@/integrations/supabase/types";

export type ProductType = Database["public"]["Enums"]["product_type"];

export const PRODUCT_TYPES: Record<ProductType, {
  label: string;
  description: string;
  supportsLearningContent: boolean;
  supportsPackContent: boolean;
  deliveryReady: boolean;
}> = {
  course: {
    label: "Curso",
    description: "Conteúdo organizado em módulos e aulas, com progresso e certificado.",
    supportsLearningContent: true,
    supportsPackContent: false,
    deliveryReady: true,
  },
  pack: {
    label: "Pack",
    description: "Biblioteca de recursos organizada em coleções, itens e vídeos explicativos.",
    supportsLearningContent: false,
    supportsPackContent: true,
    deliveryReady: true,
  },
};

export const getProductType = (value: ProductType) => PRODUCT_TYPES[value];