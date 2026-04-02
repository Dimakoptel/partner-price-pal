import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type Order = Tables<"orders"> & {
  client?: { id: string; name: string; phone: string | null; company: string | null } | null;
};

export type OrderInsert = TablesInsert<"orders">;
export type OrderUpdate = TablesUpdate<"orders">;

/** @deprecated Use useDictOptions("order_statuses") instead */
export const ORDER_STATUSES = [
  { value: "draft", label: "Черновик", color: "hsl(var(--muted-foreground))" },
  { value: "pending_approval", label: "На согласовании", color: "#f59e0b" },
  { value: "confirmed", label: "Подтверждён", color: "#3b82f6" },
  { value: "in_production", label: "В производстве", color: "#8b5cf6" },
  { value: "ready", label: "Готов", color: "#10b981" },
  { value: "shipped", label: "Отгружен", color: "#06b6d4" },
  { value: "paid", label: "Оплачен", color: "#22c55e" },
  { value: "completed", label: "Завершён", color: "#16a34a" },
  { value: "cancelled", label: "Отменён", color: "#ef4444" },
] as const;

/** @deprecated Use useDictOptions("order_types") instead */
export const ORDER_TYPES = [
  { value: "serial_stock", label: "Серийный (со склада)" },
  { value: "serial_production", label: "Серийный (под заказ)" },
  { value: "custom", label: "Индивидуальный" },
  { value: "project", label: "Проект" },
] as const;

/** @deprecated Use useDictOptions("delivery_methods") instead */
export const DELIVERY_METHODS = [
  { value: "self_pickup", label: "Самовывоз" },
  { value: "city_delivery", label: "Доставка по городу" },
  { value: "to_tc", label: "До ТК" },
  { value: "to_door", label: "До двери" },
] as const;

export interface UseOrdersOptions {
  from?: number;
  to?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export function useOrders(options?: UseOrdersOptions) {
  const { user } = useAuth();
  const qc = useQueryClient();

  const ordersQuery = useQuery({
    queryKey: ["orders", user?.id, options?.from, options?.to, options?.sortBy, options?.sortOrder],
    queryFn: async () => {
      let query = supabase
        .from("orders")
        .select("*, client:clients!orders_client_id_fkey(id, name, phone, company)", { count: "exact" })
        .order(options?.sortBy || "created_at", { ascending: options?.sortOrder === "asc" });

      if (options?.from !== undefined && options?.to !== undefined) {
        query = query.range(options.from, options.to);
      }

      const { data, error, count } = await query;
      if (error) throw error;
      return { data: (data ?? []) as Order[], count: count ?? 0 };
    },
    enabled: !!user,
  });

  const createOrder = useMutation({
    mutationFn: async (order: Omit<OrderInsert, "responsible_id">) => {
      if (!user) throw new Error("Not authenticated");
      const { data, error } = await supabase
        .from("orders")
        .insert({ ...order, responsible_id: user.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orders"] });
      toast.success("Заказ создан");
    },
    onError: (e: Error) => toast.error("Ошибка: " + e.message),
  });

  const updateOrder = useMutation({
    mutationFn: async ({ id, ...updates }: OrderUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from("orders")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orders"] });
      toast.success("Заказ обновлён");
    },
    onError: (e: Error) => toast.error("Ошибка: " + e.message),
  });

  return {
    orders: ordersQuery.data?.data ?? [],
    totalCount: ordersQuery.data?.count ?? 0,
    isLoading: ordersQuery.isLoading,
    isFetching: ordersQuery.isFetching,
    error: ordersQuery.error,
    createOrder,
    updateOrder,
  };
}
