import { motion } from "framer-motion";
import AppLayout from "@/components/AppLayout";
import { useNomenclature, NomenclatureItem } from "@/hooks/useNomenclature";
import { useAuth } from "@/hooks/useAuth";
import { usePermissions } from "@/hooks/usePermissions";
import { useCompanySettings } from "@/hooks/useCompanySettings";
import { useTheme } from "@/hooks/useTheme";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import ImageGalleryDialog from "@/components/ImageGalleryDialog";
import { toast } from "sonner";
import { useState } from "react";
import {
  Plus, Search, Image, FileText, Pencil, Trash2, Printer,
} from "lucide-react";
import DOMPurify from "dompurify";

type PriceColumn = "dealer" | "wholesale" | "partner" | "rrp";

const PRICE_COLUMNS: { key: PriceColumn; label: string; sublabel: string }[] = [
  { key: "dealer", label: "Дилер", sublabel: "от 1 млн. р." },
  { key: "wholesale", label: "Опт", sublabel: "от 500т.р." },
  { key: "partner", label: "Партнер", sublabel: "от 100т.р." },
  { key: "rrp", label: "РРЦ", sublabel: "" },
];

export default function PriceListPage() {
  const { priceListItems, loading, createItem, updateItem, deleteItem } = useNomenclature();
  const { isAdmin, profile } = useAuth();
  const { hasAccess } = usePermissions();
  const { getSetting } = useCompanySettings();
  const { theme } = useTheme();
  const canEdit = isAdmin || hasAccess("clients");
  // Managers (admin or clients access) see all prices, others see only RRP
  const canSeePrices = isAdmin || hasAccess("clients");

  const [search, setSearch] = useState("");
  const [editOpen, setEditOpen] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [detailItem, setDetailItem] = useState<any>(null);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [printOpen, setPrintOpen] = useState(false);
  const [printColumns, setPrintColumns] = useState<PriceColumn[]>(["rrp"]);
  const [showPhotos, setShowPhotos] = useState(false);

  const visiblePriceColumns = canSeePrices
    ? PRICE_COLUMNS
    : PRICE_COLUMNS.filter((c) => c.key === "rrp");

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

  const openGallery = (item: NomenclatureItem, index = 0) => {
    const photos = item.photo_urls?.filter(Boolean) || (item.photo_url ? [item.photo_url] : []);
    if (photos.length === 0) return;
    setGalleryImages(photos);
    setGalleryIndex(index);
    setGalleryOpen(true);
  };

  const handlePrint = () => {
    if (printColumns.length === 0) {
      toast.error("Выберите хотя бы один тип цены");
      return;
    }
    const logoUrl = DOMPurify.sanitize(getSetting("logo_print_url") || getSetting("print_logo_url") || "");
    const companyName = DOMPurify.sanitize(getSetting("print_company_name") || "COZY ART");

    const priceHeaders = printColumns.map((col) => {
      const info = PRICE_COLUMNS.find((c) => c.key === col);
      return `<th style="padding:8px;border:1px solid #ddd;text-align:right;font-size:12px;">${info?.label || col}${info?.sublabel ? `<br><span style="font-size:10px;color:#888;">${info.sublabel}</span>` : ""}</th>`;
    }).join("");

    const rows = filtered.map((item) => {
      const priceCells = printColumns.map((col) => {
        const val = col === "dealer" ? item.price_dealer : col === "wholesale" ? item.price_wholesale : col === "partner" ? item.price_partner : item.price_rrp;
        return `<td style="padding:6px 8px;border:1px solid #ddd;text-align:right;font-size:12px;">${formatPrice(val)}</td>`;
      }).join("");
      return `<tr>
        <td style="padding:6px 8px;border:1px solid #ddd;font-size:11px;font-family:monospace;color:#888;">${DOMPurify.sanitize(item.sku || "—")}</td>
        <td style="padding:6px 8px;border:1px solid #ddd;font-size:12px;">${DOMPurify.sanitize(item.name)}</td>
        <td style="padding:6px 8px;border:1px solid #ddd;font-size:11px;">${DOMPurify.sanitize(item.size_mm || "—")}</td>
        <td style="padding:6px 8px;border:1px solid #ddd;font-size:11px;">${item.unit}</td>
        ${priceCells}
      </tr>`;
    }).join("");

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Прайс-лист ${companyName}</title></head><body style="font-family:Arial,sans-serif;margin:20px;">
      <div style="display:flex;align-items:center;gap:16px;margin-bottom:20px;">
        ${logoUrl ? `<img src="${logoUrl}" style="height:40px;" />` : ""}
        <div>
          <h1 style="margin:0;font-size:20px;">${companyName}</h1>
          <p style="margin:2px 0 0;font-size:12px;color:#888;">Прайс-лист • ${new Date().toLocaleDateString("ru-RU")}</p>
        </div>
      </div>
      <table style="width:100%;border-collapse:collapse;">
        <thead><tr style="background:#f5f5f5;">
          <th style="padding:8px;border:1px solid #ddd;text-align:left;font-size:12px;">Артикул</th>
          <th style="padding:8px;border:1px solid #ddd;text-align:left;font-size:12px;">Наименование</th>
          <th style="padding:8px;border:1px solid #ddd;text-align:left;font-size:12px;">Размер</th>
          <th style="padding:8px;border:1px solid #ddd;text-align:left;font-size:12px;">Ед.</th>
          ${priceHeaders}
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>
      <p style="margin-top:16px;font-size:11px;color:#888;">Цены указаны в российских рублях. Актуальность на ${new Date().toLocaleDateString("ru-RU")}.</p>
    </body></html>`;

    const w = window.open("", "_blank");
    if (w) {
      w.document.write(html);
      w.document.close();
      w.print();
    }
    setPrintOpen(false);
  };

  const togglePrintColumn = (col: PriceColumn) => {
    setPrintColumns((prev) =>
      prev.includes(col) ? prev.filter((c) => c !== col) : [...prev, col]
    );
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
            <div className="flex gap-2">
              {canSeePrices && (
                <Button variant="outline" onClick={() => setPrintOpen(true)} className="gap-2">
                  <Printer className="w-4 h-4" /> Печать
                </Button>
              )}
              {canEdit && (
                <Button
                  onClick={() => { setEditItem(null); setEditOpen(true); }}
                  className="gap-2"
                >
                  <Plus className="w-4 h-4" /> Добавить
                </Button>
              )}
            </div>
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
                  {visiblePriceColumns.map((col) => (
                    <TableHead key={col.key} className="text-xs font-semibold w-28 text-right">
                      {col.label}{col.sublabel && <><br /><span className="text-[10px] text-muted-foreground font-normal">{col.sublabel}</span></>}
                    </TableHead>
                  ))}
                  <TableHead className="text-xs font-semibold w-16 text-center">Фото</TableHead>
                  <TableHead className="text-xs font-semibold w-16 text-center">Доки</TableHead>
                  {canEdit && <TableHead className="text-xs font-semibold w-20"></TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={visiblePriceColumns.length + 7 + (canEdit ? 1 : 0)} className="text-center py-12 text-muted-foreground">
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
                      {visiblePriceColumns.map((col) => {
                        const val = col.key === "dealer" ? item.price_dealer : col.key === "wholesale" ? item.price_wholesale : col.key === "partner" ? item.price_partner : item.price_rrp;
                        return (
                          <TableCell key={col.key} className={`text-xs text-right font-medium ${col.key === "rrp" ? "text-primary" : ""}`}>
                            {formatPrice(val)}
                          </TableCell>
                        );
                      })}
                      <TableCell className="text-center">
                        {(item.photo_urls?.filter(Boolean).length > 0 || item.photo_url) ? (
                          <button
                            onClick={(e) => { e.stopPropagation(); openGallery(item); }}
                            className="inline-flex items-center gap-1"
                          >
                            <Image className="w-4 h-4 text-primary mx-auto" />
                            {item.photo_urls?.filter(Boolean).length > 1 && (
                              <span className="text-[10px] text-muted-foreground">{item.photo_urls.filter(Boolean).length}</span>
                            )}
                          </button>
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
              {(detailItem.photo_urls?.filter(Boolean).length > 0 || detailItem.photo_url) && (
                <div
                  className="cursor-pointer"
                  onClick={() => openGallery(detailItem)}
                >
                  <img
                    src={detailItem.photo_urls?.filter(Boolean)[0] || detailItem.photo_url}
                    alt={detailItem.name}
                    className="w-full h-48 object-cover rounded border border-border"
                  />
                  {detailItem.photo_urls?.filter(Boolean).length > 1 && (
                    <div className="flex gap-1 mt-2">
                      {detailItem.photo_urls.filter(Boolean).slice(1, 5).map((url: string, i: number) => (
                        <img
                          key={i}
                          src={url}
                          alt=""
                          className="w-12 h-12 object-cover rounded border border-border cursor-pointer hover:opacity-80"
                          onClick={(e) => { e.stopPropagation(); openGallery(detailItem, i + 1); }}
                        />
                      ))}
                    </div>
                  )}
                </div>
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
                {canSeePrices ? (
                  <>
                    <div>Дилер: <span className="font-medium">{formatPrice(detailItem.price_dealer)}</span></div>
                    <div>Опт: <span className="font-medium">{formatPrice(detailItem.price_wholesale)}</span></div>
                    <div>Партнер: <span className="font-medium">{formatPrice(detailItem.price_partner)}</span></div>
                    <div>РРЦ: <span className="font-medium text-primary">{formatPrice(detailItem.price_rrp)}</span></div>
                  </>
                ) : (
                  <div className="col-span-2">РРЦ: <span className="font-medium text-primary">{formatPrice(detailItem.price_rrp)}</span></div>
                )}
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

      {/* Photo Gallery */}
      <ImageGalleryDialog
        images={galleryImages}
        initialIndex={galleryIndex}
        open={galleryOpen}
        onClose={() => setGalleryOpen(false)}
      />

      {/* Print Dialog */}
      <Dialog open={printOpen} onOpenChange={setPrintOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Печать прайс-листа</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Выберите столбцы цен для печати:</p>
            {PRICE_COLUMNS.map((col) => (
              <label key={col.key} className="flex items-center gap-3 cursor-pointer">
                <Checkbox
                  checked={printColumns.includes(col.key)}
                  onCheckedChange={() => togglePrintColumn(col.key)}
                />
                <span className="text-sm">{col.label} {col.sublabel && <span className="text-muted-foreground text-xs">({col.sublabel})</span>}</span>
              </label>
            ))}
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setPrintOpen(false)}>Отмена</Button>
            <Button onClick={handlePrint} className="gap-2">
              <Printer className="w-4 h-4" /> Печатать
            </Button>
          </div>
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
  const existingPhotos: string[] = item?.photo_urls?.filter(Boolean) || (item?.photo_url ? [item.photo_url] : []);
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
    photo_urls: existingPhotos,
    drawing_url: item?.drawing_url || "",
    description: item?.description || "",
  });
  const [saving, setSaving] = useState(false);

  const set = (key: string, value: any) => setForm((p) => ({ ...p, [key]: value }));

  const updatePhotoUrl = (index: number, value: string) => {
    const newUrls = [...form.photo_urls];
    newUrls[index] = value;
    set("photo_urls", newUrls);
  };

  const addPhotoSlot = () => {
    if (form.photo_urls.length < 5) {
      set("photo_urls", [...form.photo_urls, ""]);
    }
  };

  const removePhoto = (index: number) => {
    set("photo_urls", form.photo_urls.filter((_: string, i: number) => i !== index));
  };

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
            <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Фото (до 5)</p>
          </div>
          {form.photo_urls.map((url: string, i: number) => (
            <div key={i} className="col-span-2 flex gap-2 items-center">
              <Input
                value={url}
                onChange={(e) => updatePhotoUrl(i, e.target.value)}
                placeholder={`Ссылка на фото ${i + 1}`}
                className="flex-1"
              />
              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive shrink-0" onClick={() => removePhoto(i)}>
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          ))}
          {form.photo_urls.length < 5 && (
            <div className="col-span-2">
              <Button variant="outline" size="sm" onClick={addPhotoSlot} className="gap-1">
                <Plus className="w-3.5 h-3.5" /> Добавить фото
              </Button>
            </div>
          )}

          <div className="col-span-2 border-t border-border pt-3">
            <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Документы</p>
          </div>
          <div className="col-span-2 space-y-1">
            <Label className="text-xs">Чертёж / Эскиз (URL)</Label>
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
