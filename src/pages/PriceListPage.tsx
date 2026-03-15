import { motion } from "framer-motion";
import AppLayout from "@/components/AppLayout";
import { useNomenclature } from "@/hooks/useNomenclature";
import { useAuth } from "@/hooks/useAuth";
import { usePermissions } from "@/hooks/usePermissions";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useState } from "react";
import {
  Plus, Search, Image, FileText, Pencil, Trash2, Eye,
} from "lucide-react";

export default function PriceListPage() {
  const { priceListItems, loading, createItem, updateItem, deleteItem, refetch } = useNomenclature();
  const { isAdmin } = useAuth();
  const { hasAccess } = usePermissions();
  const canEdit = isAdmin || hasAccess("clients");

  const [search, setSearch] = useState("");
  const [editOpen, setEditOpen] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [detailItem, setDetailItem] = useState<any>(null);

  const filtered = priceListItems.filter(
    (i) =>
      i.name.toLowerCase().includes(search.toLowerCase()) ||
      i.sku.toLowerCase().includes(search.toLowerCase()) ||
      i.category.toLowerCase().includes(search.toLowerCase())
  );

  const formatPrice = (v: number) =>
    v ? v.toLocaleString("ru-RU", { maximumFractionDigits: 0 }) + " ₽" : "—";

  const handleSave = async (formData: any) => {
    if (editItem?.id) {
      const { error } = await updateItem(editItem.id, formData);
      if (error) toast.error("Ошибка сохранения");
      else { toast.success("Обновлено"); setEditOpen(false); }
    } else {
      const { error } = await createItem({ ...formData, show_in_pricelist: true });
      if (error) toast.error("Ошибка создания");
      else { toast.success("Добавлено в прайс"); setEditOpen(false); }
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Удалить "${name}" из номенклатуры?`)) return;
    const { error } = await deleteItem(id);
    if (error) toast.error("Ошибка удаления");
    else toast.success("Удалено");
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-20">
          <div className="animate-pulse text-muted-foreground">Загрузка прайс-листа...</div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-light text-foreground tracking-tight">Прайс-лист</h1>
              <p className="text-muted-foreground text-sm mt-1">
                Каталог продукции — {filtered.length} позиций
              </p>
            </div>
            {canEdit && (
              <Button
                onClick={() => { setEditItem(null); setEditOpen(true); }}
                className="gap-2"
              >
                <Plus className="w-4 h-4" /> Добавить
              </Button>
            )}
          </div>

          {/* Search */}
          <div className="relative mb-4 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Поиск по артикулу, названию..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Table */}
          <div className="border border-border bg-card overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="text-xs font-semibold w-24">Артикул</TableHead>
                  <TableHead className="text-xs font-semibold">Наименование</TableHead>
                  <TableHead className="text-xs font-semibold w-28">Размер, мм</TableHead>
                  <TableHead className="text-xs font-semibold w-32">Вес / Хар-ки</TableHead>
                  <TableHead className="text-xs font-semibold w-16">Ед.</TableHead>
                  <TableHead className="text-xs font-semibold w-28 text-right">
                    Дилер<br /><span className="text-[10px] text-muted-foreground font-normal">от 1 млн. р.</span>
                  </TableHead>
                  <TableHead className="text-xs font-semibold w-28 text-right">
                    Опт<br /><span className="text-[10px] text-muted-foreground font-normal">от 500т.р.</span>
                  </TableHead>
                  <TableHead className="text-xs font-semibold w-28 text-right">
                    Партнер<br /><span className="text-[10px] text-muted-foreground font-normal">от 100т.р.</span>
                  </TableHead>
                  <TableHead className="text-xs font-semibold w-24 text-right">РРЦ</TableHead>
                  <TableHead className="text-xs font-semibold w-16 text-center">Фото</TableHead>
                  <TableHead className="text-xs font-semibold w-16 text-center">Доки</TableHead>
                  {canEdit && <TableHead className="text-xs font-semibold w-20"></TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={canEdit ? 12 : 11} className="text-center py-12 text-muted-foreground">
                      {search ? "Ничего не найдено" : "Прайс-лист пуст. Добавьте товары в номенклатуру и отметьте для публикации."}
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((item) => (
                    <TableRow
                      key={item.id}
                      className="hover:bg-muted/30 cursor-pointer"
                      onClick={() => setDetailItem(item)}
                    >
                      <TableCell className="text-xs font-mono text-muted-foreground">{item.sku || "—"}</TableCell>
                      <TableCell className="text-sm font-medium">{item.name}</TableCell>
                      <TableCell className="text-xs">{item.size_mm || "—"}</TableCell>
                      <TableCell className="text-xs">
                        {item.weight_kg ? `${item.weight_kg} кг` : ""}
                        {item.characteristics && (
                          <span className="text-muted-foreground block">{item.characteristics}</span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs">{item.unit}</TableCell>
                      <TableCell className="text-xs text-right font-medium">{formatPrice(item.price_dealer)}</TableCell>
                      <TableCell className="text-xs text-right font-medium">{formatPrice(item.price_wholesale)}</TableCell>
                      <TableCell className="text-xs text-right font-medium">{formatPrice(item.price_partner)}</TableCell>
                      <TableCell className="text-xs text-right font-medium text-primary">{formatPrice(item.price_rrp)}</TableCell>
                      <TableCell className="text-center">
                        {item.photo_url ? (
                          <Image className="w-4 h-4 text-primary mx-auto" />
                        ) : (
                          <span className="text-muted-foreground text-xs">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {item.drawing_url || item.description ? (
                          <FileText className="w-4 h-4 text-primary mx-auto" />
                        ) : (
                          <span className="text-muted-foreground text-xs">—</span>
                        )}
                      </TableCell>
                      {canEdit && (
                        <TableCell>
                          <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                            <Button
                              variant="ghost" size="icon" className="h-7 w-7"
                              onClick={() => { setEditItem(item); setEditOpen(true); }}
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="ghost" size="icon" className="h-7 w-7 text-destructive"
                              onClick={() => handleDelete(item.id, item.name)}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </motion.div>
      </div>

      {/* Detail Dialog */}
      <Dialog open={!!detailItem} onOpenChange={() => setDetailItem(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{detailItem?.name}</DialogTitle>
          </DialogHeader>
          {detailItem && (
            <div className="space-y-4">
              {detailItem.photo_url && (
                <img src={detailItem.photo_url} alt={detailItem.name} className="w-full h-48 object-cover rounded border border-border" />
              )}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-muted-foreground">Артикул:</span> {detailItem.sku || "—"}</div>
                <div><span className="text-muted-foreground">Ед.:</span> {detailItem.unit}</div>
                <div><span className="text-muted-foreground">Размер:</span> {detailItem.size_mm || "—"}</div>
                <div><span className="text-muted-foreground">Вес:</span> {detailItem.weight_kg ? `${detailItem.weight_kg} кг` : "—"}</div>
              </div>
              {detailItem.characteristics && (
                <div className="text-sm"><span className="text-muted-foreground">Характеристики:</span> {detailItem.characteristics}</div>
              )}
              <div className="grid grid-cols-2 gap-3 text-sm border-t border-border pt-3">
                <div>Дилер: <span className="font-medium">{formatPrice(detailItem.price_dealer)}</span></div>
                <div>Опт: <span className="font-medium">{formatPrice(detailItem.price_wholesale)}</span></div>
                <div>Партнер: <span className="font-medium">{formatPrice(detailItem.price_partner)}</span></div>
                <div>РРЦ: <span className="font-medium text-primary">{formatPrice(detailItem.price_rrp)}</span></div>
              </div>
              {detailItem.description && (
                <div className="text-sm border-t border-border pt-3">
                  <span className="text-muted-foreground block mb-1">Описание:</span>
                  {detailItem.description}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      {editOpen && (
        <NomenclatureFormDialog
          item={editItem}
          onClose={() => setEditOpen(false)}
          onSave={handleSave}
        />
      )}
    </AppLayout>
  );
}

function NomenclatureFormDialog({
  item,
  onClose,
  onSave,
}: {
  item: any;
  onClose: () => void;
  onSave: (data: any) => void;
}) {
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
  });
  const [saving, setSaving] = useState(false);

  const set = (key: string, value: any) => setForm((p) => ({ ...p, [key]: value }));

  const handleSubmit = async () => {
    if (!form.name.trim()) { toast.error("Укажите наименование"); return; }
    setSaving(true);
    await onSave(form);
    setSaving(false);
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{item ? "Редактировать позицию" : "Новая позиция в прайс"}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label className="text-xs">Артикул</Label>
            <Input value={form.sku} onChange={(e) => set("sku", e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Категория</Label>
            <Input value={form.category} onChange={(e) => set("category", e.target.value)} />
          </div>
          <div className="col-span-2 space-y-1">
            <Label className="text-xs">Наименование *</Label>
            <Input value={form.name} onChange={(e) => set("name", e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Размер, мм</Label>
            <Input value={form.size_mm} onChange={(e) => set("size_mm", e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Вес, кг</Label>
            <Input type="number" value={form.weight_kg} onChange={(e) => set("weight_kg", +e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Ед. изм.</Label>
            <Input value={form.unit} onChange={(e) => set("unit", e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Характеристики</Label>
            <Input value={form.characteristics} onChange={(e) => set("characteristics", e.target.value)} />
          </div>

          <div className="col-span-2 border-t border-border pt-3">
            <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Цены</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Дилер (от 1 млн. р.)</Label>
            <Input type="number" value={form.price_dealer} onChange={(e) => set("price_dealer", +e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Опт (от 500т.р.)</Label>
            <Input type="number" value={form.price_wholesale} onChange={(e) => set("price_wholesale", +e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Партнер (от 100т.р.)</Label>
            <Input type="number" value={form.price_partner} onChange={(e) => set("price_partner", +e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">РРЦ</Label>
            <Input type="number" value={form.price_rrp} onChange={(e) => set("price_rrp", +e.target.value)} />
          </div>

          <div className="col-span-2 border-t border-border pt-3">
            <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Медиа</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Ссылка на фото</Label>
            <Input value={form.photo_url} onChange={(e) => set("photo_url", e.target.value)} placeholder="https://..." />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Чертёж / Эскиз / Палитра (URL)</Label>
            <Input value={form.drawing_url} onChange={(e) => set("drawing_url", e.target.value)} placeholder="https://..." />
          </div>
          <div className="col-span-2 space-y-1">
            <Label className="text-xs">Описание</Label>
            <Textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={3} />
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
