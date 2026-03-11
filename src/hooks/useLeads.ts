import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface Lead {
  id: string;
  user_id: string;
  calculation_id: string | null;
  client_name: string;
  client_phone: string | null;
  client_email: string | null;
  source: string;
  status: string;
  amount: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export function useLeads() {
  const { user } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLeads = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("leads" as any)
      .select("*")
      .order("created_at", { ascending: false }) as { data: Lead[] | null };
    if (data) setLeads(data);
    setLoading(false);
  };

  const createLead = async (lead: {
    client_name: string;
    client_phone?: string;
    client_email?: string;
    calculation_id?: string;
    amount?: number;
    notes?: string;
  }) => {
    if (!user) return { error: new Error("Not authenticated"), data: null };
    const { data, error } = await (supabase
      .from("leads" as any) as any)
      .insert({
        user_id: user.id,
        client_name: lead.client_name,
        client_phone: lead.client_phone || null,
        client_email: lead.client_email || null,
        calculation_id: lead.calculation_id || null,
        amount: lead.amount || 0,
        notes: lead.notes || null,
        source: "calculator",
        status: "new",
      })
      .select()
      .single();
    if (!error) fetchLeads();
    return { error, data };
  };

  const updateLead = async (id: string, updates: Partial<Lead>) => {
    const { error } = await (supabase
      .from("leads" as any) as any)
      .update(updates)
      .eq("id", id);
    if (!error) fetchLeads();
    return { error };
  };

  useEffect(() => {
    if (user) fetchLeads();
  }, [user]);

  return { leads, loading, createLead, updateLead, fetchLeads };
}
