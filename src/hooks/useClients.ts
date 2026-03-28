import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type Client = Tables<"clients">;
export type ClientInsert = TablesInsert<"clients">;
export type ClientUpdate = TablesUpdate<"clients">;

export function useClients() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const clientsQuery = useQuery({
    queryKey: ["clients", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Client[];
    },
    enabled: !!user,
  });

  const addClient = useMutation({
    mutationFn: async (client: Omit<ClientInsert, "created_by">) => {
      if (!user) throw new Error("Not authenticated");
      const { data, error } = await supabase
        .from("clients")
        .insert({ ...client, created_by: user.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["clients"] });
      toast.success("Клиент добавлен");
    },
    onError: (e) => toast.error("Ошибка: " + e.message),
  });

  const updateClient = useMutation({
    mutationFn: async ({ id, ...updates }: ClientUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from("clients")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["clients"] });
      toast.success("Клиент обновлён");
    },
    onError: (e) => toast.error("Ошибка: " + e.message),
  });

  const deleteClient = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("clients").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["clients"] });
      toast.success("Клиент удалён");
    },
    onError: (e) => toast.error("Ошибка: " + e.message),
  });

  return { clients: clientsQuery.data ?? [], isLoading: clientsQuery.isLoading, addClient, updateClient, deleteClient };
}
