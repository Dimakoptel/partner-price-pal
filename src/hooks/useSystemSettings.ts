import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { Tables } from "@/integrations/supabase/types";

export type SystemSetting = Tables<"system_settings">;

export function useSystemSettings() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["system_settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("system_settings")
        .select("*")
        .order("category")
        .order("key");
      if (error) throw error;
      return (data ?? []) as SystemSetting[];
    },
  });

  const getSetting = (key: string): string => {
    return query.data?.find((s) => s.key === key)?.value ?? "";
  };

  const getNumber = (key: string, fallback = 0): number => {
    const val = getSetting(key);
    const num = parseFloat(val);
    return isNaN(num) ? fallback : num;
  };

  const updateSetting = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string }) => {
      const { error } = await supabase
        .from("system_settings")
        .update({ value, updated_at: new Date().toISOString(), updated_by: user?.id })
        .eq("key", key);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["system_settings"] }),
  });

  return {
    settings: query.data ?? [],
    isLoading: query.isLoading,
    getSetting,
    getNumber,
    updateSetting,
  };
}
