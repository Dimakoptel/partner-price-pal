import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export function useConvertLeadToOrder() {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (leadId: string) => {
      if (!user) throw new Error("Not authenticated");

      // 1. Load lead
      const { data: lead, error: e1 } = await supabase
        .from("leads")
        .select("*, client:clients(id), calculation:saved_calculations(*)")
        .eq("id", leadId)
        .single();

      if (e1 || !lead) throw new Error("Лид не найден");

      // 2. Create order
      const { data: order, error: e2 } = await supabase
        .from("orders")
        .insert({
          client_id: lead.client_id || (lead.client as { id: string } | null)?.id || null,
          lead_id: leadId,
          responsible_id: user.id,
          order_type: "serial_stock",
          status: "draft",
          total_amount: lead.amount || 0,
          notes: lead.notes,
          warranty_months: 12,
        })
        .select()
        .single();

      if (e2) throw e2;

      // 3. Update lead status
      await supabase
        .from("leads")
        .update({
          status: "won",
          converted_to_order_id: order.id,
        })
        .eq("id", leadId);

      return order;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["leads"] });
      qc.invalidateQueries({ queryKey: ["orders"] });
      toast.success("Лид конвертирован в заказ");
    },
    onError: (e: Error) => toast.error("Ошибка: " + e.message),
  });
}
