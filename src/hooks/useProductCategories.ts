import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface ProductCategory {
  id: string;
  name: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export function useProductCategories() {
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCategories = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("product_categories" as any)
      .select("*")
      .order("sort_order") as { data: ProductCategory[] | null };
    if (data) setCategories(data);
    setLoading(false);
  };

  useEffect(() => { fetchCategories(); }, []);

  const addCategory = async (name: string, sort_order: number) => {
    const { error } = await (supabase.from("product_categories" as any) as any)
      .insert({ name, sort_order });
    if (!error) fetchCategories();
    return { error };
  };

  const updateCategory = async (id: string, updates: Partial<ProductCategory>) => {
    const { error } = await (supabase.from("product_categories" as any) as any)
      .update(updates).eq("id", id);
    if (!error) fetchCategories();
    return { error };
  };

  const deleteCategory = async (id: string) => {
    const { error } = await (supabase.from("product_categories" as any) as any)
      .delete().eq("id", id);
    if (!error) fetchCategories();
    return { error };
  };

  const activeCategories = categories.filter(c => c.is_active);

  return { categories, activeCategories, loading, fetchCategories, addCategory, updateCategory, deleteCategory };
}
