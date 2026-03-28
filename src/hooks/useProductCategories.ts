import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type ProductCategory = Tables<"product_categories">;

export function useProductCategories() {
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCategories = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("product_categories")
      .select("*")
      .order("sort_order");
    if (data) setCategories(data);
    setLoading(false);
  };

  useEffect(() => { fetchCategories(); }, []);

  const addCategory = async (name: string, sort_order: number) => {
    const { error } = await supabase
      .from("product_categories")
      .insert({ name, sort_order });
    if (!error) fetchCategories();
    return { error };
  };

  const updateCategory = async (id: string, updates: Partial<ProductCategory>) => {
    const { error } = await supabase
      .from("product_categories")
      .update(updates)
      .eq("id", id);
    if (!error) fetchCategories();
    return { error };
  };

  const deleteCategory = async (id: string) => {
    const { error } = await supabase
      .from("product_categories")
      .delete()
      .eq("id", id);
    if (!error) fetchCategories();
    return { error };
  };

  const activeCategories = categories.filter(c => c.is_active);

  return { categories, activeCategories, loading, fetchCategories, addCategory, updateCategory, deleteCategory };
}
