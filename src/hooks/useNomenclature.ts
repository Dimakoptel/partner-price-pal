import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface NomenclatureItem {
  id: string;
  sku: string;
  name: string;
  category: string;
  size_mm: string;
  weight_kg: number;
  characteristics: string;
  unit: string;
  price_dealer: number;
  price_wholesale: number;
  price_partner: number;
  price_rrp: number;
  photo_url: string;
  photo_urls: string[];
  drawing_url: string;
  description: string;
  show_in_pricelist: boolean;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
  created_by: string;
}

export function useNomenclature() {
  const { user } = useAuth();
  const [items, setItems] = useState<NomenclatureItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchItems = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("nomenclature" as any)
      .select("*")
      .order("sort_order", { ascending: true });
    if (data) setItems((data as any[]).map(d => ({
      ...d,
      photo_urls: d.photo_urls || (d.photo_url ? [d.photo_url] : []),
    })));
    setLoading(false);
  };

  useEffect(() => { fetchItems(); }, []);

  const createItem = async (item: Partial<NomenclatureItem>) => {
    if (!user) return { error: { message: "Not authenticated" } };
    const { photo_urls, ...rest } = item as any;
    const payload: any = {
      ...rest,
      created_by: user.id,
      photo_urls: (photo_urls || []).slice(0, 5),
      photo_url: (photo_urls || [])[0] || item.photo_url || "",
    };
    const { data, error } = await supabase
      .from("nomenclature" as any)
      .insert(payload as any)
      .select()
      .single();
    if (!error && data) setItems(prev => [...prev, { ...(data as any), photo_urls: (data as any).photo_urls || [] }]);
    return { data, error };
  };

  const updateItem = async (id: string, updates: Partial<NomenclatureItem>) => {
    const { photo_urls, ...rest } = updates as any;
    const payload: any = {
      ...rest,
      updated_at: new Date().toISOString(),
    };
    if (photo_urls !== undefined) {
      payload.photo_urls = photo_urls.slice(0, 5);
      payload.photo_url = photo_urls[0] || "";
    }
    const { data, error } = await supabase
      .from("nomenclature" as any)
      .update(payload as any)
      .eq("id", id)
      .select()
      .single();
    if (!error && data) setItems(prev => prev.map(i => i.id === id ? { ...(data as any), photo_urls: (data as any).photo_urls || [] } : i));
    return { data, error };
  };

  const deleteItem = async (id: string) => {
    const { error } = await supabase.from("nomenclature" as any).delete().eq("id", id);
    if (!error) setItems(prev => prev.filter(i => i.id !== id));
    return { error };
  };

  const priceListItems = items.filter(i => i.show_in_pricelist && i.is_active);

  return { items, priceListItems, loading, createItem, updateItem, deleteItem, refetch: fetchItems };
}
