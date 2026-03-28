import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { Json } from "@/integrations/supabase/types";

export interface SavedCalculation {
  id: string;
  user_id: string;
  product_type: string;
  product_label: string;
  calc_name: string;
  params: Json;
  result: Json;
  created_at: string;
  is_auto_saved: boolean;
  client_id: string | null;
  lead_id: string | null;
}

export function useCalculations() {
  const { user, isAdmin } = useAuth();
  const [calculations, setCalculations] = useState<SavedCalculation[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCalculations = async () => {
    if (!user) return;

    let query = supabase
      .from("saved_calculations")
      .select("*")
      .order("created_at", { ascending: false });

    if (!isAdmin) {
      query = query.eq("is_auto_saved", false);
    }

    const { data } = await query;
    if (data) setCalculations(data);
    setLoading(false);
  };

  const saveCalculation = async (
    productType: string,
    productLabel: string,
    params: Record<string, unknown>,
    result: Record<string, unknown>,
    calcName: string
  ) => {
    if (!user) return { error: new Error("Not authenticated") };
    const { error } = await supabase
      .from("saved_calculations")
      .insert({
        user_id: user.id,
        product_type: productType,
        product_label: productLabel,
        calc_name: calcName,
        params,
        result,
        is_auto_saved: false,
      });
    if (!error) fetchCalculations();
    return { error };
  };

  const deleteCalculation = async (id: string) => {
    const { error } = await supabase
      .from("saved_calculations")
      .delete()
      .eq("id", id);
    if (!error) {
      setCalculations(prev => prev.filter(c => c.id !== id));
    }
    return { error };
  };

  useEffect(() => {
    if (user) fetchCalculations();
  }, [user, isAdmin]);

  return { calculations, loading, saveCalculation, deleteCalculation, fetchCalculations };
}
