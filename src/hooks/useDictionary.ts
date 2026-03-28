import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type DictionaryType = Tables<"dictionary_types">;
export type DictionaryItem = Tables<"dictionary_items">;

export function useDictionary(typeCode?: string) {
  const qc = useQueryClient();

  const typesQuery = useQuery({
    queryKey: ["dictionary_types"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("dictionary_types")
        .select("*")
        .order("name");
      if (error) throw error;
      return (data ?? []) as DictionaryType[];
    },
  });

  const itemsQuery = useQuery({
    queryKey: ["dictionary_items", typeCode],
    queryFn: async () => {
      if (!typeCode) return [];
      const type = typesQuery.data?.find((t) => t.code === typeCode);
      if (!type) return [];
      const { data, error } = await supabase
        .from("dictionary_items")
        .select("*")
        .eq("type_id", type.id)
        .order("sort_order");
      if (error) throw error;
      return (data ?? []) as DictionaryItem[];
    },
    enabled: !!typeCode && !!typesQuery.data,
  });

  const getItems = (_code: string) => {
    return itemsQuery.data?.filter((i) => i.is_active) ?? [];
  };

  const getActiveItems = () => itemsQuery.data?.filter((i) => i.is_active) ?? [];

  const createItem = useMutation({
    mutationFn: async (item: TablesInsert<"dictionary_items">) => {
      const { data, error } = await supabase
        .from("dictionary_items")
        .insert(item)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["dictionary_items", typeCode] }),
  });

  const updateItem = useMutation({
    mutationFn: async ({ id, ...updates }: TablesUpdate<"dictionary_items"> & { id: string }) => {
      const { data, error } = await supabase
        .from("dictionary_items")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["dictionary_items", typeCode] }),
  });

  const deleteItem = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("dictionary_items")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["dictionary_items", typeCode] }),
  });

  return {
    types: typesQuery.data ?? [],
    items: itemsQuery.data ?? [],
    activeItems: getActiveItems(),
    isLoading: typesQuery.isLoading || itemsQuery.isLoading,
    createItem,
    updateItem,
    deleteItem,
    getItems,
  };
}

/** Shortcut: load items for a specific dictionary type code */
export function useDictionaryItems(typeCode: string) {
  return useQuery({
    queryKey: ["dictionary_items_by_code", typeCode],
    queryFn: async () => {
      const { data: typeData } = await supabase
        .from("dictionary_types")
        .select("id")
        .eq("code", typeCode)
        .single();
      if (!typeData) return [];
      const { data, error } = await supabase
        .from("dictionary_items")
        .select("*")
        .eq("type_id", typeData.id)
        .eq("is_active", true)
        .order("sort_order");
      if (error) throw error;
      return (data ?? []) as DictionaryItem[];
    },
  });
}
