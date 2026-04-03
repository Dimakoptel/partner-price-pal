import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import AppLayout from "@/components/AppLayout";
import { usePartnerRequests } from "@/hooks/usePartnerRequests";
import { useProductCategories } from "@/hooks/useProductCategories";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { NumericInput } from "@/components/ui/numeric-input";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { ArrowLeft, Upload, X } from "lucide-react";
import { PRODUCTS } from "@/lib/calculator";

const PRODUCT_TYPE_FIELDS: Record<string, string[]> = {
  countertop: ["length", "width", "thickness", "color", "quantity", "isRound", "diameter"],
  sink: ["length", "width", "quantity", "bowlCount", "drainType", "color"],
  windowsill: ["length", "width", "thickness", "color", "quantity"],
  backsplash: ["width", "height", "thickness", "color", "quantity"],
  stair: ["length", "width", "thickness", "color", "quantity", "hasRiser"],
  stepslab: ["length", "width", "thickness", "color", "quantity"],
};

const DRAIN_TYPES = ["щелевой", "круглый", "трап", "без слива"];

export default function PartnerNewRequestPage() {
  const navigate = useNavigate();
  const { createRequest } = usePartnerRequests();
  const { activeCategories } = useProductCategories();
  const { colors } = useColors();
  const { partnerClientId } = useAuth();

  const [categoryId, setCategoryId] = useState("");
  const [productType, setProductType] = useState("");
  const [notes, setNotes] = useState("");
  const [uploading, setUploading] = useState(false);
  const [attachments, setAttachments] = useState<string[]>([]);
  const [params, setParams] = useState<Record<string, any>>({
    length: 1000,
    width: 600,
    thickness: 30,
    color: "",
    quantity: 1,
    isRound: false,
    diameter: 800,
    bowlCount: 1,
    drainType: "щелевой",
    height: 600,
    hasRiser: false,
  });

  const colorNames = colors.map(c => c.name);

  const updateParam = (key: string, value: any) => {
    setParams(prev => ({ ...prev, [key]: value }));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    if (attachments.length + files.length > 5) {
      toast.error("Максимум 5 файлов");
      return;
    }

    setUploading(true);
    const newUrls: string[] = [];
    for (const file of Array.from(files)) {
      const ext = file.name.split(".").pop();
      const path = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage
        .from("partner-attachments")
        .upload(path, file);
      if (!error) {
        const { data: urlData } = supabase.storage
          .from("partner-attachments")
          .getPublicUrl(path);
        newUrls.push(urlData.publicUrl);
      }
    }
    setAttachments(prev => [...prev, ...newUrls]);
    setUploading(false);
  };

  const removeAttachment = (idx: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async () => {
    if (!partnerClientId) {
      toast.error("Ваш аккаунт не привязан к карточке клиента. Обратитесь к менеджеру.");
      return;
    }
    if (!productType) {
      toast.error("Выберите тип изделия");
      return;
    }

    try {
      await createRequest.mutateAsync({
        category_id: categoryId || undefined,
        product_type: productType,
        params,
        notes: notes || undefined,
        attachment_urls: attachments,
      });
      toast.success("Запрос отправлен!");
      navigate("/partner/requests");
    } catch {
      toast.error("Ошибка при создании запроса");
    }
  };

  const fields = PRODUCT_TYPE_FIELDS[productType] || [];
  const availableProducts = PRODUCTS.filter(p => p.type !== "box");

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Button variant="ghost" size="sm" onClick={() => navigate("/partner/requests")} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" /> Назад к запросам
          </Button>

          <h1 className="text-2xl font-bold mb-6">Новый запрос на расчёт</h1>

          <div className="space-y-6">
            {/* Category */}
            <div>
              <Label>Категория товара</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger>
                  <SelectValue placeholder="Выберите категорию" />
                </SelectTrigger>
                <SelectContent>
                  {activeCategories.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Product Type */}
            <div>
              <Label>Тип изделия</Label>
              <Select value={productType} onValueChange={setProductType}>
                <SelectTrigger>
                  <SelectValue placeholder="Выберите тип" />
                </SelectTrigger>
                <SelectContent>
                  {availableProducts.map(p => (
                    <SelectItem key={p.type} value={p.type}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Dynamic Fields */}
            {productType && (
              <div className="border border-border p-4 space-y-4">
                <h3 className="text-sm font-medium">Параметры изделия</h3>

                {fields.includes("isRound") && (
                  <div className="flex items-center gap-3">
                    <Switch checked={params.isRound} onCheckedChange={v => updateParam("isRound", v)} />
                    <Label>Круглая форма</Label>
                  </div>
                )}

                {fields.includes("diameter") && params.isRound && (
                  <div>
                    <Label>Диаметр (мм)</Label>
                    <NumericInput value={params.diameter} onValueChange={v => updateParam("diameter", v)} min={300} max={3000} />
                  </div>
                )}

                {fields.includes("length") && !params.isRound && (
                  <div>
                    <Label>Длина (мм)</Label>
                    <NumericInput value={params.length} onValueChange={v => updateParam("length", v)} min={100} max={6000} />
                  </div>
                )}

                {fields.includes("width") && !params.isRound && (
                  <div>
                    <Label>Ширина (мм)</Label>
                    <NumericInput value={params.width} onValueChange={v => updateParam("width", v)} min={100} max={2000} />
                  </div>
                )}

                {fields.includes("height") && (
                  <div>
                    <Label>Высота (мм)</Label>
                    <NumericInput value={params.height} onValueChange={v => updateParam("height", v)} min={100} max={2000} />
                  </div>
                )}

                {fields.includes("thickness") && (
                  <div>
                    <Label>Толщина (мм)</Label>
                    <NumericInput value={params.thickness} onValueChange={v => updateParam("thickness", v)} min={10} max={60} />
                  </div>
                )}

                {fields.includes("quantity") && (
                  <div>
                    <Label>Количество</Label>
                    <NumericInput value={params.quantity} onValueChange={v => updateParam("quantity", v)} min={1} max={100} />
                  </div>
                )}

                {fields.includes("bowlCount") && (
                  <div>
                    <Label>Количество чаш</Label>
                    <NumericInput value={params.bowlCount} onValueChange={v => updateParam("bowlCount", v)} min={0} max={5} />
                  </div>
                )}

                {fields.includes("drainType") && (
                  <div>
                    <Label>Тип слива</Label>
                    <Select value={params.drainType} onValueChange={v => updateParam("drainType", v)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {DRAIN_TYPES.map(d => (
                          <SelectItem key={d} value={d}>{d}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {fields.includes("hasRiser") && (
                  <div className="flex items-center gap-3">
                    <Switch checked={params.hasRiser} onCheckedChange={v => updateParam("hasRiser", v)} />
                    <Label>С подступенком</Label>
                  </div>
                )}

                {fields.includes("color") && (
                  <div>
                    <Label>Цвет</Label>
                    <Select value={params.color} onValueChange={v => updateParam("color", v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите цвет" />
                      </SelectTrigger>
                      <SelectContent>
                        {colorNames.map(c => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            )}

            {/* Notes */}
            <div>
              <Label>Комментарий / описание</Label>
              <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Дополнительные пожелания, особенности..." />
            </div>

            {/* Attachments */}
            <div>
              <Label>Чертежи / Фото (до 5 файлов)</Label>
              <div className="mt-2 flex flex-wrap gap-2">
                {attachments.map((url, i) => (
                  <div key={i} className="relative group">
                    <img src={url} alt="attachment" className="w-20 h-20 object-cover border border-border" />
                    <button
                      onClick={() => removeAttachment(i)}
                      className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground w-5 h-5 rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                {attachments.length < 5 && (
                  <label className="w-20 h-20 border border-dashed border-border flex items-center justify-center cursor-pointer hover:border-primary/50 transition-colors">
                    <Upload className="w-5 h-5 text-muted-foreground" />
                    <input type="file" className="hidden" accept="image/*,.pdf,.dwg" multiple onChange={handleFileUpload} disabled={uploading} />
                  </label>
                )}
              </div>
              {uploading && <p className="text-xs text-muted-foreground mt-1">Загрузка...</p>}
            </div>

            <Button onClick={handleSubmit} disabled={createRequest.isPending || !productType} className="w-full">
              {createRequest.isPending ? "Отправка..." : "Отправить запрос"}
            </Button>
          </div>
        </motion.div>
      </div>
    </AppLayout>
  );
}
