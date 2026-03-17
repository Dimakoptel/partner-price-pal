import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2, AlertTriangle } from "lucide-react";
import { useProducts, type Product, type ProductVariant } from "@/hooks/useProducts";
import { useOrderItems, type OrderItem } from "@/hooks/useOrderItems";
import { useCheckAvailability } from "@/hooks/useReservations";

interface Props {
  orderId: string;
}

export default function OrderItemsEditor({ orderId }: Props) {
  const { data: productsData, isLoading: productsLoading } = useProducts();
  const { items, isLoading: itemsLoading, addItem, updateItem, deleteItem } = useOrderItems(orderId);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [selectedVariantId, setSelectedVariantId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [priceUnit, setPriceUnit] = useState(0);
  const { data: availability } = useCheckAvailability(selectedVariantId || undefined, quantity);

  const products = productsData?.products ?? [];
  const allVariants = productsData?.variants ?? [];

  const filteredVariants = allVariants.filter((v) => v.product_id === selectedProductId);

  const selectedVariant = allVariants.find((v) => v.id === selectedVariantId);

  const handleProductChange = (productId: string) => {
    setSelectedProductId(productId);
    setSelectedVariantId("");
    setPriceUnit(0);
  };

  const handleVariantChange = (variantId: string) => {
    setSelectedVariantId(variantId);
    const variant = allVariants.find((v) => v.id === variantId);
    if (variant) {
      setPriceUnit(variant.price_base);
    }
  };

  const handleAdd = () => {
    if (!selectedVariantId || quantity < 1) return;
    const variant = allVariants.find((v) => v.id === selectedVariantId);
    const product = products.find((p) => p.id === variant?.product_id);
    const warranty = variant?.warranty_months_override ?? product?.warranty_default_months ?? 12;

    addItem.mutate(
      {
        order_id: orderId,
        product_variant_id: selectedVariantId,
        quantity,
        price_unit: priceUnit,
        warranty_months: warranty,
      },
      {
        onSuccess: () => {
          setAddDialogOpen(false);
          resetAddForm();
        },
      }
    );
  };

  const resetAddForm = () => {
    setSelectedProductId("");
    setSelectedVariantId("");
    setQuantity(1);
    setPriceUnit(0);
  };

  const handleQuantityChange = (item: OrderItem, newQty: number) => {
    if (newQty < 1) return;
    updateItem.mutate({ id: item.id, order_id: orderId, quantity: newQty });
  };

  const handleDelete = (item: OrderItem) => {
    deleteItem.mutate({ id: item.id, order_id: orderId });
  };

  const getVariantLabel = (variantId: string | null) => {
    if (!variantId) return "—";
    const v = allVariants.find((x) => x.id === variantId);
    if (!v) return variantId.slice(0, 8);
    const parts = [v.color, v.size_cm, v.texture].filter(Boolean);
    return parts.length > 0 ? parts.join(" / ") : v.sku_variant;
  };

  const getProductName = (variantId: string | null) => {
    if (!variantId) return "—";
    const v = allVariants.find((x) => x.id === variantId);
    if (!v) return "";
    const p = products.find((x) => x.id === v.product_id);
    return p?.name ?? "";
  };

  const totalSum = items.reduce((sum, i) => sum + Number(i.total_line), 0);

  if (itemsLoading || productsLoading) return <div className="text-sm text-muted-foreground py-2">Загрузка...</div>;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">Позиции заказа</Label>
        <Button type="button" size="sm" variant="outline" onClick={() => setAddDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-1" /> Добавить
        </Button>
      </div>

      {items.length > 0 ? (
        <div className="border rounded-md overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Товар</TableHead>
                <TableHead className="text-xs">Вариант</TableHead>
                <TableHead className="text-xs w-20">Кол-во</TableHead>
                <TableHead className="text-xs w-24">Цена</TableHead>
                <TableHead className="text-xs w-24">Сумма</TableHead>
                <TableHead className="text-xs w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="text-xs">{getProductName(item.product_variant_id)}</TableCell>
                  <TableCell className="text-xs">{getVariantLabel(item.product_variant_id)}</TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min={1}
                      value={item.quantity}
                      onChange={(e) => handleQuantityChange(item, parseInt(e.target.value) || 1)}
                      className="h-7 text-xs w-16"
                    />
                  </TableCell>
                  <TableCell className="text-xs">{Number(item.price_unit).toLocaleString("ru-RU")} ₽</TableCell>
                  <TableCell className="text-xs font-medium">{Number(item.total_line).toLocaleString("ru-RU")} ₽</TableCell>
                  <TableCell>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7"
                      onClick={() => handleDelete(item)}
                    >
                      <Trash2 className="w-3.5 h-3.5 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="flex justify-end px-4 py-2 border-t bg-muted/30">
            <span className="text-sm font-semibold">Итого: {totalSum.toLocaleString("ru-RU")} ₽</span>
          </div>
        </div>
      ) : (
        <div className="text-sm text-muted-foreground text-center py-4 border rounded-md border-dashed">
          Нет позиций. Нажмите «Добавить» для выбора товара.
        </div>
      )}

      {/* Add item dialog */}
      <Dialog open={addDialogOpen} onOpenChange={(v) => { setAddDialogOpen(v); if (!v) resetAddForm(); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Добавить позицию</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Товар</Label>
              <Select value={selectedProductId} onValueChange={handleProductChange}>
                <SelectTrigger><SelectValue placeholder="Выберите товар" /></SelectTrigger>
                <SelectContent>
                  {products.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name} ({p.sku_base})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedProductId && (
              <div>
                <Label className="text-xs">Вариант</Label>
                <Select value={selectedVariantId} onValueChange={handleVariantChange}>
                  <SelectTrigger><SelectValue placeholder="Выберите вариант" /></SelectTrigger>
                  <SelectContent>
                    {filteredVariants.map((v) => {
                      const parts = [v.color, v.size_cm, v.texture].filter(Boolean);
                      const label = parts.length > 0 ? parts.join(" / ") : v.sku_variant;
                      return <SelectItem key={v.id} value={v.id}>{label} — {Number(v.price_base).toLocaleString("ru-RU")} ₽</SelectItem>;
                    })}
                  </SelectContent>
                </Select>
              </div>
            )}
            {selectedVariantId && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Количество</Label>
                  <Input type="number" min={1} value={quantity} onChange={(e) => setQuantity(parseInt(e.target.value) || 1)} />
                </div>
                <div>
                  <Label className="text-xs">Цена за ед. (₽)</Label>
                  <Input type="number" value={priceUnit} onChange={(e) => setPriceUnit(parseFloat(e.target.value) || 0)} />
                </div>
              </div>
            )}
            {selectedVariantId && quantity > 0 && priceUnit > 0 && (
              <div className="text-sm text-right font-medium">
                Сумма: {(quantity * priceUnit).toLocaleString("ru-RU")} ₽
              </div>
            )}
            {availability && !availability.available && (
              <Alert className="border-amber-200 bg-amber-50">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-xs text-amber-800">
                  Товар зарезервирован другими заказами (зарезервировано: {availability.reserved} шт.)
                </AlertDescription>
              </Alert>
            )}
            {availability && availability.reserved > 0 && availability.available && (
              <p className="text-xs text-muted-foreground">
                Зарезервировано другими: {availability.reserved} шт.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => { setAddDialogOpen(false); resetAddForm(); }}>Отмена</Button>
            <Button
              type="button"
              onClick={handleAdd}
              disabled={!selectedVariantId || quantity < 1 || priceUnit <= 0 || addItem.isPending}
            >
              {addItem.isPending ? "Добавление..." : "Добавить"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
