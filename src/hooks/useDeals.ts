import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export interface PipelineStage {
  id: string;
  name: string;
  color: string;
  sort_order: number;
  is_closed: boolean;
}

export interface Deal {
  id: string;
  title: string;
  client_id: string | null;
  stage_id: string;
  amount: number;
  responsible_id: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  client?: { id: string; name: string } | null;
  responsible?: { full_name: string | null } | null;
}

export function useDeals() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const stagesQuery = useQuery({
    queryKey: ["pipeline_stages"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pipeline_stages")
        .select("*")
        .order("sort_order");
      if (error) throw error;
      return data as PipelineStage[];
    },
    enabled: !!user,
  });

  const dealsQuery = useQuery({
    queryKey: ["deals"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("deals")
        .select("*, client:clients(id, name)")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data as unknown as Deal[];
    },
    enabled: !!user,
  });

  const addDeal = useMutation({
    mutationFn: async (deal: { title: string; client_id?: string | null; stage_id: string; amount?: number; notes?: string }) => {
      if (!user) throw new Error("Not authenticated");
      const { data, error } = await supabase
        .from("deals")
        .insert({ ...deal, responsible_id: user.id, amount: deal.amount ?? 0 })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["deals"] });
      toast.success("Сделка создана");
    },
    onError: (e) => toast.error("Ошибка: " + e.message),
  });

  const updateDeal = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<Pick<Deal, "title" | "client_id" | "stage_id" | "amount" | "notes" | "closed_at">>) => {
      const { data, error } = await supabase
        .from("deals")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["deals"] });
    },
    onError: (e) => toast.error("Ошибка: " + e.message),
  });

  const deleteDeal = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("deals").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["deals"] });
      toast.success("Сделка удалена");
    },
    onError: (e) => toast.error("Ошибка: " + e.message),
  });

  const moveDeal = async (dealId: string, newStageId: string) => {
    const stage = stagesQuery.data?.find((s) => s.id === newStageId);
    const updates: any = { id: dealId, stage_id: newStageId };
    if (stage?.is_closed) updates.closed_at = new Date().toISOString();
    else updates.closed_at = null;
    updateDeal.mutate(updates);
  };

  // Stage management (admin)
  const addStage = useMutation({
    mutationFn: async (stage: { name: string; color: string; sort_order: number; is_closed: boolean }) => {
      const { data, error } = await supabase.from("pipeline_stages").insert(stage).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pipeline_stages"] });
      toast.success("Этап добавлен");
    },
    onError: (e) => toast.error("Ошибка: " + e.message),
  });

  const updateStage = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<PipelineStage>) => {
      const { error } = await supabase.from("pipeline_stages").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pipeline_stages"] }),
    onError: (e) => toast.error("Ошибка: " + e.message),
  });

  const deleteStage = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("pipeline_stages").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pipeline_stages"] });
      toast.success("Этап удалён");
    },
    onError: (e) => toast.error("Ошибка: " + e.message),
  });

  return {
    stages: stagesQuery.data ?? [],
    deals: dealsQuery.data ?? [],
    isLoading: stagesQuery.isLoading || dealsQuery.isLoading,
    addDeal, updateDeal, deleteDeal, moveDeal,
    addStage, updateStage, deleteStage,
  };
}
