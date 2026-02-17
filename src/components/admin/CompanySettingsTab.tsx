import { useState } from "react";
import { motion } from "framer-motion";
import { useCompanySettings } from "@/hooks/useCompanySettings";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Save, Check, Plus, Trash2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

const CATEGORY_OPTIONS = [
  { value: "contacts", label: "Контакты" },
  { value: "social", label: "Соцсети" },
  { value: "conditions", label: "Условия" },
];

export default function CompanySettingsTab() {
  const { settings, updateSetting, addSetting, deleteSetting, loading } = useCompanySettings();
  const [editValues, setEditValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});

  // New setting form
  const [newKey, setNewKey] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [newValue, setNewValue] = useState("");
  const [newCategory, setNewCategory] = useState("contacts");

  const handleSave = async (key: string) => {
    const val = editValues[key];
    if (val === undefined) return;
    setSaving((p) => ({ ...p, [key]: true }));
    const { error } = await updateSetting(key, val);
    setSaving((p) => ({ ...p, [key]: false }));
    if (error) toast.error("Ошибка сохранения");
    else {
      toast.success("Сохранено");
      setEditValues((p) => { const n = { ...p }; delete n[key]; return n; });
    }
  };

  const handleAdd = async () => {
    if (!newKey.trim() || !newLabel.trim()) {
      toast.error("Заполните ключ и название");
      return;
    }
    const { error } = await addSetting(newKey.trim(), newLabel.trim(), newValue.trim(), newCategory);
    if (error) toast.error("Ошибка добавления");
    else {
      toast.success("Добавлено");
      setNewKey("");
      setNewLabel("");
      setNewValue("");
    }
  };

  const handleDelete = async (id: string, label: string) => {
    if (!confirm(`Удалить "${label}"?`)) return;
    const { error } = await deleteSetting(id);
    if (error) toast.error("Ошибка удаления");
    else toast.success("Удалено");
  };

  if (loading) return <div className="animate-pulse text-muted-foreground">Загрузка...</div>;

  // Group by category
  const grouped: Record<string, typeof settings> = {};
  settings.forEach((s) => {
    const cat = s.category || "contacts";
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(s);
  });

  return (
    <div className="space-y-6">
      {Object.entries(grouped).map(([category, items]) => (
        <motion.div key={category} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-panel p-5">
          <h2 className="text-base font-semibold mb-4 text-primary">
            {CATEGORY_OPTIONS.find((c) => c.value === category)?.label || category}
          </h2>
          <div className="space-y-3">
            {items.map((s) => {
              const isEditing = editValues[s.key] !== undefined;
              const currentValue = isEditing ? editValues[s.key] : s.value;
              return (
                <div key={s.key} className="flex items-center gap-2">
                  <div className="flex-1 min-w-0">
                    <label className="text-sm font-medium block">{s.label}</label>
                    <span className="text-xs text-muted-foreground">{s.key}</span>
                  </div>
                  <Input
                    value={currentValue}
                    onChange={(e) => setEditValues((p) => ({ ...p, [s.key]: e.target.value }))}
                    className="w-56 bg-secondary border-border text-right"
                  />
                  {isEditing && (
                    <Button size="sm" onClick={() => handleSave(s.key)} disabled={saving[s.key]} className="shrink-0">
                      {saving[s.key] ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" onClick={() => handleDelete(s.id, s.label)} className="text-muted-foreground hover:text-destructive shrink-0">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              );
            })}
          </div>
        </motion.div>
      ))}

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-panel p-5">
        <h2 className="text-base font-semibold mb-4 text-primary">Добавить новый параметр</h2>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <Label className="text-xs">Ключ (латиница)</Label>
            <Input value={newKey} onChange={(e) => setNewKey(e.target.value)} placeholder="phone_main" className="bg-secondary border-border" />
          </div>
          <div>
            <Label className="text-xs">Название</Label>
            <Input value={newLabel} onChange={(e) => setNewLabel(e.target.value)} placeholder="Основной телефон" className="bg-secondary border-border" />
          </div>
          <div>
            <Label className="text-xs">Значение</Label>
            <Input value={newValue} onChange={(e) => setNewValue(e.target.value)} placeholder="+7 999 123-45-67" className="bg-secondary border-border" />
          </div>
          <div>
            <Label className="text-xs">Категория</Label>
            <Select value={newCategory} onValueChange={setNewCategory}>
              <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
              <SelectContent>
                {CATEGORY_OPTIONS.map((c) => (
                  <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <Button onClick={handleAdd} className="gap-1.5">
          <Plus className="w-4 h-4" /> Добавить
        </Button>
      </motion.div>
    </div>
  );
}
