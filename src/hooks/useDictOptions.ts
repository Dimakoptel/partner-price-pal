import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface DictOption {
  value: string;       // item.code
  label: string;       // item.name
  color: string;       // item.color || ""
  sortOrder: number;
  tags: string[];      // semantic_tags — by what business logic identifies the item
}

/**
 * Load dictionary items by type code and return as DictOption[] with semantic tags.
 *
 * Semantic tags allow business logic to be code-agnostic: instead of comparing
 * status === "in_progress", code asks `hasTag(status, "active")`. This lets
 * administrators freely rename / replace dictionary codes without breaking
 * the system, as long as the tag remains on at least one active item.
 */
export function useDictOptions(typeCode: string, fallback: DictOption[] = []) {
  const query = useQuery({
    queryKey: ["dict_options", typeCode],
    queryFn: async () => {
      const { data: typeData } = await supabase
        .from("dictionary_types")
        .select("id")
        .eq("code", typeCode)
        .single();
      if (!typeData) return [];

      const { data, error } = await (supabase.from("dictionary_items" as any) as any)
        .select("code, name, color, sort_order, semantic_tags")
        .eq("type_id", typeData.id)
        .eq("is_active", true)
        .order("sort_order");
      if (error) throw error;
      return (data ?? []).map((item: any) => ({
        value: item.code as string,
        label: item.name as string,
        color: (item.color || "") as string,
        sortOrder: item.sort_order as number,
        tags: (item.semantic_tags ?? []) as string[],
      }));
    },
    staleTime: 5 * 60 * 1000,
  });

  const options = query.data && query.data.length > 0 ? query.data : fallback;

  /** Find option by code */
  const find = (code: string): DictOption =>
    options.find((o) => o.value === code) || {
      value: code, label: code, color: "#888", sortOrder: 0, tags: [],
    };

  const label = (code: string): string => find(code).label;
  const color = (code: string): string => find(code).color;

  /** Check whether the item with this code carries the given semantic tag */
  const hasTag = (code: string, tag: string): boolean =>
    find(code).tags.includes(tag);

  /** Find the first active option that carries the given tag (or undefined) */
  const byTag = (tag: string): DictOption | undefined =>
    options.find((o) => o.tags.includes(tag));

  /** Like byTag, but returns the code or a fallback */
  const codeByTag = (tag: string, fallbackCode = ""): string =>
    byTag(tag)?.value ?? fallbackCode;

  return {
    options,
    find,
    label,
    color,
    hasTag,
    byTag,
    codeByTag,
    isLoading: query.isLoading,
  };
}
