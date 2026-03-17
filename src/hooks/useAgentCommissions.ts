import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type AgentCommission = {
  id: string;
  agent_id: string;
  order_id: string;
  amount: number;
  status: "reserved" | "accrued" | "paid" | "cancelled";
  calculated_at: string;
  paid_at: string | null;
  payout_reference: string | null;
  created_at: string;
  order?: { number: string; total_amount: number };
};

export function useAgentCommissions(agentId?: string) {
  return useQuery({
    queryKey: ["agent_commissions", agentId],
    queryFn: async () => {
      let query = (supabase.from("agent_commissions" as any) as any)
        .select("*, order:orders(number, total_amount)");
      if (agentId) {
        query = query.eq("agent_id", agentId);
      }
      const { data, error } = await query.order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as AgentCommission[];
    },
  });
}

export function useAccrueCommission() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (orderId: string) => {
      const { data: order, error: oe } = await (supabase.from("orders" as any) as any)
        .select("*, client:clients(id, client_type, commission_rate)")
        .eq("id", orderId)
        .single();
      if (oe) throw oe;

      if (!order || order.client?.client_type !== "agent") {
        return null;
      }

      const commissionAmount = (order.total_amount || 0) * (order.client.commission_rate || 0) / 100;

      const { data, error } = await (supabase.from("agent_commissions" as any) as any)
        .upsert({
          agent_id: order.client.id,
          order_id: orderId,
          amount: commissionAmount,
          status: "accrued",
          calculated_at: new Date().toISOString(),
        }, { onConflict: "order_id" })
        .select()
        .single();
      if (error) throw error;
      return data as AgentCommission;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["agent_commissions"] });
      toast.success("Комиссия начислена");
    },
    onError: (e: any) => toast.error("Ошибка: " + e.message),
  });
}
