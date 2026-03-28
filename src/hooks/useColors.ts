import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesUpdate } from "@/integrations/supabase/types";

export type StandardColor = Tables<"standard_colors">;

export function useColors() {
  const [colors, setColors] = useState<StandardColor[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchColors = async () => {
    const { data } = await supabase
      .from("standard_colors")
      .select("*")
      .eq("is_active", true)
      .order("sort_order");
    if (data) setColors(data);
    setLoading(false);
  };

  const fetchAllColors = async () => {
    const { data } = await supabase
      .from("standard_colors")
      .select("*")
      .order("sort_order");
    return data || [];
  };

  const addColor = async (name: string, sort_order: number) => {
    const { error } = await supabase
      .from("standard_colors")
      .insert({ name, sort_order });
    if (!error) fetchColors();
    return { error };
  };

  const updateColor = async (id: string, updates: TablesUpdate<"standard_colors">) => {
    const { error } = await supabase
      .from("standard_colors")
      .update(updates)
      .eq("id", id);
    if (!error) fetchColors();
    return { error };
  };

  const deleteColor = async (id: string) => {
    const { error } = await supabase
      .from("standard_colors")
      .delete()
      .eq("id", id);
    if (!error) fetchColors();
    return { error };
  };

  useEffect(() => { fetchColors(); }, []);

  return { colors, loading, fetchColors, fetchAllColors, addColor, updateColor, deleteColor };
}
