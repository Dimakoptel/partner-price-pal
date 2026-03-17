import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function useCheckAvailability(variantId?: string, quantity?: number) {
  return useQuery({
    queryKey: ["availability", variantId, quantity],
    queryFn: async () => {
      if (!variantId || !quantity) return null;
      const { data, error } = await supabase.rpc("check_product_availability", {
        p_variant_id: variantId,
        p_quantity: quantity,
      });
      if (error) throw error;
      return data as unknown as { available: boolean; reserved: number; requested: number };
    },
    enabled: !!variantId && !!quantity,
  });
}

export function useCreateReservation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ orderId, orderItemId, variantId, quantity }: {
      orderId: string;
      orderItemId: string;
      variantId: string;
      quantity: number;
    }) => {
      const { data, error } = await supabase.rpc("create_reservation_for_item", {
        p_order_id: orderId,
        p_order_item_id: orderItemId,
        p_variant_id: variantId,
        p_quantity: quantity,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["availability"] });
      qc.invalidateQueries({ queryKey: ["reservations"] });
      toast.success("Товар зарезервирован");
    },
    onError: (e: any) => {
      toast.error("Ошибка резервирования: " + e.message);
    },
  });
}

export function useReserveOrderStock() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (orderId: string) => {
      const { data, error } = await supabase.rpc("reserve_order_stock", {
        p_order_id: orderId,
      });
      if (error) throw error;
      return data as number;
    },
    onSuccess: (count) => {
      qc.invalidateQueries({ queryKey: ["availability"] });
      qc.invalidateQueries({ queryKey: ["reservations"] });
      toast.success(`Зарезервировано позиций: ${count}`);
    },
    onError: (e: any) => {
      toast.error("Ошибка: " + e.message);
    },
  });
}

export function useOrderReservations(orderId?: string) {
  return useQuery({
    queryKey: ["reservations", orderId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reservations")
        .select("*")
        .eq("order_id", orderId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!orderId,
  });
}
