import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";

export type IntegrationQueueItem = Tables<"integration_queue">;

export function useIntegrationQueue(status?: string) {
  return useQuery({
    queryKey: ["integration_queue", status],
    queryFn: async () => {
      let query = supabase
        .from("integration_queue")
        .select("*")
        .order("created_at", { ascending: false });
      if (status) {
        query = query.eq("status", status);
      }
      const { data, error } = await query.limit(100);
      if (error) throw error;
      return (data ?? []) as IntegrationQueueItem[];
    },
  });
}

export function useRetryIntegration() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (queueId: string) => {
      const { data, error } = await supabase
        .from("integration_queue")
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
    onError: (e: Error) => toast.error("Ошибка: " + e.message),
  });
}
