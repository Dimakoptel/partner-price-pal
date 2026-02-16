import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface SavedCalculation {
  id: string;
  user_id: string;
  product_type: string;
  product_label: string;
  calc_name: string;
  params: any;
  result: any;
  created_at: string;
}

export function useCalculations() {
  const { user, isAdmin } = useAuth();
  const [calculations, setCalculations] = useState<SavedCalculation[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCalculations = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("saved_calculations" as any)
      .select("*")
      .order("created_at", { ascending: false }) as { data: SavedCalculation[] | null };
    if (data) setCalculations(data);
    setLoading(false);
  };

  const saveCalculation = async (
    productType: string,
    productLabel: string,
    params: any,
    result: any,
    calcName: string
  ) => {
    if (!user) return { error: new Error("Not authenticated") };
    const { error } = await (supabase
      .from("saved_calculations" as any) as any)
      .insert({
        user_id: user.id,
        product_type: productType,
        product_label: productLabel,
        calc_name: calcName,
        params,
        result,
      });
    if (!error) fetchCalculations();
    return { error };
  };

  const deleteCalculation = async (id: string) => {
    const { error } = await (supabase
      .from("saved_calculations" as any) as any)
      .delete()
      .eq("id", id);
    if (!error) fetchCalculations();
    return { error };
  };

  useEffect(() => {
    if (user) fetchCalculations();
  }, [user]);

  return { calculations, loading, saveCalculation, deleteCalculation, fetchCalculations };
}
