import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type ProductionOrder = {
  id: string;
  sales_order_id: string | null;
  order_item_id: string | null;
  batch_number: string;
  status_id: string | null;
  priority: string;
  assigned_to: string | null;
  notes: string | null;
  planned_start: string | null;
  planned_finish: string | null;
  actual_start: string | null;
  actual_finish: string | null;
  created_at: string;
  updated_at: string;
  status: { code: string; name: string; color: string | null } | null;
  stages?: ProductionStage[];
};

export type ProductionStage = {
  id: string;
  production_order_id: string;
  stage_id: string | null;
  sort_order: number;
  status: string;
  assigned_to: string | null;
  actual_start: string | null;
  actual_end: string | null;
  planned_start: string | null;
  planned_end: string | null;
  photo_urls: string[] | null;
  notes: string | null;
  stage: { code: string; name: string; color: string | null } | null;
};

export function useProductionOrders(salesOrderId?: string) {
  return useQuery({
    queryKey: ["production_orders", salesOrderId ?? "all"],
    queryFn: async () => {
      let query = supabase
        .from("production_orders")
        .select(
          "*, status:dictionary_items!production_orders_status_id_fkey(code, name, color)"
        )
        .order("created_at", { ascending: false });

      if (salesOrderId) {
        query = query.eq("sales_order_id", salesOrderId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as unknown as ProductionOrder[];
    },
  });
}

export function useProductionStages(productionOrderId?: string) {
  return useQuery({
    queryKey: ["production_stages", productionOrderId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("production_stages")
        .select(
          "*, stage:dictionary_items!production_stages_stage_id_fkey(code, name, color)"
        )
        .eq("production_order_id", productionOrderId!)
        .order("sort_order");

      if (error) throw error;
      return (data ?? []) as unknown as ProductionStage[];
    },
    enabled: !!productionOrderId,
  });
}

export function useCreateProductionOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (orderId: string) => {
      const { data, error } = await supabase.rpc(
        "create_production_order_from_sales",
        { p_order_id: orderId }
      );
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["production_orders"] });
      toast.success("Производственный заказ создан");
    },
    onError: (e: any) => {
      toast.error("Ошибка: " + e.message);
    },
  });
}

export function useUpdateProductionStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      productionOrderId,
      statusCode,
    }: {
      productionOrderId: string;
      statusCode: string;
    }) => {
      // Resolve status_id from dictionary
      const { data: statusItem } = await supabase
        .from("dictionary_items")
        .select("id")
        .eq("code", statusCode)
        .single();

      if (!statusItem) throw new Error("Статус не найден");

      const updates: any = { status_id: statusItem.id };
      if (statusCode === "completed") updates.actual_finish = new Date().toISOString();
      if (statusCode === "in_progress" ) updates.actual_start = new Date().toISOString();

      const { error } = await supabase
        .from("production_orders")
        .update(updates)
        .eq("id", productionOrderId);

      if (error) throw error;
      // Trigger trg_update_sales_from_production fires automatically
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["production_orders"] });
      qc.invalidateQueries({ queryKey: ["orders"] });
      toast.success("Статус производства обновлён");
    },
    onError: (e: any) => {
      toast.error("Ошибка: " + e.message);
    },
  });
}

export function useUpdateProductionStage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: { status?: string; actual_start?: string; actual_end?: string; notes?: string };
    }) => {
      const { error } = await supabase
        .from("production_stages")
        .update(updates)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["production_stages"] });
      qc.invalidateQueries({ queryKey: ["production_orders"] });
      qc.invalidateQueries({ queryKey: ["orders"] });
    },
    onError: (e: any) => {
      toast.error("Ошибка: " + e.message);
    },
  });
}
