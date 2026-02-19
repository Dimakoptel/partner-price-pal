import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface StandardColor {
  id: string;
  name: string;
  sort_order: number;
  is_active: boolean;
  image_url?: string;
}

export function useColors() {
  const [colors, setColors] = useState<StandardColor[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchColors = async () => {
    const { data } = await supabase
      .from("standard_colors" as any)
      .select("*")
      .eq("is_active", true)
      .order("sort_order") as { data: StandardColor[] | null };
    if (data) setColors(data);
    setLoading(false);
  };

  const fetchAllColors = async () => {
    const { data } = await supabase
      .from("standard_colors" as any)
      .select("*")
      .order("sort_order") as { data: StandardColor[] | null };
    return data || [];
  };

  const addColor = async (name: string, sort_order: number) => {
    const { error } = await (supabase
      .from("standard_colors" as any) as any)
      .insert({ name, sort_order });
    if (!error) fetchColors();
    return { error };
  };

  const updateColor = async (id: string, updates: Partial<StandardColor>) => {
    const { error } = await (supabase
      .from("standard_colors" as any) as any)
      .update(updates)
      .eq("id", id);
    if (!error) fetchColors();
    return { error };
  };

  const deleteColor = async (id: string) => {
    const { error } = await (supabase
      .from("standard_colors" as any) as any)
      .delete()
      .eq("id", id);
    if (!error) fetchColors();
    return { error };
  };

  useEffect(() => { fetchColors(); }, []);

  return { colors, loading, fetchColors, fetchAllColors, addColor, updateColor, deleteColor };
}
