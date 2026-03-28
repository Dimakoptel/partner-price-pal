import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type CompanySetting = Tables<"company_settings">;

export function useCompanySettings() {
  const [settings, setSettings] = useState<CompanySetting[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSettings = async () => {
    const { data } = await supabase
      .from("company_settings")
      .select("*")
      .order("sort_order", { ascending: true });
    if (data) setSettings(data);
    setLoading(false);
  };

  const getSetting = (key: string) => {
    return settings.find((s) => s.key === key)?.value || "";
  };

  const updateSetting = async (key: string, value: string) => {
    const { error } = await supabase
      .from("company_settings")
      .update({ value, updated_at: new Date().toISOString() })
      .eq("key", key);
    if (!error) fetchSettings();
    return { error };
  };

  const addSetting = async (key: string, label: string, value: string, category: string) => {
    const maxOrder = settings.reduce((max, s) => Math.max(max, s.sort_order), 0);
    const { error } = await supabase
      .from("company_settings")
      .insert({ key, label, value, category, sort_order: maxOrder + 1 });
    if (!error) fetchSettings();
    return { error };
  };

  const deleteSetting = async (id: string) => {
    const { error } = await supabase
      .from("company_settings")
      .delete()
      .eq("id", id);
    if (!error) fetchSettings();
    return { error };
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  return { settings, loading, getSetting, updateSetting, addSetting, deleteSetting, fetchSettings };
}
