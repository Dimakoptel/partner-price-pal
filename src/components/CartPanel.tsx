import { useState } from "react";
import { useCart, CartItem } from "@/hooks/useCart";
import { useCalculations } from "@/hooks/useCalculations";
import { useLeads } from "@/hooks/useLeads";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice } from "@/components/ResultPanel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetFooter,
} from "@/components/ui/sheet";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { ShoppingCart, Trash2, FileText, Plus } from "lucide-react";
import { toast } from "sonner";

export default function CartPanel() {
  const { items, removeItem, toggleItem, toggleAll, selectedItems, selectedTotal, clearSelected, appendToLeadId, setAppendToLeadId } = useCart();
  const { saveCalculation } = useCalculations();
  const { createLead, updateLead, leads } = useLeads();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [calcName, setCalcName] = useState("");
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSaveKP = async () => {
    if (selectedItems.length === 0) return;
    if (!calcName.trim()) {
      toast.error("Укажите название КП");
      return;
    }

    setSaving(true);
    try {
      let leadId = appendToLeadId;

      if (!leadId) {
        // Create new lead
        const { data: lead, error: leadError } = await createLead({
          client_name: clientName.trim() || calcName.trim(),
          client_phone: clientPhone.trim() || undefined,
          client_email: clientEmail.trim() || undefined,
          amount: selectedTotal,
          notes: `КП: ${calcName.trim()} (${selectedItems.length} поз.)`,
        });
        if (leadError || !lead) throw leadError || new Error("Lead creation failed");
        leadId = lead.id;
      } else {
        // Update existing lead amount
        const existingLead = leads.find(l => l.id === leadId);
        if (existingLead) {
          await updateLead(leadId, {
            amount: (existingLead.amount || 0) + selectedTotal,
            notes: existingLead.notes
              ? `${existingLead.notes}\nДоп: ${calcName.trim()} (${selectedItems.length} поз.)`
              : `КП: ${calcName.trim()} (${selectedItems.length} поз.)`,
          });
        }
      }

      // Save each selected item to history + link to lead
      for (const item of selectedItems) {
        const { error } = await saveCalculation(
          item.productType,
          item.productLabel,
          item.params,
          item.result,
          `${calcName.trim()} — ${item.productLabel}`,
        );
        if (error) {
          console.error("Error saving calc:", error);
          continue;
        }
      }

      // Link saved calculations to lead via lead_id
      // Get the latest saved calculations for this user
      const { data: recentCalcs } = await supabase
        .from("saved_calculations")
        .select("id")
        .eq("user_id", user!.id)
        .is("lead_id" as any, null)
        .order("created_at", { ascending: false })
        .limit(selectedItems.length) as any;

      if (recentCalcs && leadId) {
        const ids = recentCalcs.map((c: any) => c.id);
        await (supabase.from("saved_calculations") as any)
          .update({ lead_id: leadId })
          .in("id", ids);
      }

      toast.success(appendToLeadId
        ? `${selectedItems.length} поз. добавлено к лиду`
        : `КП сохранено, лид создан (${selectedItems.length} поз.)`
      );

      clearSelected();
      setSaveDialogOpen(false);
      setCalcName("");
      setClientName("");
      setClientPhone("");
      setClientEmail("");
      setAppendToLeadId(null);
    } catch (e: any) {
      toast.error("Ошибка: " + (e?.message || "неизвестная ошибка"));
    } finally {
      setSaving(false);
    }
  };

  // Also save all items to history (not just selected) — every calc goes to history
  const handleSaveAllToHistory = async () => {
    const unsavedItems = items.filter(i => !i.selected);
    for (const item of unsavedItems) {
      await saveCalculation(
        item.productType,
        item.productLabel,
        item.params,
        item.result,
        item.productLabel,
      );
    }
  };

  const allSelected = items.length > 0 && items.every(i => i.selected);

  return (
    <>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2 relative">
            <ShoppingCart className="w-4 h-4" />
            Корзина
            {items.length > 0 && (
              <Badge variant="default" className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-[10px]">
                {items.length}
              </Badge>
            )}
          </Button>
        </SheetTrigger>
        <SheetContent className="w-full sm:max-w-lg flex flex-col">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5" />
              Корзина расчётов ({items.length})
            </SheetTitle>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto py-4 space-y-3">
            {items.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Корзина пуста. Рассчитайте изделие и нажмите «В корзину».
              </p>
            ) : (
              <>
                <div className="flex items-center justify-between mb-2">
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <Switch checked={allSelected} onCheckedChange={toggleAll} />
                    <span>Выбрать все</span>
                  </label>
                </div>

                {items.map(item => (
                  <CartItemRow key={item.id} item={item} onToggle={toggleItem} onRemove={removeItem} />
                ))}
              </>
            )}
          </div>

          {items.length > 0 && (
            <SheetFooter className="border-t pt-4 flex-col gap-2">
              <div className="flex justify-between text-sm w-full">
                <span className="text-muted-foreground">
                  Выбрано: {selectedItems.length} из {items.length}
                </span>
                <span className="font-bold text-primary">
                  {formatPrice(selectedTotal)} ₽
                </span>
              </div>

              {/* Append to existing lead */}
              {leads.filter(l => l.status !== "won" && l.status !== "lost").length > 0 && (
                <div className="w-full">
                  <Label className="text-xs text-muted-foreground">Добавить к существующему лиду:</Label>
                  <select
                    className="w-full mt-1 rounded-md border border-input bg-background px-3 py-1.5 text-sm"
                    value={appendToLeadId || ""}
                    onChange={e => setAppendToLeadId(e.target.value || null)}
                  >
                    <option value="">Новый лид</option>
                    {leads
                      .filter(l => l.status !== "won" && l.status !== "lost")
                      .slice(0, 20)
                      .map(l => (
                        <option key={l.id} value={l.id}>
                          {l.client_name} — {formatPrice(l.amount)} ₽
                        </option>
                      ))}
                  </select>
                </div>
              )}

              <Button
                className="w-full gap-2"
                onClick={() => setSaveDialogOpen(true)}
                disabled={selectedItems.length === 0}
              >
                <FileText className="w-4 h-4" />
                {appendToLeadId ? "Добавить к лиду" : "Сохранить КП и создать лид"}
              </Button>
            </SheetFooter>
          )}
        </SheetContent>
      </Sheet>

      {/* Save dialog */}
      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {appendToLeadId ? "Добавить позиции к лиду" : "Сохранить КП и создать лид"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label>Название КП <span className="text-destructive">*</span></Label>
              <Input
                placeholder="Например: Ванная комната — Иванов"
                value={calcName}
                onChange={e => setCalcName(e.target.value)}
                autoFocus
              />
            </div>
            {!appendToLeadId && (
              <>
                <div className="space-y-1.5">
                  <Label>Имя клиента</Label>
                  <Input
                    placeholder="Иванов Иван Иванович"
                    value={clientName}
                    onChange={e => setClientName(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Телефон</Label>
                    <Input placeholder="+7 900 000 00 00" value={clientPhone} onChange={e => setClientPhone(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Email</Label>
                    <Input placeholder="client@email.com" value={clientEmail} onChange={e => setClientEmail(e.target.value)} />
                  </div>
                </div>
              </>
            )}
            <div className="text-xs text-muted-foreground space-y-1">
              <p>Позиций в КП: {selectedItems.length}</p>
              <p>Итого: {formatPrice(selectedTotal)} ₽</p>
              {selectedItems.map(i => (
                <p key={i.id} className="pl-2">• {i.productLabel} — {formatPrice(i.result.grandTotal || i.result.totalPrice)} ₽</p>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>Отмена</Button>
            <Button onClick={handleSaveKP} disabled={!calcName.trim() || saving}>
              {saving ? "Сохранение..." : appendToLeadId ? "Добавить" : "Сохранить"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function CartItemRow({ item, onToggle, onRemove }: { item: CartItem; onToggle: (id: string) => void; onRemove: (id: string) => void }) {
  return (
    <div className={`p-3 rounded-lg border transition-colors ${item.selected ? "bg-primary/5 border-primary/30" : "bg-secondary/30 border-border/50"}`}>
      <div className="flex items-start gap-3">
        <Switch checked={item.selected} onCheckedChange={() => onToggle(item.id)} className="mt-0.5" />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium truncate">{item.productLabel}</div>
          <div className="text-xs text-muted-foreground">
            {formatPrice(item.result.grandTotal || item.result.totalPrice)} ₽
            {item.result.quantity > 1 && ` × ${item.result.quantity} шт.`}
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={() => onRemove(item.id)} className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive">
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}
