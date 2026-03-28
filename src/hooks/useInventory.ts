import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";

export type InventoryItem = Tables<"inventory"> & {
  variant?: {
    id: string;
    sku_variant: string;
    color: string | null;
    size_cm: string | null;
    texture: string | null;
    product_id: string | null;
    price_base: number;
    product: { id: string; name: string; sku_base: string } | null;
  } | null;
};

export type StockMovement = Tables<"stock_movements"> & {
  variant?: {
    id: string;
    sku_variant: string;
    color: string | null;
    size_cm: string | null;
    product: { id: string; name: string } | null;
  } | null;
};

export const MOVEMENT_TYPES = [
  { value: "receipt", label: "Приход", color: "#22c55e" },
  { value: "dispatch", label: "Расход", color: "#ef4444" },
  { value: "return", label: "Возврат", color: "#3b82f6" },
  { value: "write_off", label: "Списание", color: "#f59e0b" },
  { value: "adjustment", label: "Корректировка", color: "#8b5cf6" },
] as const;

export function useInventory() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["inventory"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("inventory")
        .select("*, variant:product_variants(id, sku_variant, color, size_cm, texture, product_id, price_base, product:products(id, name, sku_base))")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as InventoryItem[];
    },
    enabled: !!user,
  });
}

export function useStockMovements(variantId?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["stock_movements", variantId],
    queryFn: async () => {
      let query = supabase
        .from("stock_movements")
        .select("*, variant:product_variants(id, sku_variant, color, size_cm, product:products(id, name))");

      if (variantId) {
        query = query.eq("product_variant_id", variantId);
      }

      const { data, error } = await query.order("created_at", { ascending: false }).limit(200);
      if (error) throw error;
      return (data ?? []) as unknown as StockMovement[];
    },
    enabled: !!user,
  });
}

export function useCreateStockMovement() {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (movement: {
      product_variant_id: string;
      movement_type: string;
      quantity: number;
      reason?: string;
      document_number?: string;
      order_id?: string;
      production_order_id?: string;
      notes?: string;
    }) => {
      if (!user) throw new Error("Not authenticated");
      const { data, error } = await supabase
        .from("stock_movements")
        .insert({
          ...movement,
          created_by: user.id,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["inventory"] });
      qc.invalidateQueries({ queryKey: ["stock_movements"] });
      qc.invalidateQueries({ queryKey: ["availability"] });
      toast.success("Движение товара зарегистрировано");
    },
    onError: (e: Error) => toast.error("Ошибка: " + e.message),
  });
}
