import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

type DictionaryItem = Tables<"dictionary_items">;

export interface DictOption {
  value: string;   // item.code
  label: string;   // item.name
  color: string;   // item.color || ""
  sortOrder: number;
}

/**
 * Load dictionary items by type code and return as {value, label, color}[] options.
 * 
 * Automatically caches via TanStack Query with staleTime=5min.
 * Falls back to provided hardcoded defaults if DB returns empty (graceful degradation).
 */
export function useDictOptions(
  typeCode: string,
  fallback: DictOption[] = [],
) {
  const query = useQuery({
    queryKey: ["dict_options", typeCode],
    queryFn: async () => {
      const { data: typeData } = await supabase
        .from("dictionary_types")
        .select("id")
        .eq("code", typeCode)
        .single();
      if (!typeData) return [];

      const { data, error } = await supabase
        .from("dictionary_items")
        .select("code, name, color, sort_order")
        .eq("type_id", typeData.id)
        .eq("is_active", true)
        .order("sort_order");
      if (error) throw error;
      return (data ?? []).map((item) => ({
        value: item.code,
        label: item.name,
        color: item.color || "",
        sortOrder: item.sort_order,
      }));
    },
    staleTime: 5 * 60 * 1000,
  });

  const options = query.data && query.data.length > 0 ? query.data : fallback;

  /** Find option by code */
  const find = (code: string): DictOption =>
    options.find((o) => o.value === code) || { value: code, label: code, color: "#888", sortOrder: 0 };

  /** Get label by code */
  const label = (code: string): string => find(code).label;

  /** Get color by code */
  const color = (code: string): string => find(code).color;

  return {
    options,
    find,
    label,
    color,
    isLoading: query.isLoading,
  };
}
