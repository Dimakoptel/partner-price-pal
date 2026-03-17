import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type Product = {
  id: string;
  sku_base: string;
  name: string;
  category: string | null;
  type_id: string | null;
  warranty_default_months: number;
  is_active: boolean;
};

export type ProductVariant = {
  id: string;
  product_id: string;
  sku_variant: string;
  size_cm: string | null;
  color: string | null;
  texture: string | null;
  characteristics: Record<string, any>;
  price_base: number;
  price_retail: number | null;
  price_wholesale: number | null;
  price_agent: number | null;
  production_time_days: number;
  warranty_months_override: number | null;
};

export function useProducts() {
  return useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const { data: products, error: e1 } = await supabase
        .from("products" as any)
        .select("*")
        .eq("is_active", true)
        .order("name") as any;
      if (e1) throw e1;

      const { data: variants, error: e2 } = await supabase
        .from("product_variants" as any)
        .select("*")
        .eq("is_active", true)
        .order("sku_variant") as any;
      if (e2) throw e2;

      return {
        products: (products || []) as Product[],
        variants: (variants || []) as ProductVariant[],
      };
    },
  });
}

export function useProductVariants(productId?: string) {
  return useQuery({
    queryKey: ["product_variants", productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_variants" as any)
        .select("*")
        .eq("product_id", productId!)
        .eq("is_active", true)
        .order("sku_variant") as any;
      if (error) throw error;
      return (data || []) as ProductVariant[];
    },
    enabled: !!productId,
  });
}
