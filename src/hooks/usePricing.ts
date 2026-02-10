import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface PricingSetting {
  key: string;
  value: number;
  label: string;
  category: string;
}

export function usePricing() {
  const [settings, setSettings] = useState<Record<string, number>>({});
  const [allSettings, setAllSettings] = useState<PricingSetting[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSettings = async () => {
    const { data } = await supabase.from("pricing_settings").select("*");
    if (data) {
      const map: Record<string, number> = {};
      data.forEach((s: any) => {
        map[s.key] = Number(s.value);
      });
      setSettings(map);
      setAllSettings(data.map((s: any) => ({ key: s.key, value: Number(s.value), label: s.label, category: s.category })));
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const updateSetting = async (key: string, value: number) => {
    const { error } = await supabase
      .from("pricing_settings")
      .update({ value })
      .eq("key", key);
    if (!error) {
      setSettings((prev) => ({ ...prev, [key]: value }));
      setAllSettings((prev) => prev.map((s) => (s.key === key ? { ...s, value } : s)));
    }
    return { error };
  };

  return { settings, allSettings, loading, updateSetting, refetch: fetchSettings };
}
