import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { useCompanySettings } from "@/hooks/useCompanySettings";
import { PRODUCTS } from "@/lib/calculator";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Save, Check, Upload, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export default function ProductIconsTab() {
  const { settings, updateSetting, addSetting, loading } = useCompanySettings();
  const [editValues, setEditValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [uploading, setUploading] = useState<Record<string, boolean>>({});
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const getIconValue = (productType: string) => {
    const key = `product_icon_${productType}`;
    if (editValues[key] !== undefined) return editValues[key];
    return settings.find(s => s.key === key)?.value || "";
  };

  const handleSave = async (productType: string) => {
    const key = `product_icon_${productType}`;
    const val = editValues[key];
    if (val === undefined) return;
    setSaving(p => ({ ...p, [key]: true }));

    const exists = settings.find(s => s.key === key);
    let error;
    if (exists) {
      ({ error } = await updateSetting(key, val));
    } else {
      const product = PRODUCTS.find(p => p.type === productType);
      ({ error } = await addSetting(key, `Иконка: ${product?.label || productType}`, val, "product_icons"));
    }

    setSaving(p => ({ ...p, [key]: false }));
    if (error) toast.error("Ошибка сохранения");
    else {
      toast.success("Сохранено");
      setEditValues(p => { const n = { ...p }; delete n[key]; return n; });
    }
  };

  const handleImageUpload = async (productType: string, file: File) => {
    const key = `product_icon_${productType}`;
    if (!file.type.startsWith("image/")) {
      toast.error("Выберите изображение");
      return;
    }
    if (file.size > 1 * 1024 * 1024) {
      toast.error("Максимальный размер — 1 МБ");
      return;
    }

    setUploading(p => ({ ...p, [key]: true }));
    const ext = file.name.split(".").pop();
    const path = `product-icon-${productType}.${ext}`;

    await supabase.storage.from("company-assets").remove([path]);
    const { error: uploadError } = await supabase.storage
      .from("company-assets")
      .upload(path, file, { upsert: true });

    if (uploadError) {
      toast.error("Ошибка загрузки: " + uploadError.message);
      setUploading(p => ({ ...p, [key]: false }));
      return;
    }

    const { data: urlData } = supabase.storage.from("company-assets").getPublicUrl(path);
    const iconUrl = urlData.publicUrl + "?t=" + Date.now();

    const exists = settings.find(s => s.key === key);
    if (exists) {
      await updateSetting(key, iconUrl);
    } else {
      const product = PRODUCTS.find(p => p.type === productType);
      await addSetting(key, `Иконка: ${product?.label || productType}`, iconUrl, "product_icons");
    }

    setUploading(p => ({ ...p, [key]: false }));
    toast.success("Иконка загружена");
  };

  const handleDelete = async (productType: string) => {
    const key = `product_icon_${productType}`;
    const exists = settings.find(s => s.key === key);
    if (exists) {
      await updateSetting(key, "");
      toast.success("Иконка сброшена (будет использоваться стандартная)");
    }
  };

  if (loading) return <div className="animate-pulse text-muted-foreground">Загрузка...</div>;

  return (
    <div className="space-y-4">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-panel p-5">
        <h2 className="text-base font-semibold mb-2 text-primary">Иконки продуктов</h2>
        <p className="text-xs text-muted-foreground mb-4">
          Загрузите изображение или введите эмодзи для каждого типа изделия. Если не задано — используется стандартная иконка.
        </p>

        <div className="space-y-4">
          {PRODUCTS.map(product => {
            const key = `product_icon_${product.type}`;
            const currentIcon = getIconValue(product.type);
            const isEditing = editValues[key] !== undefined;
            const isUrl = currentIcon.startsWith("http");

            return (
              <div key={product.type} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30 border border-border/30">
                {/* Preview */}
                <div className="w-12 h-12 rounded-lg bg-secondary flex items-center justify-center shrink-0 border border-border/50 overflow-hidden">
                  {currentIcon ? (
                    isUrl ? (
                      <img src={currentIcon} alt={product.label} className="w-8 h-8 object-contain" />
                    ) : (
                      <span className="text-2xl">{currentIcon}</span>
                    )
                  ) : (
                    <span className="text-2xl">{product.icon}</span>
                  )}
                </div>

                {/* Info & controls */}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">{product.label}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <Input
                      value={isEditing ? editValues[key] : (isUrl ? "" : currentIcon)}
                      onChange={(e) => setEditValues(p => ({ ...p, [key]: e.target.value }))}
                      placeholder="Эмодзи (например 🪨)"
                      className="h-8 text-sm bg-secondary border-border w-40"
                    />
                    {isEditing && (
                      <Button size="sm" onClick={() => handleSave(product.type)} disabled={saving[key]} className="h-8 px-2">
                        {saving[key] ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
                      </Button>
                    )}
                  </div>
                </div>

                {/* Upload & delete */}
                <div className="flex items-center gap-1 shrink-0">
                  <input
                    ref={el => { fileInputRefs.current[product.type] = el; }}
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImageUpload(product.type, file);
                      e.target.value = "";
                    }}
                    className="hidden"
                  />
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => fileInputRefs.current[product.type]?.click()}
                    disabled={uploading[key]}
                    className="h-8 px-2"
                    title="Загрузить изображение"
                  >
                    <Upload className="w-3.5 h-3.5" />
                  </Button>
                  {currentIcon && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(product.type)}
                      className="h-8 px-2 text-muted-foreground hover:text-destructive"
                      title="Сбросить"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}
