import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type IntegrationQueueItem = {
  id: string;
  direction: "to_1c" | "from_1c";
  entity_type: string;
  entity_id: string | null;
  payload: Record<string, any>;
  status: "pending" | "sent" | "confirmed" | "error";
  error_message: string | null;
  retry_count: number;
  max_retries: number;
  created_at: string;
  processed_at: string | null;
  confirmed_at: string | null;
};

export function useIntegrationQueue(status?: string) {
  return useQuery({
    queryKey: ["integration_queue", status],
    queryFn: async () => {
      let query = (supabase.from("integration_queue" as any) as any)
        .select("*")
        .order("created_at", { ascending: false });
      if (status) {
        query = query.eq("status", status);
      }
      const { data, error } = await query.limit(100);
      if (error) throw error;
      return (data || []) as IntegrationQueueItem[];
    },
  });
}

export function useRetryIntegration() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (queueId: string) => {
      const { data, error } = await (supabase.from("integration_queue" as any) as any)
        .update({ status: "pending", error_message: null })
        .eq("id", queueId)
        .eq("status", "error")
        .select()
        .single();
      if (error) throw error;
      return data as IntegrationQueueItem;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["integration_queue"] });
      toast.success("Запись поставлена в очередь повторно");
    },
    onError: (e: any) => toast.error("Ошибка: " + e.message),
  });
}
