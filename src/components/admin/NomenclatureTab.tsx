import { useState, useEffect } from "react";
import { useNomenclature, NomenclatureItem } from "@/hooks/useNomenclature";
import { useProductCategories } from "@/hooks/useProductCategories";
import { useColors } from "@/hooks/useColors";
import { fetchNomenclatureColors, saveNomenclatureColors } from "@/hooks/useNomenclatureColors";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Plus, Search, Pencil, Trash2, Upload, Image, FileText, X } from "lucide-react";

export default function NomenclatureTab() {
  const { items, loading, createItem, updateItem, deleteItem, refetch } = useNomenclature();
  const { activeCategories } = useProductCategories();
  const [search, setSearch] = useState("");
  const [editOpen, setEditOpen] = useState(false);
  const [editItem, setEditItem] = useState<NomenclatureItem | null>(null);

  const filtered = items.filter(i =>
    i.name.toLowerCase().includes(search.toLowerCase()) ||
    i.sku.toLowerCase().includes(search.toLowerCase()) ||
    i.category.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Удалить "${name}"?`)) return;
    const { error } = await deleteItem(id);
    if (error) toast.error("Ошибка удаления");
    else toast.success("Удалено");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Поиск..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Button onClick={() => { setEditItem(null); setEditOpen(true); }} className="gap-2">
          <Plus className="w-4 h-4" /> Добавить товар
        </Button>
      </div>

      <div className="border border-border bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="text-xs w-20">Артикул</TableHead>
              <TableHead className="text-xs">Наименование</TableHead>
              <TableHead className="text-xs w-28">Категория</TableHead>
              <TableHead className="text-xs w-24">Размер</TableHead>
              <TableHead className="text-xs w-20 text-center">Фото</TableHead>
              <TableHead className="text-xs w-20 text-center">Чертёж</TableHead>
              <TableHead className="text-xs w-20 text-center">Прайс</TableHead>
              <TableHead className="text-xs w-20 text-center">Активен</TableHead>
              <TableHead className="text-xs w-24"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">Загрузка...</TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                {search ? "Ничего не найдено" : "Номенклатура пуста. Добавьте первый товар."}
              </TableCell></TableRow>
            ) : filtered.map(item => (
              <TableRow key={item.id} className="hover:bg-muted/30">
                <TableCell className="text-xs font-mono text-muted-foreground">{item.sku || "—"}</TableCell>
                <TableCell className="text-sm font-medium">{item.name}</TableCell>
                <TableCell><Badge variant="outline" className="text-xs">{item.category || "—"}</Badge></TableCell>
                <TableCell className="text-xs">{item.size_mm || "—"}</TableCell>
                <TableCell className="text-center">
                  {item.photo_url ? <Image className="w-4 h-4 text-primary mx-auto" /> : <span className="text-muted-foreground text-xs">—</span>}
                </TableCell>
                <TableCell className="text-center">
                  {item.drawing_url ? <FileText className="w-4 h-4 text-primary mx-auto" /> : <span className="text-muted-foreground text-xs">—</span>}
                </TableCell>
                <TableCell className="text-center">
                  {item.show_in_pricelist ? <Badge className="text-[10px]">Да</Badge> : <span className="text-muted-foreground text-xs">Нет</span>}
                </TableCell>
                <TableCell className="text-center">
                  {item.is_active ? <Badge variant="outline" className="text-[10px] border-green-500 text-green-600">Да</Badge> : <Badge variant="outline" className="text-[10px] border-destructive text-destructive">Нет</Badge>}
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditItem(item); setEditOpen(true); }}>
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(item.id, item.name)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {editOpen && (
        <NomenclatureFormDialog
          item={editItem}
          categories={activeCategories}
          onClose={() => setEditOpen(false)}
          onSave={async (data, colorIds) => {
            let result;
            if (editItem?.id) {
              result = await updateItem(editItem.id, data);
              if (!result.error) await saveNomenclatureColors(editItem.id, colorIds);
            } else {
              result = await createItem(data);
              if (!result.error && result.data) {
                await saveNomenclatureColors((result.data as any).id, colorIds);
              }
            }
            if (result.error) toast.error("Ошибка сохранения");
            else { toast.success(editItem ? "Обновлено" : "Товар добавлен"); setEditOpen(false); }
          }}
        />
      )}
    </div>
  );
}

function NomenclatureFormDialog({
  item,
  categories,
  onClose,
  onSave,
}: {
  item: NomenclatureItem | null;
  categories: { id: string; name: string }[];
  onClose: () => void;
  onSave: (data: Partial<NomenclatureItem>, colorIds: string[]) => void;
}) {
  const { colors } = useColors();
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [uploading, setUploading] = useState<"photo" | "drawing" | null>(null);

  const [form, setForm] = useState({
    sku: item?.sku || "",
    name: item?.name || "",
    category: item?.category || "",
    size_mm: item?.size_mm || "",
    weight_kg: item?.weight_kg || 0,
    characteristics: item?.characteristics || "",
    unit: item?.unit || "шт",
    price_dealer: item?.price_dealer || 0,
    price_wholesale: item?.price_wholesale || 0,
    price_partner: item?.price_partner || 0,
    price_rrp: item?.price_rrp || 0,
    photo_url: item?.photo_url || "",
    drawing_url: item?.drawing_url || "",
    description: item?.description || "",
    show_in_pricelist: item?.show_in_pricelist ?? false,
    is_active: item?.is_active ?? true,
    sort_order: item?.sort_order ?? 0,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (item?.id) {
      fetchNomenclatureColors(item.id).then(setSelectedColors);
    }
  }, [item?.id]);

  const set = (key: string, value: any) => setForm(p => ({ ...p, [key]: value }));

  const handleFileUpload = async (file: File, type: "photo" | "drawing") => {
    setUploading(type);
    const ext = file.name.split(".").pop();
    const path = `nomenclature/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from("company-assets").upload(path, file);
    if (error) {
      toast.error("Ошибка загрузки файла");
      setUploading(null);
      return;
    }
    const { data: urlData } = supabase.storage.from("company-assets").getPublicUrl(path);
    set(type === "photo" ? "photo_url" : "drawing_url", urlData.publicUrl);
    setUploading(null);
    toast.success("Файл загружен");
  };

  const toggleColor = (colorId: string) => {
    setSelectedColors(prev =>
      prev.includes(colorId) ? prev.filter(c => c !== colorId) : [...prev, colorId]
    );
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) { toast.error("Укажите наименование"); return; }
    setSaving(true);
    await onSave(form, selectedColors);
    setSaving(false);
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{item ? "Редактировать товар" : "Новый товар"}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4">
          {/* Basic info */}
          <div className="space-y-1">
            <Label className="text-xs">Артикул (SKU)</Label>
            <Input value={form.sku} onChange={e => set("sku", e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Категория</Label>
            {categories.length > 0 ? (
              <Select value={form.category} onValueChange={v => set("category", v)}>
                <SelectTrigger><SelectValue placeholder="Выберите категорию" /></SelectTrigger>
                <SelectContent>
                  {categories.map(c => (
                    <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input value={form.category} onChange={e => set("category", e.target.value)} placeholder="Введите категорию" />
            )}
          </div>
          <div className="col-span-2 space-y-1">
            <Label className="text-xs">Наименование *</Label>
            <Input value={form.name} onChange={e => set("name", e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Размер, мм</Label>
            <Input value={form.size_mm} onChange={e => set("size_mm", e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Вес, кг</Label>
            <Input type="number" value={form.weight_kg} onChange={e => set("weight_kg", +e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Ед. изм.</Label>
            <Input value={form.unit} onChange={e => set("unit", e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Порядок сортировки</Label>
            <Input type="number" value={form.sort_order} onChange={e => set("sort_order", +e.target.value)} />
          </div>
          <div className="col-span-2 space-y-1">
            <Label className="text-xs">Характеристики</Label>
            <Input value={form.characteristics} onChange={e => set("characteristics", e.target.value)} />
          </div>

          {/* Prices */}
          <div className="col-span-2 border-t border-border pt-3">
            <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Цены</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Дилер (от 1 млн. р.)</Label>
            <Input type="number" value={form.price_dealer} onChange={e => set("price_dealer", +e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Опт (от 500т.р.)</Label>
            <Input type="number" value={form.price_wholesale} onChange={e => set("price_wholesale", +e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Партнер (от 100т.р.)</Label>
            <Input type="number" value={form.price_partner} onChange={e => set("price_partner", +e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">РРЦ</Label>
            <Input type="number" value={form.price_rrp} onChange={e => set("price_rrp", +e.target.value)} />
          </div>

          {/* Media uploads */}
          <div className="col-span-2 border-t border-border pt-3">
            <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Фото и чертежи</p>
          </div>

          {/* Photo */}
          <div className="space-y-2">
            <Label className="text-xs">Фото товара</Label>
            {form.photo_url ? (
              <div className="relative group">
                <img src={form.photo_url} alt="Фото" className="w-full h-32 object-cover rounded border border-border" />
                <Button
                  variant="destructive" size="icon"
                  className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => set("photo_url", "")}
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-border rounded cursor-pointer hover:border-primary/50 transition-colors">
                <Upload className="w-6 h-6 text-muted-foreground mb-1" />
                <span className="text-xs text-muted-foreground">
                  {uploading === "photo" ? "Загрузка..." : "Загрузить фото"}
                </span>
                <input type="file" className="hidden" accept="image/*" disabled={!!uploading}
                  onChange={e => { if (e.target.files?.[0]) handleFileUpload(e.target.files[0], "photo"); }} />
              </label>
            )}
          </div>

          {/* Drawing */}
          <div className="space-y-2">
            <Label className="text-xs">Чертёж / Эскиз</Label>
            {form.drawing_url ? (
              <div className="relative group">
                <img src={form.drawing_url} alt="Чертёж" className="w-full h-32 object-cover rounded border border-border" />
                <Button
                  variant="destructive" size="icon"
                  className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => set("drawing_url", "")}
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-border rounded cursor-pointer hover:border-primary/50 transition-colors">
                <Upload className="w-6 h-6 text-muted-foreground mb-1" />
                <span className="text-xs text-muted-foreground">
                  {uploading === "drawing" ? "Загрузка..." : "Загрузить чертёж"}
                </span>
                <input type="file" className="hidden" accept="image/*,.pdf" disabled={!!uploading}
                  onChange={e => { if (e.target.files?.[0]) handleFileUpload(e.target.files[0], "drawing"); }} />
              </label>
            )}
          </div>

          {/* Colors */}
          <div className="col-span-2 border-t border-border pt-3">
            <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Доступные цвета</p>
            {colors.length === 0 ? (
              <p className="text-xs text-muted-foreground">Нет доступных цветов. Добавьте их в разделе «Цвета».</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {colors.map(color => (
                  <label
                    key={color.id}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 border rounded cursor-pointer text-xs transition-colors ${
                      selectedColors.includes(color.id)
                        ? "border-primary bg-primary/10 text-foreground"
                        : "border-border text-muted-foreground hover:border-foreground/30"
                    }`}
                  >
                    <Checkbox
                      checked={selectedColors.includes(color.id)}
                      onCheckedChange={() => toggleColor(color.id)}
                      className="h-3.5 w-3.5"
                    />
                    {color.image_url && (
                      <img src={color.image_url} alt="" className="w-4 h-4 rounded-full object-cover" />
                    )}
                    {color.name}
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Description */}
          <div className="col-span-2 border-t border-border pt-3 space-y-1">
            <Label className="text-xs">Описание</Label>
            <Textarea value={form.description} onChange={e => set("description", e.target.value)} rows={3} />
          </div>

          {/* Flags */}
          <div className="col-span-2 border-t border-border pt-3 flex gap-6">
            <div className="flex items-center gap-2">
              <Switch checked={form.show_in_pricelist} onCheckedChange={v => set("show_in_pricelist", v)} />
              <Label className="text-xs">Показывать в прайс-листе</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.is_active} onCheckedChange={v => set("is_active", v)} />
              <Label className="text-xs">Активен</Label>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={onClose}>Отмена</Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? "Сохранение..." : item ? "Сохранить" : "Добавить"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
