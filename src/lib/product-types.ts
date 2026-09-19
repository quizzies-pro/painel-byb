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
    description: "Coleção de recursos e arquivos. A estrutura de entrega será configurada na próxima etapa.",
    supportsLearningContent: false,
    supportsPackContent: true,
    deliveryReady: false,
  },
};

export const getProductType = (value: ProductType) => PRODUCT_TYPES[value];