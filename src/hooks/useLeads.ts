import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type Lead = Tables<"leads">;

export function useLeads() {
  const { user } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLeads = async () => {
    if (!user) { setLoading(false); return; }
    try {
      const { data } = await supabase
        .from("leads")
        .select("*")
        .order("created_at", { ascending: false });
      if (data) setLeads(data);
    } finally {
      setLoading(false);
    }
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
    const { data, error } = await supabase
      .from("leads")
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

  const updateLead = async (id: string, updates: TablesUpdate<"leads">) => {
    const { error } = await supabase
      .from("leads")
      .update(updates)
      .eq("id", id);
    if (!error) fetchLeads();
    return { error };
  };

  const convertToClient = async (lead: Lead) => {
    if (!user) return { error: new Error("Not authenticated"), clientId: null };
    const { data: client, error: clientError } = await supabase
      .from("clients")
      .insert({
        name: lead.client_name,
        phone: lead.client_phone || null,
        email: lead.client_email || null,
        region: lead.region || null,
        source: lead.source || "lead",
        created_by: user.id,
      })
      .select()
      .single();
    if (clientError || !client) return { error: clientError, clientId: null };

    await supabase
      .from("leads")
      .update({ client_id: client.id, status: lead.status === "new" ? "qualified" : lead.status })
      .eq("id", lead.id);

    fetchLeads();
    return { error: null, clientId: client.id };
  };

  const convertToOrder = async (lead: Lead) => {
    if (!user) return { error: new Error("Not authenticated"), orderId: null };

    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, "");
    const rand = String(Math.floor(Math.random() * 999) + 1).padStart(3, "0");
    const orderNumber = `ORD-${dateStr}-${rand}`;

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        number: orderNumber,
        responsible_id: user.id,
        client_id: lead.client_id || null,
        lead_id: lead.id,
        total_amount: lead.amount || 0,
        status: "draft",
        order_type: "serial_stock",
        notes: lead.notes || null,
      })
      .select()
      .single();
    if (orderError || !order) return { error: orderError, orderId: null };

    await supabase
      .from("leads")
      .update({ status: "won", converted_to_order_id: order.id })
      .eq("id", lead.id);

    fetchLeads();
    return { error: null, orderId: order.id };
  };

  useEffect(() => {
    if (user) {
      fetchLeads();
    } else {
      setLoading(false);
    }
  }, [user]);

  return { leads, loading, createLead, updateLead, fetchLeads, convertToClient, convertToOrder };
}
