import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useOrders, ORDER_STATUSES, ORDER_TYPES, DELIVERY_METHODS, type Order } from "@/hooks/useOrders";
import type { Client } from "@/hooks/useClients";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order?: Order | null;
  clients: Client[];
  presetClientId?: string;
  presetLeadId?: string;
}

export default function OrderFormDialog({ open, onOpenChange, order, clients, presetClientId, presetLeadId }: Props) {
  const { createOrder, updateOrder } = useOrders();

  const [form, setForm] = useState({
    client_id: "",
    order_type: "serial_stock",
    status: "draft",
    total_amount: "",
    paid_amount: "",
    discount_percent: "",
    delivery_address: "",
    delivery_method: "self_pickup",
    notes: "",
    warranty_months: "24",
  });

  useEffect(() => {
    if (order) {
      setForm({
        client_id: order.client_id || "",
        order_type: order.order_type,
        status: order.status,
        total_amount: order.total_amount?.toString() || "",
        paid_amount: order.paid_amount?.toString() || "",
        discount_percent: order.discount_percent?.toString() || "",
        delivery_address: order.delivery_address || "",
        delivery_method: order.delivery_method || "self_pickup",
        notes: order.notes || "",
        warranty_months: order.warranty_months?.toString() || "24",
      });
    } else {
      setForm({
        client_id: presetClientId || "",
        order_type: "serial_stock",
        status: "draft",
        total_amount: "",
        paid_amount: "",
        discount_percent: "",
        delivery_address: "",
        delivery_method: "self_pickup",
        notes: "",
        warranty_months: "24",
      });
    }
  }, [order, open, presetClientId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: any = {
      client_id: form.client_id || null,
      lead_id: presetLeadId || (order as any)?.lead_id || null,
      order_type: form.order_type,
      status: form.status,
      total_amount: parseFloat(form.total_amount) || 0,
      paid_amount: parseFloat(form.paid_amount) || 0,
      discount_percent: parseFloat(form.discount_percent) || 0,
      delivery_address: form.delivery_address || null,
      delivery_method: form.delivery_method,
      notes: form.notes || null,
      warranty_months: parseInt(form.warranty_months) || 24,
    };

    if (order) {
      updateOrder.mutate({ id: order.id, ...payload }, { onSuccess: () => onOpenChange(false) });
    } else {
      createOrder.mutate(payload, { onSuccess: () => onOpenChange(false) });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{order ? `Заказ ${order.number}` : "Новый заказ"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Клиент</Label>
              <Select value={form.client_id} onValueChange={(v) => setForm({ ...form, client_id: v })}>
                <SelectTrigger><SelectValue placeholder="Выберите клиента" /></SelectTrigger>
                <SelectContent>
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Тип заказа</Label>
              <Select value={form.order_type} onValueChange={(v) => setForm({ ...form, order_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ORDER_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {order && (
            <div>
              <Label className="text-xs">Статус</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ORDER_STATUSES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      <span className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                        {s.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label className="text-xs">Сумма (₽)</Label>
              <Input type="number" value={form.total_amount} onChange={(e) => setForm({ ...form, total_amount: e.target.value })} placeholder="0" />
            </div>
            <div>
              <Label className="text-xs">Оплачено (₽)</Label>
              <Input type="number" value={form.paid_amount} onChange={(e) => setForm({ ...form, paid_amount: e.target.value })} placeholder="0" />
            </div>
            <div>
              <Label className="text-xs">Скидка (%)</Label>
              <Input type="number" value={form.discount_percent} onChange={(e) => setForm({ ...form, discount_percent: e.target.value })} placeholder="0" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Способ доставки</Label>
              <Select value={form.delivery_method} onValueChange={(v) => setForm({ ...form, delivery_method: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DELIVERY_METHODS.map((d) => (
                    <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Гарантия (мес)</Label>
              <Input type="number" value={form.warranty_months} onChange={(e) => setForm({ ...form, warranty_months: e.target.value })} />
            </div>
          </div>

          <div>
            <Label className="text-xs">Адрес доставки</Label>
            <Input value={form.delivery_address} onChange={(e) => setForm({ ...form, delivery_address: e.target.value })} placeholder="г. Новосибирск, ул. ..." />
          </div>

          <div>
            <Label className="text-xs">Заметки</Label>
            <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Отмена</Button>
            <Button type="submit" disabled={createOrder.isPending || updateOrder.isPending}>
              {(createOrder.isPending || updateOrder.isPending) ? "Сохранение..." : order ? "Сохранить" : "Создать"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
