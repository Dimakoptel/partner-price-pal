import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export interface Order {
  id: string;
  number: string;
  client_id: string | null;
  lead_id: string | null;
  agent_id: string | null;
  responsible_id: string;
  order_type: string;
  status: string;
  items: any[];
  total_amount: number;
  paid_amount: number;
  discount_percent: number;
  delivery_address: string | null;
  delivery_method: string;
  delivery_date: string | null;
  tracking_number: string | null;
  notes: string | null;
  warranty_months: number;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  // joined
  client?: any;
}

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

export const ORDER_TYPES = [
  { value: "serial_stock", label: "Серийный (со склада)" },
  { value: "serial_production", label: "Серийный (под заказ)" },
  { value: "custom", label: "Индивидуальный" },
  { value: "project", label: "Проект" },
] as const;

export const DELIVERY_METHODS = [
  { value: "self_pickup", label: "Самовывоз" },
  { value: "city_delivery", label: "Доставка по городу" },
  { value: "to_tc", label: "До ТК" },
  { value: "to_door", label: "До двери" },
] as const;

export function useOrders() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const ordersQuery = useQuery({
    queryKey: ["orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders" as any)
        .select("*, client:clients(id, name, phone, company)")
        .order("created_at", { ascending: false }) as any;
      if (error) throw error;
      return (data || []) as Order[];
    },
    enabled: !!user,
  });

  const createOrder = useMutation({
    mutationFn: async (order: Partial<Order>) => {
      if (!user) throw new Error("Not authenticated");
      const { data, error } = await (supabase
        .from("orders" as any) as any)
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
    onError: (e: any) => toast.error("Ошибка: " + e.message),
  });

  const updateOrder = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Order> & { id: string }) => {
      const { data, error } = await (supabase
        .from("orders" as any) as any)
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
    onError: (e: any) => toast.error("Ошибка: " + e.message),
  });

  return {
    orders: ordersQuery.data ?? [],
    isLoading: ordersQuery.isLoading,
    createOrder,
    updateOrder,
  };
}
