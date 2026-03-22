import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useColors, StandardColor } from "@/hooks/useColors";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Upload, ImageIcon, Printer } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export default function ColorsTab() {
  const { fetchAllColors, addColor, updateColor, deleteColor } = useColors();
  const [allColors, setAllColors] = useState<StandardColor[]>([]);
  const [newColorName, setNewColorName] = useState("");
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeUploadId, setActiveUploadId] = useState<string | null>(null);

  useEffect(() => { fetchAllColors().then(setAllColors); }, []);

  const handleAddColor = async () => {
    if (!newColorName.trim()) return;
    // Duplicate check
    const duplicate = allColors.find(c => c.name.toLowerCase() === newColorName.trim().toLowerCase());
    if (duplicate) {
      toast.error(`Цвет «${duplicate.name}» уже существует`);
      return;
    }
    const { error } = await addColor(newColorName.trim(), allColors.length + 1);
    if (error) toast.error("Ошибка добавления");
    else { toast.success("Цвет добавлен"); setNewColorName(""); fetchAllColors().then(setAllColors); }
  };

  const handleImageUpload = async (colorId: string, file: File) => {
    if (!file.type.startsWith("image/")) { toast.error("Выберите изображение"); return; }
    if (file.size > 2 * 1024 * 1024) { toast.error("Макс. 2 МБ"); return; }

    setUploadingId(colorId);
    const ext = file.name.split(".").pop();
    const path = `colors/${colorId}.${ext}`;

    await supabase.storage.from("company-assets").remove([path]);
    const { error: uploadError } = await supabase.storage
      .from("company-assets")
      .upload(path, file, { upsert: true });

    if (uploadError) {
      toast.error("Ошибка загрузки");
      setUploadingId(null);
      return;
    }

    const { data: urlData } = supabase.storage.from("company-assets").getPublicUrl(path);
    const imageUrl = urlData.publicUrl + "?t=" + Date.now();

    await updateColor(colorId, { image_url: imageUrl } as any);
    setUploadingId(null);
    toast.success("Фото загружено");
    fetchAllColors().then(setAllColors);
  };

  const handleDeleteImage = async (colorId: string) => {
    await updateColor(colorId, { image_url: "" } as any);
    toast.success("Фото удалено");
    fetchAllColors().then(setAllColors);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-panel p-6">
      <h2 className="text-lg font-semibold mb-4 text-primary">Стандартные цвета</h2>
      <div className="space-y-3">
        {allColors.map((c) => (
          <div key={c.id} className="flex items-center gap-3">
            {/* Color image thumbnail */}
            <div className="w-10 h-10 rounded border border-border overflow-hidden shrink-0 flex items-center justify-center bg-secondary">
              {c.image_url ? (
                <img src={c.image_url} alt={c.name} className="w-full h-full object-cover" />
              ) : (
                <ImageIcon className="w-4 h-4 text-muted-foreground" />
              )}
            </div>
            <span className={`flex-1 text-sm ${c.is_active ? "" : "text-muted-foreground line-through"}`}>{c.name}</span>
            {/* Print toggle */}
            <div className="flex items-center gap-1.5" title="Показывать в печати">
              <Printer className="w-3.5 h-3.5 text-muted-foreground" />
              <Switch
                checked={c.show_in_print !== false}
                onCheckedChange={async (checked) => {
                  await updateColor(c.id, { show_in_print: checked } as any);
                  fetchAllColors().then(setAllColors);
                }}
              />
            </div>
            {/* Upload photo button */}
            <Button
              size="sm"
              variant="ghost"
              disabled={uploadingId === c.id}
              onClick={() => { setActiveUploadId(c.id); fileInputRef.current?.click(); }}
              title="Загрузить фото"
            >
              <Upload className="w-4 h-4" />
            </Button>
            {c.image_url && (
              <Button size="sm" variant="ghost" onClick={() => handleDeleteImage(c.id)} title="Удалить фото" className="text-destructive hover:text-destructive">
                <ImageIcon className="w-4 h-4" />
              </Button>
            )}
            <Button size="sm" variant={c.is_active ? "secondary" : "outline"} onClick={async () => { await updateColor(c.id, { is_active: !c.is_active }); fetchAllColors().then(setAllColors); }}>
              {c.is_active ? "Активен" : "Выкл"}
            </Button>
            <Button size="sm" variant="ghost" onClick={async () => { await deleteColor(c.id); fetchAllColors().then(setAllColors); }} className="text-destructive hover:text-destructive">
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        ))}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file && activeUploadId) handleImageUpload(activeUploadId, file);
          e.target.value = "";
          setActiveUploadId(null);
        }}
      />

      <Separator className="my-4 bg-border/50" />
      <div className="flex gap-2">
        <Input value={newColorName} onChange={(e) => setNewColorName(e.target.value)} placeholder="Новый цвет" className="bg-secondary border-border" />
        <Button onClick={handleAddColor} className="gap-1.5 shrink-0"><Plus className="w-4 h-4" /> Добавить</Button>
      </div>
    </motion.div>
  );
}
