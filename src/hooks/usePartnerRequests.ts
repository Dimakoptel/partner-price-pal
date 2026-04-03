import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface PartnerRequest {
  id: string;
  number: string;
  client_id: string;
  user_id: string;
  category_id: string | null;
  product_type: string | null;
  params: Record<string, any>;
  status: string;
  retail_price: number | null;
  partner_price: number | null;
  assigned_manager_id: string | null;
  attachment_urls: string[];
  notes: string | null;
  converted_order_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface PartnerRequestMessage {
  id: string;
  request_id: string;
  user_id: string;
  message: string;
  attachment_urls: string[];
  created_at: string;
}

export function usePartnerRequests() {
  const { user, partnerClientId } = useAuth();
  const queryClient = useQueryClient();

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ["partner_requests", user?.id],
    queryFn: async () => {
      const { data, error } = await (supabase.from("partner_requests" as any) as any)
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as PartnerRequest[];
    },
    enabled: !!user,
  });

  const createRequest = useMutation({
    mutationFn: async (req: {
      category_id?: string;
      product_type?: string;
      params: Record<string, any>;
      notes?: string;
      attachment_urls?: string[];
    }) => {
      if (!user || !partnerClientId) throw new Error("Not a partner");
      const { data, error } = await (supabase.from("partner_requests" as any) as any)
        .insert({
          client_id: partnerClientId,
          user_id: user.id,
          category_id: req.category_id || null,
          product_type: req.product_type || null,
          params: req.params,
          notes: req.notes || null,
          attachment_urls: req.attachment_urls || [],
        })
        .select()
        .single();
      if (error) throw error;
      return data as PartnerRequest;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["partner_requests"] });
    },
  });

  return { requests, loading: isLoading, createRequest };
}

export function usePartnerRequestMessages(requestId: string | null) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ["partner_request_messages", requestId],
    queryFn: async () => {
      if (!requestId) return [];
      const { data, error } = await (supabase.from("partner_request_messages" as any) as any)
        .select("*")
        .eq("request_id", requestId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data || []) as PartnerRequestMessage[];
    },
    enabled: !!requestId,
  });

  // Subscribe to realtime
  const subscribeToMessages = (requestId: string) => {
    const channel = supabase
      .channel(`partner_messages_${requestId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "partner_request_messages", filter: `request_id=eq.${requestId}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ["partner_request_messages", requestId] });
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  };

  const sendMessage = useMutation({
    mutationFn: async (msg: { message: string; attachment_urls?: string[] }) => {
      if (!user || !requestId) throw new Error("Missing data");
      const { data, error } = await (supabase.from("partner_request_messages" as any) as any)
        .insert({
          request_id: requestId,
          user_id: user.id,
          message: msg.message,
          attachment_urls: msg.attachment_urls || [],
        })
        .select()
        .single();
      if (error) throw error;
      return data as PartnerRequestMessage;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["partner_request_messages", requestId] });
    },
  });

  return { messages, loading: isLoading, sendMessage, subscribeToMessages };
}

export function usePartnerDiscounts(clientId: string | null) {
  const { data: discounts = [], isLoading } = useQuery({
    queryKey: ["partner_discounts", clientId],
    queryFn: async () => {
      if (!clientId) return [];
      const { data, error } = await (supabase.from("partner_discounts" as any) as any)
        .select("*")
        .eq("client_id", clientId);
      if (error) throw error;
      return (data || []) as Array<{
        id: string;
        client_id: string;
        category_id: string;
        discount_percent: number;
      }>;
    },
    enabled: !!clientId,
  });

  const getDiscountForCategory = (categoryId: string): number => {
    const d = discounts.find((disc) => disc.category_id === categoryId);
    return d?.discount_percent || 0;
  };

  return { discounts, loading: isLoading, getDiscountForCategory };
}
