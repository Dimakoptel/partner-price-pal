import { supabase } from "@/integrations/supabase/client";

export async function fetchNomenclatureColors(nomenclatureId: string): Promise<string[]> {
  const { data } = await supabase
    .from("nomenclature_colors")
    .select("color_id")
    .eq("nomenclature_id", nomenclatureId);
  return data?.map(d => d.color_id) || [];
}

export async function saveNomenclatureColors(nomenclatureId: string, colorIds: string[]) {
  await supabase
    .from("nomenclature_colors")
    .delete()
    .eq("nomenclature_id", nomenclatureId);
  if (colorIds.length > 0) {
    const rows = colorIds.map(color_id => ({ nomenclature_id: nomenclatureId, color_id }));
    await supabase.from("nomenclature_colors").insert(rows);
  }
}
