import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface PartnerOrder {
  id: string;
  number: string;
  status: string;
  total_amount: number;
  paid_amount: number;
  created_at: string;
  delivery_method: string | null;
  delivery_date: string | null;
  tracking_number: string | null;
  notes: string | null;
  completed_at: string | null;
}

export interface PartnerProductionOrder {
  id: string;
  sales_order_id: string | null;
  status_id: string | null;
  batch_number: string | null;
  planned_start: string | null;
  planned_finish: string | null;
  actual_start: string | null;
  actual_finish: string | null;
  priority: string;
}

export interface PartnerProductionStage {
  id: string;
  production_order_id: string;
  stage_id: string | null;
  status: string;
  sort_order: number;
  planned_start: string | null;
  planned_end: string | null;
  actual_start: string | null;
  actual_end: string | null;
}

export function usePartnerOrders() {
  const { partnerClientId } = useAuth();

  const { data: orders = [], isLoading: ordersLoading } = useQuery({
    queryKey: ["partner_orders", partnerClientId],
    queryFn: async () => {
      if (!partnerClientId) return [];
      const { data, error } = await supabase
        .from("orders")
        .select("id, number, status, total_amount, paid_amount, created_at, delivery_method, delivery_date, tracking_number, notes, completed_at")
        .eq("client_id", partnerClientId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as PartnerOrder[];
    },
    enabled: !!partnerClientId,
  });

  const orderIds = orders.map(o => o.id);

  const { data: productionOrders = [] } = useQuery({
    queryKey: ["partner_production_orders", orderIds],
    queryFn: async () => {
      if (orderIds.length === 0) return [];
      const { data, error } = await supabase
        .from("production_orders")
        .select("id, sales_order_id, status_id, batch_number, planned_start, planned_finish, actual_start, actual_finish, priority")
        .in("sales_order_id", orderIds);
      if (error) throw error;
      return (data || []) as PartnerProductionOrder[];
    },
    enabled: orderIds.length > 0,
  });

  const prodOrderIds = productionOrders.map(po => po.id);

  const { data: productionStages = [] } = useQuery({
    queryKey: ["partner_production_stages", prodOrderIds],
    queryFn: async () => {
      if (prodOrderIds.length === 0) return [];
      const { data, error } = await supabase
        .from("production_stages")
        .select("id, production_order_id, stage_id, status, sort_order, planned_start, planned_end, actual_start, actual_end")
        .in("production_order_id", prodOrderIds)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return (data || []) as PartnerProductionStage[];
    },
    enabled: prodOrderIds.length > 0,
  });

  // Load dictionary items for stage names and production status
  const { data: dictItems = [] } = useQuery({
    queryKey: ["partner_dict_items"],
    queryFn: async () => {
      const { data } = await supabase
        .from("dictionary_items")
        .select("id, name, code, color, type_id")
        .eq("is_active", true);
      return data || [];
    },
  });

  const getDictName = (id: string | null) => {
    if (!id) return null;
    return dictItems.find(d => d.id === id)?.name || null;
  };

  const getProductionForOrder = (orderId: string) => {
    const prods = productionOrders.filter(po => po.sales_order_id === orderId);
    return prods.map(po => {
      const stages = productionStages.filter(s => s.production_order_id === po.id);
      const totalStages = stages.length;
      const completedStages = stages.filter(s => s.status === "completed" || s.status === "skipped").length;
      return {
        ...po,
        statusName: getDictName(po.status_id),
        stages,
        totalStages,
        completedStages,
        progress: totalStages > 0 ? Math.round((completedStages / totalStages) * 100) : 0,
      };
    });
  };

  return {
    orders,
    loading: ordersLoading,
    getProductionForOrder,
    getDictName,
  };
}
