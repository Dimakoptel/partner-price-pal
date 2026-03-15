import { supabase } from "@/integrations/supabase/client";

export interface NomenclatureColor {
  id: string;
  nomenclature_id: string;
  color_id: string;
}

export async function fetchNomenclatureColors(nomenclatureId: string): Promise<string[]> {
  const { data } = await supabase
    .from("nomenclature_colors" as any)
    .select("color_id")
    .eq("nomenclature_id", nomenclatureId) as { data: { color_id: string }[] | null };
  return data?.map(d => d.color_id) || [];
}

export async function saveNomenclatureColors(nomenclatureId: string, colorIds: string[]) {
  // Delete existing
  await (supabase.from("nomenclature_colors" as any) as any)
    .delete().eq("nomenclature_id", nomenclatureId);
  // Insert new
  if (colorIds.length > 0) {
    const rows = colorIds.map(color_id => ({ nomenclature_id: nomenclatureId, color_id }));
    await (supabase.from("nomenclature_colors" as any) as any).insert(rows);
  }
}
