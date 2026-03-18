import { useState } from "react";
import { useCart, CartItem } from "@/hooks/useCart";
import { useCalculations } from "@/hooks/useCalculations";
import { useLeads } from "@/hooks/useLeads";
import { useAuth } from "@/hooks/useAuth";
import { useCompanySettings } from "@/hooks/useCompanySettings";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice, buildShareText, buildPrintHtml, type CompanySettingsAccessor, type SpecialistInfo, type ColorForPrint } from "@/components/ResultPanel";
import { useColors } from "@/hooks/useColors";
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
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ShoppingCart, Trash2, FileText, Printer, Share2, MessageCircle, Mail, Copy } from "lucide-react";
import { toast } from "sonner";
import DOMPurify from "dompurify";

export default function CartPanel() {
  const { items, removeItem, toggleItem, toggleAll, selectedItems, selectedTotal, clearSelected, appendToLeadId, setAppendToLeadId } = useCart();
  const { saveCalculation } = useCalculations();
  const { createLead, updateLead, leads } = useLeads();
  const { user, profile } = useAuth();
  const { getSetting } = useCompanySettings();
  const { colors } = useColors();
  const [open, setOpen] = useState(false);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [calcName, setCalcName] = useState("");
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [saving, setSaving] = useState(false);

  const cs: CompanySettingsAccessor = { getSetting };
  const specialist: SpecialistInfo = {
    fullName: profile?.full_name || undefined,
    phone: profile?.phone || undefined,
    email: user?.email || undefined,
    telegram: profile?.telegram || undefined,
  };
  const colorsForPrint: ColorForPrint[] = colors.map(c => ({ name: c.name, image_url: c.image_url || undefined, show_in_print: c.show_in_print }));

  // Build multi-item share text
  const buildMultiShareText = () => {
    if (selectedItems.length === 0) return "";
    if (selectedItems.length === 1) return buildShareText(selectedItems[0].result, cs);
    let text = `🧾 Коммерческое предложение (${selectedItems.length} поз.)\n\n`;
    selectedItems.forEach((item, i) => {
      text += `${i + 1}. ${item.result.productLabel}\n`;
      text += `   Стоимость: ${formatPrice(item.result.grandTotal || item.result.totalPrice)} ₽\n`;
      if (item.result.quantity > 1) text += `   Кол-во: ${item.result.quantity} шт.\n`;
      text += `\n`;
    });
    text += `━━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `💰 ИТОГО: ${formatPrice(selectedTotal)} ₽\n\n`;
    text += `📌 УСЛОВИЯ\n`;
    const days = cs.getSetting("production_days") || "20";
    const warranty = cs.getSetting("warranty_years") || "1";
    text += `• Доставка и грузчики — отдельно\n`;
    text += `• Срок изготовления: от ${days} рабочих дней\n`;
    text += `• Гарантия: ${warranty} год\n`;
    const phone = cs.getSetting("phone_main");
    if (phone) text += `\n📞 ${phone}`;
    const site = cs.getSetting("website");
    if (site) text += `\n🌐 ${site}`;
    text += `\n\nCOZY ART — архитектурный бетон`;
    return text;
  };

  // Build multi-item print HTML
  const buildMultiPrintHtml = () => {
    if (selectedItems.length === 1) return buildPrintHtml(selectedItems[0].result, cs, specialist, colorsForPrint);
    // Multi-item: build combined document
    const phone = cs.getSetting("phone_main") || "";
    const phoneExtra = cs.getSetting("phone_extra") || "";
    const email = cs.getSetting("email") || "";
    const companyName = DOMPurify.sanitize(cs.getSetting("print_company_name") || "COZY ART");
    const subtitle = DOMPurify.sanitize(cs.getSetting("print_company_subtitle") || "архитектурный бетон");
    const logoUrl = DOMPurify.sanitize(cs.getSetting("print_logo_url") || "");
    const prodDays = DOMPurify.sanitize(cs.getSetting("production_days") || "20");
    const warranty = DOMPurify.sanitize(cs.getSetting("warranty_years") || "1");
    const site = cs.getSetting("website") || "";
    const address = cs.getSetting("address") || "";
    const workHours = cs.getSetting("work_hours") || "";
    const telegram = cs.getSetting("telegram") || "";
    const whatsapp = cs.getSetting("whatsapp") || "";

    const headerContactLines: string[] = [];
    if (phone) headerContactLines.push(phone);
    if (phoneExtra) headerContactLines.push(phoneExtra);
    if (email) headerContactLines.push(email);

    const itemRows = selectedItems.map((item, i) => {
      const r = item.result;
      let details = "";
      if (r.quantity > 1) details += `<span style="font-size:11px;color:#888;">${r.quantity} шт. × ${formatPrice(r.pricePerUnit)} ₽</span>`;
      if (r.weight > 0) details += `<span style="font-size:11px;color:#888;margin-left:8px;">~${r.weight} кг</span>`;
      return `<tr>
        <td style="padding:12px 0;border-bottom:1px solid #e5e5e5;width:30px;vertical-align:top;color:#888;font-size:13px;">${i + 1}.</td>
        <td style="padding:12px 0;border-bottom:1px solid #e5e5e5;">
          <div style="font-size:14px;color:#333;">${DOMPurify.sanitize(r.productLabel)}</div>
          ${details ? `<div style="margin-top:2px;">${details}</div>` : ""}
        </td>
        <td style="padding:12px 0;border-bottom:1px solid #e5e5e5;text-align:right;font-weight:600;white-space:nowrap;">${formatPrice(r.grandTotal || r.totalPrice)} ₽</td>
      </tr>`;
    }).join("");

    const footerLeftLines = [address, workHours].filter(Boolean).map(l => DOMPurify.sanitize(l));
    const footerRightLines = [site, telegram ? `Telegram: ${telegram}` : "", whatsapp ? `WhatsApp: ${whatsapp}` : ""].filter(Boolean).map(l => DOMPurify.sanitize(l));

    const showColors = (cs.getSetting("print_color_show") || "да").toLowerCase();
    const colorPhotoW = parseInt(cs.getSetting("print_color_photo_width") || "80") || 80;
    const colorPhotoH = parseInt(cs.getSetting("print_color_photo_height") || "80") || 80;
    const colorGap = parseInt(cs.getSetting("print_color_gap") || "12") || 12;
    const colorsWithImages = colorsForPrint.filter(c => c.image_url && c.show_in_print !== false);

    return `<!DOCTYPE html>
<html lang="ru"><head><meta charset="utf-8"><title>${companyName} — КП</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:'Inter',sans-serif;color:#1a1a1a;background:#fff;padding:0}
  .page{max-width:700px;margin:0 auto;padding:40px 32px}
  .header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:32px;padding-bottom:20px;border-bottom:3px solid #1a1a1a}
  .logo{font-size:28px;font-weight:700;letter-spacing:2px;color:#1a1a1a}
  .logo-sub{font-size:11px;color:#888;letter-spacing:3px;text-transform:uppercase;margin-top:2px}
  .logo-img{max-height:60px;max-width:200px;object-fit:contain;margin-bottom:4px}
  .header-contacts{text-align:right;font-size:12px;color:#555;line-height:1.8}
  .section-title{font-size:11px;text-transform:uppercase;letter-spacing:2px;color:#888;margin-bottom:12px;font-weight:600}
  .price-table{width:100%;border-collapse:collapse;margin-bottom:28px}
  .total-row td{border-top:2px solid #1a1a1a;padding-top:12px;font-size:16px;font-weight:700}
  .conditions{background:#fafafa;border:1px solid #eee;border-radius:6px;padding:16px 20px;margin-bottom:28px}
  .conditions li{font-size:12px;color:#555;margin-bottom:6px;list-style:none;padding-left:16px;position:relative}
  .conditions li::before{content:"—";position:absolute;left:0;color:#bbb}
  .footer{border-top:2px solid #1a1a1a;padding-top:16px;display:flex;justify-content:space-between;font-size:11px;color:#777}
  .footer-col{line-height:1.8}
  @media print{body{padding:0}.page{padding:20px}@page{margin:15mm}}
</style></head><body><div class="page">
  <div class="header">
    <div>
      ${logoUrl ? `<img src="${logoUrl}" class="logo-img" alt="Logo"><br>` : ""}
      <div class="logo">${companyName}</div>
      <div class="logo-sub">${subtitle}</div>
    </div>
    ${headerContactLines.length > 0 ? `<div class="header-contacts">${headerContactLines.join("<br>")}</div>` : ""}
  </div>

  <div class="section-title">Коммерческое предложение (${selectedItems.length} поз.)</div>

  <table class="price-table">
    ${itemRows}
    <tr class="total-row">
      <td></td>
      <td style="padding:12px 0;">ИТОГО</td>
      <td style="padding:12px 0;text-align:right;">${formatPrice(selectedTotal)} ₽</td>
    </tr>
  </table>

  <div class="section-title">Условия</div>
  <div class="conditions"><ul>
    <li>Доставка и услуги грузчиков — по тарифам партнёров (оплачиваются отдельно)</li>
    <li>Срок изготовления: от ${prodDays} рабочих дней</li>
    <li>Гарантия: ${warranty} год на изделие</li>
  </ul></div>

  ${specialist?.fullName ? `
  <div class="section-title">Ваш специалист</div>
  <div style="font-size:13px;color:#333;line-height:1.8;margin-bottom:20px;">
    <strong>${DOMPurify.sanitize(specialist.fullName)}</strong><br>
    ${specialist.phone ? `📞 ${specialist.phone}<br>` : ""}
    ${specialist.email ? `✉️ ${specialist.email}<br>` : ""}
    ${specialist.telegram ? `Telegram: ${specialist.telegram}` : ""}
  </div>` : ""}

  ${showColors === "да" && colorsWithImages.length > 0 ? `
  <div style="margin-top:24px;margin-bottom:20px;">
    <div style="font-size:11px;text-transform:uppercase;letter-spacing:2px;color:#888;margin-bottom:12px;font-weight:600;">Стандартные цвета COZY ART</div>
    <div style="display:flex;flex-wrap:wrap;gap:${colorGap}px;justify-content:flex-start;">
      ${colorsWithImages.map(c => `<div style="text-align:center;width:${colorPhotoW}px;flex-shrink:0;">
        <img src="${DOMPurify.sanitize(c.image_url || "")}" alt="${DOMPurify.sanitize(c.name)}" style="width:${colorPhotoW}px;height:${colorPhotoH}px;object-fit:cover;border-radius:6px;border:1px solid #e5e5e5;" />
        <div style="font-size:10px;color:#555;margin-top:4px;">${DOMPurify.sanitize(c.name)}</div>
      </div>`).join("")}
    </div>
  </div>` : ""}

  <div class="footer">
    ${footerLeftLines.length > 0 ? `<div class="footer-col">${footerLeftLines.join("<br>")}</div>` : ""}
    ${footerRightLines.length > 0 ? `<div class="footer-col" style="text-align:right;">${footerRightLines.join("<br>")}</div>` : ""}
  </div>
</div></body></html>`;
  };

  const handlePrintCart = () => {
    if (selectedItems.length === 0) return;
    const html = buildMultiPrintHtml();
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(html);
    printWindow.document.close();
    const images = printWindow.document.querySelectorAll("img");
    let loaded = 0;
    const total = images.length;
    const onLoad = () => { loaded++; if (loaded >= total) printWindow.print(); };
    if (total === 0) { printWindow.print(); return; }
    images.forEach(img => {
      if (img.complete) onLoad();
      else { img.addEventListener("load", onLoad); img.addEventListener("error", onLoad); }
    });
    setTimeout(() => printWindow.print(), 3000);
  };

  const handleShareCart = (platform: string) => {
    if (selectedItems.length === 0) return;
    const text = buildMultiShareText();
    const encoded = encodeURIComponent(text);
    switch (platform) {
      case "telegram": window.open(`tg://msg_url?url=&text=${encoded}`, "_blank"); break;
      case "whatsapp": window.open(`https://wa.me/?text=${encoded}`, "_blank"); break;
      case "email": window.open(`mailto:?subject=${encodeURIComponent("COZY ART — Коммерческое предложение")}&body=${encoded}`, "_blank"); break;
      default: navigator.clipboard.writeText(text); toast.success("Скопировано в буфер обмена");
    }
  };

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
