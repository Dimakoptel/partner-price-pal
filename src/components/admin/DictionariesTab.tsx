import { useState } from "react";
import { motion } from "framer-motion";
import { useDictionary, type DictionaryItem, type DictionaryType } from "@/hooks/useDictionary";
import { useSystemSettings } from "@/hooks/useSystemSettings";
import DictionaryItemDialog from "./DictionaryItemDialog";
import { useSystemSettings } from "@/hooks/useSystemSettings";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Plus, Trash2, Save, GripVertical, ChevronRight, Lock, Settings2, Check
} from "lucide-react";
import { toast } from "sonner";

export default function DictionariesTab() {
  const [selectedType, setSelectedType] = useState<string>("");
  const { types, items, isLoading, createItem, updateItem, deleteItem } = useDictionary(selectedType);

  const currentType = types.find((t) => t.code === selectedType);

  // New item form
  const [newCode, setNewCode] = useState("");
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState("");

  const handleAddItem = async () => {
    if (!newCode.trim() || !newName.trim() || !currentType) {
      toast.error("Заполните код и название");
      return;
    }
    const maxOrder = items.reduce((max, i) => Math.max(max, i.sort_order), 0);
    createItem.mutate(
      { type_id: currentType.id, code: newCode.trim(), name: newName.trim(), color: newColor.trim(), sort_order: maxOrder + 1 },
      {
        onSuccess: () => {
          toast.success("Добавлено");
          setNewCode("");
          setNewName("");
          setNewColor("");
        },
        onError: (e: any) => toast.error(e.message),
      }
    );
  };

  const handleToggleActive = (item: DictionaryItem) => {
    updateItem.mutate(
      { id: item.id, is_active: !item.is_active },
      { onError: (e: any) => toast.error(e.message) }
    );
  };

  const handleToggleDefault = (item: DictionaryItem) => {
    // Unset other defaults first
    items
      .filter((i) => i.is_default && i.id !== item.id)
      .forEach((i) => updateItem.mutate({ id: i.id, is_default: false }));
    updateItem.mutate(
      { id: item.id, is_default: !item.is_default },
      { onError: (e: any) => toast.error(e.message) }
    );
  };

  const handleDelete = (item: DictionaryItem) => {
    if (!confirm(`Удалить «${item.name}»?`)) return;
    deleteItem.mutate(item.id, {
      onSuccess: () => toast.success("Удалено"),
      onError: (e: any) => toast.error(e.message),
    });
  };

  if (isLoading) return <div className="animate-pulse text-muted-foreground p-4">Загрузка...</div>;

  return (
    <div className="space-y-6">
      {/* Type selector */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-panel p-5">
        <h2 className="text-base font-semibold mb-4 text-primary flex items-center gap-2">
          <Settings2 className="w-4 h-4" /> Справочники системы
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
          {types.map((t) => (
            <button
              key={t.code}
              onClick={() => setSelectedType(t.code)}
              className={`flex items-center gap-2 px-3 py-2.5 text-sm border transition-all ${
                selectedType === t.code
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-muted-foreground border-border hover:text-foreground hover:border-foreground/30"
              }`}
            >
              {t.is_system && <Lock className="w-3 h-3 shrink-0" />}
              <span className="truncate font-light">{t.name}</span>
              <ChevronRight className="w-3 h-3 ml-auto shrink-0" />
            </button>
          ))}
        </div>
      </motion.div>

      {/* Items list */}
      {currentType && (
        <motion.div
          key={selectedType}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-primary">{currentType.name}</h2>
            {currentType.is_system && (
              <Badge variant="outline" className="text-xs gap-1">
                <Lock className="w-3 h-3" /> Системный
              </Badge>
            )}
          </div>

          {/* Items table */}
          <div className="space-y-1.5 mb-6">
            {items.length === 0 && (
              <p className="text-sm text-muted-foreground py-4 text-center">Нет значений</p>
            )}
            {items.map((item) => (
              <div
                key={item.id}
                className={`flex items-center gap-3 px-3 py-2.5 border border-border bg-card transition-all ${
                  !item.is_active ? "opacity-50" : ""
                }`}
              >
                <GripVertical className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                {item.color && (
                  <div
                    className="w-3 h-3 rounded-full shrink-0 border border-border"
                    style={{ backgroundColor: item.color }}
                  />
                )}
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium block truncate">{item.name}</span>
                  <span className="text-xs text-muted-foreground">{item.code}</span>
                </div>
                {item.is_default && (
                  <Badge variant="secondary" className="text-[10px] shrink-0">По умолч.</Badge>
                )}
                <button
                  onClick={() => handleToggleDefault(item)}
                  title="По умолчанию"
                  className={`p-1 transition-colors ${item.is_default ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
                <Switch
                  checked={item.is_active}
                  onCheckedChange={() => handleToggleActive(item)}
                  className="shrink-0"
                />
                {!currentType.is_system && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(item)}
                    className="text-muted-foreground hover:text-destructive shrink-0 h-7 w-7 p-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                )}
              </div>
            ))}
          </div>

          {/* Add new */}
          {!currentType.is_system && (
            <>
              <Separator className="mb-4" />
              <div className="flex items-end gap-2 flex-wrap">
                <div className="flex-1 min-w-[120px]">
                  <Label className="text-xs">Код</Label>
                  <Input
                    value={newCode}
                    onChange={(e) => setNewCode(e.target.value)}
                    placeholder="new_value"
                    className="bg-secondary border-border text-sm"
                  />
                </div>
                <div className="flex-1 min-w-[120px]">
                  <Label className="text-xs">Название</Label>
                  <Input
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Новое значение"
                    className="bg-secondary border-border text-sm"
                  />
                </div>
                <div className="w-24">
                  <Label className="text-xs">Цвет</Label>
                  <Input
                    type="color"
                    value={newColor || "#6366f1"}
                    onChange={(e) => setNewColor(e.target.value)}
                    className="bg-secondary border-border h-9 p-1"
                  />
                </div>
                <Button onClick={handleAddItem} size="sm" className="gap-1.5 shrink-0">
                  <Plus className="w-3.5 h-3.5" /> Добавить
                </Button>
              </div>
            </>
          )}
        </motion.div>
      )}

      {/* System Settings */}
      <SystemSettingsSection />
    </div>
  );
}

function SystemSettingsSection() {
  const { settings, isLoading, updateSetting } = useSystemSettings();
  const [editValues, setEditValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});

  const handleSave = async (key: string) => {
    const val = editValues[key];
    if (val === undefined) return;
    setSaving((p) => ({ ...p, [key]: true }));
    updateSetting.mutate(
      { key, value: val },
      {
        onSuccess: () => {
          toast.success("Сохранено");
          setEditValues((p) => {
            const n = { ...p };
            delete n[key];
            return n;
          });
          setSaving((p) => ({ ...p, [key]: false }));
        },
        onError: (e: any) => {
          toast.error(e.message);
          setSaving((p) => ({ ...p, [key]: false }));
        },
      }
    );
  };

  if (isLoading) return null;

  const grouped: Record<string, typeof settings> = {};
  settings.forEach((s) => {
    if (!grouped[s.category]) grouped[s.category] = [];
    grouped[s.category].push(s);
  });

  const categoryLabels: Record<string, string> = {
    general: "Общие",
    orders: "Заказы",
    warehouse: "Склад",
    production: "Производство",
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-panel p-5">
      <h2 className="text-base font-semibold mb-4 text-primary flex items-center gap-2">
        <Settings2 className="w-4 h-4" /> Системные настройки
      </h2>
      {Object.entries(grouped).map(([category, items]) => (
        <div key={category} className="mb-4 last:mb-0">
          <h3 className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
            {categoryLabels[category] || category}
          </h3>
          <div className="space-y-2">
            {items.map((s) => {
              const isEditing = editValues[s.key] !== undefined;
              const currentValue = isEditing ? editValues[s.key] : s.value;
              return (
                <div key={s.key} className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium block">{s.label}</span>
                    {s.description && (
                      <span className="text-xs text-muted-foreground">{s.description}</span>
                    )}
                  </div>
                  <Input
                    type={s.value_type === "number" ? "number" : "text"}
                    value={currentValue}
                    onChange={(e) => setEditValues((p) => ({ ...p, [s.key]: e.target.value }))}
                    className="w-28 bg-secondary border-border text-right text-sm"
                  />
                  {isEditing && (
                    <Button
                      size="sm"
                      onClick={() => handleSave(s.key)}
                      disabled={saving[s.key]}
                      className="shrink-0 h-8 w-8 p-0"
                    >
                      <Save className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </motion.div>
  );
}
