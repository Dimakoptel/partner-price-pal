import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { Tables } from "@/integrations/supabase/types";

export type NomenclatureItem = Tables<"nomenclature">;

export function useNomenclature() {
  const { user } = useAuth();
  const [items, setItems] = useState<NomenclatureItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchItems = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("nomenclature")
      .select("*")
      .order("sort_order", { ascending: true });
    if (data) setItems(data.map(d => ({
      ...d,
      photo_urls: d.photo_urls || (d.photo_url ? [d.photo_url] : []),
    })));
    setLoading(false);
  };

  useEffect(() => { fetchItems(); }, []);

  const createItem = async (item: Partial<NomenclatureItem>) => {
    if (!user) return { error: { message: "Not authenticated" } };
    const { photo_urls, ...rest } = item;
    const payload = {
      ...rest,
      created_by: user.id,
      name: rest.name || "",
      photo_urls: (photo_urls || []).slice(0, 5),
      photo_url: (photo_urls || [])[0] || item.photo_url || "",
    };
    const { data, error } = await supabase
      .from("nomenclature")
      .insert([payload])
      .select()
      .single();
    if (!error && data) setItems(prev => [...prev, { ...data, photo_urls: data.photo_urls || [] }]);
    return { data, error };
  };

  const updateItem = async (id: string, updates: Partial<NomenclatureItem>) => {
    const { photo_urls, ...rest } = updates;
    const payload: Record<string, unknown> = {
      ...rest,
      updated_at: new Date().toISOString(),
    };
    if (photo_urls !== undefined) {
      payload.photo_urls = photo_urls.slice(0, 5);
      payload.photo_url = photo_urls[0] || "";
    }
    const { data, error } = await supabase
      .from("nomenclature")
      .update(payload as Parameters<ReturnType<typeof supabase.from>["update"]>[0])
      .eq("id", id)
      .select()
      .single();
    if (!error && data) setItems(prev => prev.map(i => i.id === id ? { ...data, photo_urls: data.photo_urls || [] } : i));
    return { data, error };
  };

  const deleteItem = async (id: string) => {
    const { error } = await supabase.from("nomenclature").delete().eq("id", id);
    if (!error) setItems(prev => prev.filter(i => i.id !== id));
    return { error };
  };

  const priceListItems = items.filter(i => i.show_in_pricelist && i.is_active);

  return { items, priceListItems, loading, createItem, updateItem, deleteItem, refetch: fetchItems };
}
