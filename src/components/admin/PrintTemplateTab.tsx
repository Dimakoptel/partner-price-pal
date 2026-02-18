import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { useCompanySettings } from "@/hooks/useCompanySettings";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Save, Check, Upload, Eye, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice } from "@/components/ResultPanel";

const TEMPLATE_KEYS = [
  { key: "print_company_name", label: "Название компании", defaultValue: "COZY ART", category: "print_template" },
  { key: "print_company_subtitle", label: "Подзаголовок", defaultValue: "архитектурный бетон", category: "print_template" },
  { key: "print_logo_url", label: "URL логотипа", defaultValue: "", category: "print_template" },
  { key: "print_footer_left", label: "Подвал (левая часть)", defaultValue: "", category: "print_template" },
  { key: "print_footer_right", label: "Подвал (правая часть)", defaultValue: "", category: "print_template" },
  { key: "print_conditions", label: "Условия (каждое с новой строки)", defaultValue: "Кронштейн и монтаж приобретаются при необходимости\nДоставка и услуги грузчиков — по тарифам партнёров\nГарантия: 1 год на изделие", category: "print_template" },
];

export default function PrintTemplateTab() {
  const { settings, updateSetting, addSetting, loading } = useCompanySettings();
  const [editValues, setEditValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getValue = (key: string) => {
    if (editValues[key] !== undefined) return editValues[key];
    const found = settings.find(s => s.key === key);
    if (found) return found.value;
    const tmpl = TEMPLATE_KEYS.find(t => t.key === key);
    return tmpl?.defaultValue || "";
  };

  const handleSave = async (key: string) => {
    const val = editValues[key];
    if (val === undefined) return;
    setSaving(p => ({ ...p, [key]: true }));

    const exists = settings.find(s => s.key === key);
    let error;
    if (exists) {
      ({ error } = await updateSetting(key, val));
    } else {
      const tmpl = TEMPLATE_KEYS.find(t => t.key === key);
      ({ error } = await addSetting(key, tmpl?.label || key, val, "print_template"));
    }

    setSaving(p => ({ ...p, [key]: false }));
    if (error) toast.error("Ошибка сохранения");
    else {
      toast.success("Сохранено");
      setEditValues(p => { const n = { ...p }; delete n[key]; return n; });
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Выберите изображение");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Максимальный размер — 2 МБ");
      return;
    }

    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `logo.${ext}`;

    // Remove old logo if exists
    await supabase.storage.from("company-assets").remove([path]);

    const { error: uploadError } = await supabase.storage
      .from("company-assets")
      .upload(path, file, { upsert: true });

    if (uploadError) {
      toast.error("Ошибка загрузки: " + uploadError.message);
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage.from("company-assets").getPublicUrl(path);
    const logoUrl = urlData.publicUrl + "?t=" + Date.now();

    // Save URL to settings
    const exists = settings.find(s => s.key === "print_logo_url");
    if (exists) {
      await updateSetting("print_logo_url", logoUrl);
    } else {
      await addSetting("print_logo_url", "URL логотипа", logoUrl, "print_template");
    }

    setUploading(false);
    toast.success("Логотип загружен");
  };

  const handleDeleteLogo = async () => {
    const exists = settings.find(s => s.key === "print_logo_url");
    if (exists) {
      await updateSetting("print_logo_url", "");
      toast.success("Логотип удалён");
    }
  };

  const logoUrl = getValue("print_logo_url");

  const handlePreview = () => {
    const companyName = getValue("print_company_name") || "COZY ART";
    const subtitle = getValue("print_company_subtitle") || "архитектурный бетон";
    const conditions = getValue("print_conditions") || "";
    const footerLeft = getValue("print_footer_left");
    const footerRight = getValue("print_footer_right");

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`<!DOCTYPE html>
<html lang="ru"><head><meta charset="utf-8"><title>Предпросмотр шаблона</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family:'Inter',sans-serif; color:#1a1a1a; background:#fff; padding:0; }
  .page { max-width:700px; margin:0 auto; padding:40px 32px; }
  .header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:32px; padding-bottom:20px; border-bottom:3px solid #1a1a1a; }
  .logo { font-size:28px; font-weight:700; letter-spacing:2px; }
  .logo-sub { font-size:11px; color:#888; letter-spacing:3px; text-transform:uppercase; margin-top:2px; }
  .logo-img { max-height:60px; max-width:200px; object-fit:contain; }
  .section-title { font-size:11px; text-transform:uppercase; letter-spacing:2px; color:#888; margin-bottom:12px; font-weight:600; }
  .nomenclature { background:#f8f8f8; border-left:4px solid #1a1a1a; padding:16px 20px; margin-bottom:28px; font-size:14px; line-height:1.7; color:#333; }
  .price-table { width:100%; border-collapse:collapse; margin-bottom:28px; }
  .price-table td { padding:12px 0; border-bottom:1px solid #e5e5e5; }
  .conditions { background:#fafafa; border:1px solid #eee; border-radius:6px; padding:16px 20px; margin-bottom:28px; }
  .conditions li { font-size:12px; color:#555; margin-bottom:6px; list-style:none; padding-left:16px; position:relative; }
  .conditions li::before { content:"—"; position:absolute; left:0; color:#bbb; }
  .footer { border-top:2px solid #1a1a1a; padding-top:16px; display:flex; justify-content:space-between; font-size:11px; color:#777; }
  .footer-col { line-height:1.8; }
</style></head><body>
<div class="page">
  <div class="header">
    <div>
      ${logoUrl ? `<img src="${logoUrl}" class="logo-img" alt="Logo"><br>` : ""}
      <div class="logo">${companyName}</div>
      <div class="logo-sub">${subtitle}</div>
    </div>
    <div style="text-align:right;font-size:12px;color:#555;line-height:1.8;">
      Контакты из настроек
    </div>
  </div>

  <div class="section-title">Расчёт стоимости изделия</div>
  <div class="nomenclature">Пример номенклатуры изделия</div>

  <table class="price-table">
    <tr><td>Стоимость изделия</td><td style="text-align:right;font-weight:600;">XX XXX ₽</td></tr>
    <tr><td>Монтажные работы</td><td style="text-align:right;font-weight:600;">XX XXX ₽</td></tr>
    <tr><td colspan="2" style="font-size:12px;color:#555;">Ориентировочный вес: <strong>XX кг</strong></td></tr>
  </table>

  <div class="section-title">Условия</div>
  <div class="conditions">
    <ul>
      ${conditions.split("\n").filter(Boolean).map(l => `<li>${l.trim()}</li>`).join("\n      ")}
    </ul>
  </div>

  <div class="footer">
    ${footerLeft ? `<div class="footer-col">${footerLeft.split("\n").join("<br>")}</div>` : ""}
    ${footerRight ? `<div class="footer-col" style="text-align:right;">${footerRight.split("\n").join("<br>")}</div>` : ""}
  </div>
</div></body></html>`);
    printWindow.document.close();
  };

  if (loading) return <div className="animate-pulse text-muted-foreground">Загрузка...</div>;

  return (
    <div className="space-y-6">
      {/* Logo */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-panel p-5">
        <h2 className="text-base font-semibold mb-4 text-primary">Логотип</h2>
        <div className="flex items-center gap-4">
          {logoUrl ? (
            <div className="relative">
              <img src={logoUrl} alt="Logo" className="h-16 max-w-[200px] object-contain rounded border border-border p-1" />
              <Button size="sm" variant="ghost" onClick={handleDeleteLogo} className="absolute -top-2 -right-2 h-6 w-6 p-0 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/80">
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          ) : (
            <div className="h-16 w-[200px] rounded border border-dashed border-border flex items-center justify-center text-xs text-muted-foreground">
              Нет логотипа
            </div>
          )}
          <div>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
            <Button size="sm" variant="secondary" onClick={() => fileInputRef.current?.click()} disabled={uploading} className="gap-1.5">
              <Upload className="w-4 h-4" />
              {uploading ? "Загрузка..." : "Загрузить"}
            </Button>
            <p className="text-[10px] text-muted-foreground mt-1">PNG, JPG, SVG · макс. 2 МБ</p>
          </div>
        </div>
      </motion.div>

      {/* Template fields */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="glass-panel p-5">
        <h2 className="text-base font-semibold mb-4 text-primary">Шапка и подвал</h2>
        <div className="space-y-4">
          {TEMPLATE_KEYS.filter(t => t.key !== "print_logo_url" && t.key !== "print_conditions").map(tmpl => {
            const value = getValue(tmpl.key);
            const isEditing = editValues[tmpl.key] !== undefined;
            const isTextarea = tmpl.key.includes("footer");
            return (
              <div key={tmpl.key}>
                <Label className="text-sm font-medium">{tmpl.label}</Label>
                {isTextarea ? (
                  <Textarea
                    value={value}
                    onChange={(e) => setEditValues(p => ({ ...p, [tmpl.key]: e.target.value }))}
                    className="mt-1 bg-secondary border-border text-sm"
                    rows={3}
                    placeholder={tmpl.defaultValue || "Каждая строка — отдельная строка в подвале"}
                  />
                ) : (
                  <Input
                    value={value}
                    onChange={(e) => setEditValues(p => ({ ...p, [tmpl.key]: e.target.value }))}
                    className="mt-1 bg-secondary border-border"
                    placeholder={tmpl.defaultValue}
                  />
                )}
                {isEditing && (
                  <Button size="sm" onClick={() => handleSave(tmpl.key)} disabled={saving[tmpl.key]} className="mt-1 gap-1.5">
                    {saving[tmpl.key] ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                    Сохранить
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Conditions */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-panel p-5">
        <h2 className="text-base font-semibold mb-4 text-primary">Условия</h2>
        <Textarea
          value={getValue("print_conditions")}
          onChange={(e) => setEditValues(p => ({ ...p, print_conditions: e.target.value }))}
          className="bg-secondary border-border text-sm"
          rows={5}
          placeholder="Каждая строка — отдельный пункт условий"
        />
        {editValues.print_conditions !== undefined && (
          <Button size="sm" onClick={() => handleSave("print_conditions")} disabled={saving.print_conditions} className="mt-2 gap-1.5">
            {saving.print_conditions ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            Сохранить
          </Button>
        )}
      </motion.div>

      {/* Preview */}
      <Button onClick={handlePreview} variant="secondary" className="gap-1.5">
        <Eye className="w-4 h-4" /> Предпросмотр шаблона
      </Button>
    </div>
  );
}
