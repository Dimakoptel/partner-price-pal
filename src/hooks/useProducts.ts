import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type Product = Tables<"products">;
export type ProductVariant = Tables<"product_variants">;

export function useProducts() {
  return useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const { data: products, error: e1 } = await supabase
        .from("products")
        .select("*")
        .eq("is_active", true)
        .order("name");
      if (e1) throw e1;

      const { data: variants, error: e2 } = await supabase
        .from("product_variants")
        .select("*")
        .eq("is_active", true)
        .order("sku_variant");
      if (e2) throw e2;

      return {
        products: products ?? [],
        variants: variants ?? [],
      };
    },
  });
}

export function useProductVariants(productId?: string) {
  return useQuery({
    queryKey: ["product_variants", productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_variants")
        .select("*")
        .eq("product_id", productId!)
        .eq("is_active", true)
        .order("sku_variant");
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!productId,
  });
}
