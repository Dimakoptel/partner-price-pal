import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface DictionaryType {
  id: string;
  code: string;
  name: string;
  description: string;
  is_system: boolean;
  created_at: string;
}

export interface DictionaryItem {
  id: string;
  type_id: string;
  code: string;
  name: string;
  description: string;
  color: string;
  icon: string;
  sort_order: number;
  is_active: boolean;
  is_default: boolean;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export function useDictionary(typeCode?: string) {
  const qc = useQueryClient();

  const typesQuery = useQuery({
    queryKey: ["dictionary_types"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("dictionary_types" as any)
        .select("*")
        .order("name") as any;
      if (error) throw error;
      return (data || []) as DictionaryType[];
    },
  });

  const itemsQuery = useQuery({
    queryKey: ["dictionary_items", typeCode],
    queryFn: async () => {
      if (!typeCode) return [];
      const type = typesQuery.data?.find((t) => t.code === typeCode);
      if (!type) return [];
      const { data, error } = await supabase
        .from("dictionary_items" as any)
        .select("*")
        .eq("type_id", type.id)
        .order("sort_order") as any;
      if (error) throw error;
      return (data || []) as DictionaryItem[];
    },
    enabled: !!typeCode && !!typesQuery.data,
  });

  const getItems = (code: string) => {
    return itemsQuery.data?.filter((i) => i.is_active) ?? [];
  };

  const getActiveItems = () => itemsQuery.data?.filter((i) => i.is_active) ?? [];

  const createItem = useMutation({
    mutationFn: async (item: Partial<DictionaryItem>) => {
      const { data, error } = await (supabase
        .from("dictionary_items" as any) as any)
        .insert(item)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["dictionary_items", typeCode] }),
  });

  const updateItem = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<DictionaryItem> & { id: string }) => {
      const { data, error } = await (supabase
        .from("dictionary_items" as any) as any)
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
      const { error } = await (supabase
        .from("dictionary_items" as any) as any)
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
      // Get type first
      const { data: typeData } = await supabase
        .from("dictionary_types" as any)
        .select("id")
        .eq("code", typeCode)
        .single() as any;
      if (!typeData) return [];
      const { data, error } = await supabase
        .from("dictionary_items" as any)
        .select("*")
        .eq("type_id", typeData.id)
        .eq("is_active", true)
        .order("sort_order") as any;
      if (error) throw error;
      return (data || []) as DictionaryItem[];
    },
  });
}
