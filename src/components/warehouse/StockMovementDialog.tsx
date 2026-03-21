import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useProducts } from "@/hooks/useProducts";
import { useCreateStockMovement, MOVEMENT_TYPES } from "@/hooks/useInventory";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  presetVariantId?: string;
  presetType?: string;
}

export default function StockMovementDialog({ open, onOpenChange, presetVariantId, presetType }: Props) {
  const { data: productsData } = useProducts();
  const createMovement = useCreateStockMovement();

  const [selectedProductId, setSelectedProductId] = useState("");
  const [variantId, setVariantId] = useState(presetVariantId || "");
  const [movementType, setMovementType] = useState(presetType || "receipt");
  const [quantity, setQuantity] = useState(1);
  const [documentNumber, setDocumentNumber] = useState("");
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");

  const products = productsData?.products ?? [];
  const allVariants = productsData?.variants ?? [];
  const filteredVariants = allVariants.filter((v) => v.product_id === selectedProductId);

  const resetForm = () => {
    setSelectedProductId("");
    setVariantId("");
    setMovementType(presetType || "receipt");
    setQuantity(1);
    setDocumentNumber("");
    setReason("");
    setNotes("");
  };

  const handleSubmit = () => {
    if (!variantId || quantity < 1) return;
    createMovement.mutate(
      {
        product_variant_id: variantId,
        movement_type: movementType,
        quantity,
        document_number: documentNumber,
        reason,
        notes,
      },
      {
        onSuccess: () => {
          onOpenChange(false);
          resetForm();
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) resetForm(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Новое движение товара</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label className="text-xs">Тип операции</Label>
            <Select value={movementType} onValueChange={setMovementType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {MOVEMENT_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs">Товар</Label>
            <Select value={selectedProductId} onValueChange={(v) => { setSelectedProductId(v); setVariantId(""); }}>
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
              <Select value={variantId} onValueChange={setVariantId}>
                <SelectTrigger><SelectValue placeholder="Выберите вариант" /></SelectTrigger>
                <SelectContent>
                  {filteredVariants.map((v) => {
                    const parts = [v.color, v.size_cm, v.texture].filter(Boolean);
                    return (
                      <SelectItem key={v.id} value={v.id}>
                        {parts.length > 0 ? parts.join(" / ") : v.sku_variant}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Количество</Label>
              <Input type="number" min={1} value={quantity} onChange={(e) => setQuantity(parseInt(e.target.value) || 1)} />
            </div>
            <div>
              <Label className="text-xs">Номер документа</Label>
              <Input value={documentNumber} onChange={(e) => setDocumentNumber(e.target.value)} placeholder="Накладная №..." />
            </div>
          </div>

          <div>
            <Label className="text-xs">Основание</Label>
            <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Покупка, возврат, брак..." />
          </div>

          <div>
            <Label className="text-xs">Примечание</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => { onOpenChange(false); resetForm(); }}>Отмена</Button>
          <Button onClick={handleSubmit} disabled={!variantId || quantity < 1 || createMovement.isPending}>
            {createMovement.isPending ? "Сохранение..." : "Провести"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
