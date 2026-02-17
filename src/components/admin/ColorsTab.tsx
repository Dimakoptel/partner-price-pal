import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useColors, StandardColor } from "@/hooks/useColors";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

export default function ColorsTab() {
  const { fetchAllColors, addColor, updateColor, deleteColor } = useColors();
  const [allColors, setAllColors] = useState<StandardColor[]>([]);
  const [newColorName, setNewColorName] = useState("");

  useEffect(() => { fetchAllColors().then(setAllColors); }, []);

  const handleAddColor = async () => {
    if (!newColorName.trim()) return;
    const { error } = await addColor(newColorName.trim(), allColors.length + 1);
    if (error) toast.error("Ошибка добавления");
    else { toast.success("Цвет добавлен"); setNewColorName(""); fetchAllColors().then(setAllColors); }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-panel p-6">
      <h2 className="text-lg font-semibold mb-4 text-primary">Стандартные цвета</h2>
      <div className="space-y-3">
        {allColors.map((c) => (
          <div key={c.id} className="flex items-center gap-3">
            <span className={`flex-1 text-sm ${c.is_active ? "" : "text-muted-foreground line-through"}`}>{c.name}</span>
            <Button size="sm" variant={c.is_active ? "secondary" : "outline"} onClick={async () => { await updateColor(c.id, { is_active: !c.is_active }); fetchAllColors().then(setAllColors); }}>
              {c.is_active ? "Активен" : "Выкл"}
            </Button>
            <Button size="sm" variant="ghost" onClick={async () => { await deleteColor(c.id); fetchAllColors().then(setAllColors); }} className="text-destructive hover:text-destructive">
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        ))}
      </div>
      <Separator className="my-4 bg-border/50" />
      <div className="flex gap-2">
        <Input value={newColorName} onChange={(e) => setNewColorName(e.target.value)} placeholder="Новый цвет" className="bg-secondary border-border" />
        <Button onClick={handleAddColor} className="gap-1.5 shrink-0"><Plus className="w-4 h-4" /> Добавить</Button>
      </div>
    </motion.div>
  );
}
