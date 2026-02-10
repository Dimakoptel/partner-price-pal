import { useState } from "react";
import { motion } from "framer-motion";
import AppLayout from "@/components/AppLayout";
import { usePricing } from "@/hooks/usePricing";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Save, Check } from "lucide-react";
import { toast } from "sonner";

const CATEGORY_LABELS: Record<string, string> = {
  general: "Общие параметры",
  countertop: "Столешница",
  sink: "Раковина",
  windowsill: "Подоконник",
  backsplash: "Фартук",
  stair: "Ступени",
  stepslab: "Пошаговая плита",
};

export default function AdminPage() {
  const { allSettings, loading, updateSetting } = usePricing();
  const [editValues, setEditValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});

  const handleSave = async (key: string) => {
    const val = parseFloat(editValues[key]);
    if (isNaN(val)) return;

    setSaving((p) => ({ ...p, [key]: true }));
    const { error } = await updateSetting(key, val);
    setSaving((p) => ({ ...p, [key]: false }));

    if (error) {
      toast.error("Ошибка сохранения");
    } else {
      toast.success("Сохранено");
      setEditValues((p) => { const n = { ...p }; delete n[key]; return n; });
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-20">
          <div className="animate-pulse text-muted-foreground">Загрузка...</div>
        </div>
      </AppLayout>
    );
  }

  // Group by category
  const grouped: Record<string, typeof allSettings> = {};
  allSettings.forEach((s) => {
    if (!grouped[s.category]) grouped[s.category] = [];
    grouped[s.category].push(s);
  });

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <h1 className="text-2xl font-bold mb-1">Настройки цен</h1>
          <p className="text-muted-foreground text-sm mb-6">Управление ценовыми переменными для всех калькуляторов</p>
        </motion.div>

        <div className="space-y-8">
          {Object.entries(grouped).map(([category, items]) => (
            <motion.div
              key={category}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-panel p-6"
            >
              <h2 className="text-lg font-semibold mb-4 text-primary">
                {CATEGORY_LABELS[category] || category}
              </h2>

              <div className="space-y-4">
                {items.map((setting) => {
                  const isEditing = editValues[setting.key] !== undefined;
                  const currentValue = isEditing ? editValues[setting.key] : String(setting.value);

                  return (
                    <div key={setting.key} className="flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <label className="text-sm font-medium block">{setting.label}</label>
                        <span className="text-xs text-muted-foreground">{setting.key}</span>
                      </div>
                      <Input
                        type="number"
                        value={currentValue}
                        onChange={(e) => setEditValues((p) => ({ ...p, [setting.key]: e.target.value }))}
                        className="w-32 bg-secondary border-border text-right"
                        step="any"
                      />
                      {isEditing && (
                        <Button
                          size="sm"
                          onClick={() => handleSave(setting.key)}
                          disabled={saving[setting.key]}
                          className="shrink-0"
                        >
                          {saving[setting.key] ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
