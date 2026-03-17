import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface OrderItem {
  id: string;
  order_id: string;
  product_variant_id: string | null;
  characteristics_override: Record<string, any>;
  quantity: number;
  price_unit: number;
  discount_line: number;
  total_line: number;
  warranty_months: number;
  production_required: boolean;
  created_at: string;
  updated_at: string;
}

export function useOrderItems(orderId?: string) {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["order_items", orderId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("order_items" as any)
        .select("*")
        .eq("order_id", orderId!)
        .order("created_at") as any;
      if (error) throw error;
      return (data || []) as OrderItem[];
    },
    enabled: !!orderId,
  });

  const recalculate = async (oid: string) => {
    await (supabase.rpc as any)("recalculate_order_totals", { p_order_id: oid });
    qc.invalidateQueries({ queryKey: ["orders"] });
    qc.invalidateQueries({ queryKey: ["order_items", oid] });
  };

  const addItem = useMutation({
    mutationFn: async (item: {
      order_id: string;
      product_variant_id: string;
      quantity: number;
      price_unit: number;
      discount_line?: number;
      warranty_months: number;
      production_required?: boolean;
      characteristics_override?: Record<string, any>;
    }) => {
      const discount = item.discount_line || 0;
      const total_line = item.quantity * item.price_unit * (1 - discount / 100);
      const { data, error } = await (supabase.from("order_items" as any) as any)
        .insert({ ...item, discount_line: discount, total_line })
        .select()
        .single();
      if (error) throw error;
      await recalculate(item.order_id);
      return data as OrderItem;
    },
    onSuccess: () => toast.success("Позиция добавлена"),
    onError: (e: any) => toast.error("Ошибка: " + e.message),
  });

  const updateItem = useMutation({
    mutationFn: async ({ id, order_id, ...updates }: Partial<OrderItem> & { id: string; order_id: string }) => {
      // Recalculate total_line if quantity/price/discount changed
      let total_line = updates.total_line;
      if (updates.quantity !== undefined || updates.price_unit !== undefined || updates.discount_line !== undefined) {
        const current = query.data?.find((i) => i.id === id);
        if (current) {
          const qty = updates.quantity ?? current.quantity;
          const price = updates.price_unit ?? current.price_unit;
          const disc = updates.discount_line ?? current.discount_line;
          total_line = qty * price * (1 - disc / 100);
        }
      }
      const { data, error } = await (supabase.from("order_items" as any) as any)
        .update({ ...updates, total_line })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      await recalculate(order_id);
      return data as OrderItem;
    },
    onError: (e: any) => toast.error("Ошибка: " + e.message),
  });

  const deleteItem = useMutation({
    mutationFn: async ({ id, order_id }: { id: string; order_id: string }) => {
      const { error } = await (supabase.from("order_items" as any) as any)
        .delete()
        .eq("id", id);
      if (error) throw error;
      await recalculate(order_id);
    },
    onSuccess: () => toast.success("Позиция удалена"),
    onError: (e: any) => toast.error("Ошибка: " + e.message),
  });

  return {
    items: query.data ?? [],
    isLoading: query.isLoading,
    addItem,
    updateItem,
    deleteItem,
  };
}
