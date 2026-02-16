import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface CompanySetting {
  id: string;
  key: string;
  value: string;
  label: string;
  category: string;
  sort_order: number;
}

export function useCompanySettings() {
  const [settings, setSettings] = useState<CompanySetting[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSettings = async () => {
    const { data } = await supabase
      .from("company_settings" as any)
      .select("*")
      .order("sort_order", { ascending: true }) as { data: CompanySetting[] | null };
    if (data) setSettings(data);
    setLoading(false);
  };

  const getSetting = (key: string) => {
    return settings.find((s) => s.key === key)?.value || "";
  };

  const updateSetting = async (key: string, value: string) => {
    const { error } = await (supabase
      .from("company_settings" as any) as any)
      .update({ value, updated_at: new Date().toISOString() })
      .eq("key", key);
    if (!error) fetchSettings();
    return { error };
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  return { settings, loading, getSetting, updateSetting, fetchSettings };
}
