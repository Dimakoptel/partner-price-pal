import { useState } from "react";
import { useCart, CartItem } from "@/hooks/useCart";
import { useCalculations } from "@/hooks/useCalculations";
import { useLeads } from "@/hooks/useLeads";
import { useAuth } from "@/hooks/useAuth";
import { useCompanySettings } from "@/hooks/useCompanySettings";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice, buildPrintHtml, type CompanySettingsAccessor, type SpecialistInfo, type ColorForPrint } from "@/components/ResultPanel";
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
    let text = `🧾 Коммерческое предложение (${selectedItems.length} поз.)\n\n`;

    let totalInstallation = 0;

    selectedItems.forEach((item, i) => {
      const r = item.result;
      text += `${i + 1}. ${r.productLabel}\n`;
      text += `   Стоимость изделия: ${formatPrice(r.totalPrice)} ₽\n`;
      if (r.quantity > 1) text += `   Кол-во: ${r.quantity} шт. × ${formatPrice(r.pricePerUnit)} ₽\n`;
      if (r.weight > 0) text += `   Ориентировочный вес: ${r.weight} кг\n`;
      if (r.riserLabel && r.riserPrice) text += `   ${r.riserLabel}: ${formatPrice(r.riserPrice)} ₽\n`;
      if (r.boxLabel && r.boxPrice) {
        // Strip foam thickness from box label for display
        const boxLabel = r.boxLabel.replace(/,\s*пеноплекс\s*\d+\s*мм/i, "");
        text += `   ${boxLabel}: ${formatPrice(r.boxPrice)} ₽\n`;
      }
      if (r.supportPrice) text += `   ${r.supportLabel || "Кронштейн"} (при необходимости): ${formatPrice(r.supportPrice)} ₽\n`;
      if (!r.installationNote) totalInstallation += r.installationPrice;
      text += `\n`;
    });

    text += `━━━━━━━━━━━━━━━━━━━━━━\n`;
    if (totalInstallation > 0) {
      text += `🔧 Монтажные работы (при необходимости): ${formatPrice(totalInstallation)} ₽\n`;
    }
    text += `💰 ИТОГО: ${formatPrice(selectedTotal)} ₽\n\n`;
    text += `📌 УСЛОВИЯ\n`;
    const days = cs.getSetting("production_days") || "20";
    const warranty = cs.getSetting("warranty_years") || "1";
    text += `• Доставка и грузчики — отдельно\n`;
    text += `• Оплата монтажных работ производится в день завершения монтажа\n`;
    text += `• Срок изготовления: от ${days} рабочих дней\n`;
    text += `• Гарантия: ${warranty} год\n`;
    const phone = cs.getSetting("phone_main");
    if (phone) text += `\n📞 ${phone}`;
    const site = cs.getSetting("website");
    if (site) text += `\n🌐 ${site}`;
    text += `\n\nCOZY ART — архитектурный бетон`;
    return text;
  };

  // Build multi-item print HTML — same format as single-item print
  const buildMultiPrintHtml = () => {
    if (selectedItems.length === 1) return buildPrintHtml(selectedItems[0].result, cs, specialist, colorsForPrint);

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

    // Build detailed rows for each item — matching single-item format
    let totalInstallation = 0;
    const itemRows = selectedItems.map((item, i) => {
      const r = item.result;
      let rows = "";

      // Product row
      rows += `<tr>
        <td style="padding:12px 0;border-bottom:1px solid #e5e5e5;">
          <div style="font-size:13px;font-weight:600;color:#1a1a1a;margin-bottom:4px;">${i + 1}. ${DOMPurify.sanitize(r.productLabel)}</div>
          <div style="font-size:14px;color:#333;">Стоимость изделия</div>
          ${r.quantity > 1 ? `<div style="font-size:11px;color:#888;margin-top:2px;">${r.quantity} шт. × ${formatPrice(r.pricePerUnit)} ₽</div>` : ""}
        </td>
        <td style="padding:12px 0;border-bottom:1px solid #e5e5e5;text-align:right;font-weight:600;white-space:nowrap;vertical-align:top;">${formatPrice(r.totalPrice)} ₽</td>
      </tr>`;

      // Weight
      if (r.weight > 0) {
        rows += `<tr>
          <td colspan="2" style="padding:4px 0 4px 16px;font-size:12px;color:#555;">
            Ориентировочный вес: <strong>${r.weight} кг</strong>${r.quantity > 1 && r.weightPerItem ? ` (${r.weightPerItem} кг × ${r.quantity} шт.)` : ""}
          </td>
        </tr>`;
      }

      // Riser
      if (r.riserLabel && r.riserPrice) {
        rows += `<tr>
          <td style="padding:8px 0 8px 16px;border-bottom:1px solid #e5e5e5;">
            <div style="font-size:13px;color:#333;">${DOMPurify.sanitize(r.riserLabel)}</div>
            ${r.quantity > 1 && r.riserPricePerUnit ? `<div style="font-size:11px;color:#888;margin-top:2px;">${r.quantity} шт. × ${formatPrice(r.riserPricePerUnit)} ₽</div>` : ""}
          </td>
          <td style="padding:8px 0;border-bottom:1px solid #e5e5e5;text-align:right;font-weight:600;white-space:nowrap;">${formatPrice(r.riserPrice)} ₽</td>
        </tr>`;
      }

      // Box (without foam thickness)
      if (r.boxLabel && r.boxPrice) {
        const boxLabel = r.boxLabel.replace(/,\s*пеноплекс\s*\d+\s*мм/i, "");
        rows += `<tr>
          <td style="padding:8px 0 8px 16px;border-bottom:1px solid #e5e5e5;">
            <div style="font-size:13px;color:#333;">${DOMPurify.sanitize(boxLabel)}</div>
          </td>
          <td style="padding:8px 0;border-bottom:1px solid #e5e5e5;text-align:right;font-weight:600;white-space:nowrap;">${formatPrice(r.boxPrice)} ₽</td>
        </tr>`;
      }

      // Support
      if (r.supportPrice) {
        rows += `<tr>
          <td style="padding:8px 0 8px 16px;border-bottom:1px solid #e5e5e5;">
            <div style="font-size:13px;color:#333;">${r.supportLabel || "Кронштейн"} <span style="font-size:11px;color:#888;">(при необходимости)</span></div>
          </td>
          <td style="padding:8px 0;border-bottom:1px solid #e5e5e5;text-align:right;font-weight:600;white-space:nowrap;">${formatPrice(r.supportPrice)} ₽</td>
        </tr>`;
      }

      if (!r.installationNote) totalInstallation += r.installationPrice;

      return rows;
    }).join("");

    // Installation total row
    const installRow = totalInstallation > 0 ? `<tr>
      <td style="padding:12px 0;border-bottom:1px solid #e5e5e5;">
        <div style="font-size:14px;color:#333;">Монтажные работы <span style="font-size:11px;color:#888;">(при необходимости)</span></div>
        <div style="font-size:11px;color:#888;margin-top:4px;font-style:italic;">Оплата монтажных работ производится в день завершения монтажа специалисту по монтажу</div>
      </td>
      <td style="padding:12px 0;border-bottom:1px solid #e5e5e5;text-align:right;font-weight:600;white-space:nowrap;vertical-align:top;">${formatPrice(totalInstallation)} ₽</td>
    </tr>` : "";

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
    ${installRow}
    <tr class="total-row">
      <td style="padding:12px 0;">ИТОГО</td>
      <td style="padding:12px 0;text-align:right;">${formatPrice(selectedTotal)} ₽</td>
    </tr>
  </table>

  <div class="section-title">Условия</div>
  <div class="conditions"><ul>
    <li>Доставка и услуги грузчиков — по тарифам партнёров (оплачиваются отдельно)</li>
    <li>Оплата монтажных работ производится в день завершения монтажа специалисту по монтажу</li>
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
            <div className="border-t pt-4 space-y-3 pb-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  Выбрано: {selectedItems.length} из {items.length}
                </span>
                <span className="font-bold text-primary">
                  {formatPrice(selectedTotal)} ₽
                </span>
              </div>

              {/* Append to existing lead */}
              {leads.filter(l => l.status !== "won" && l.status !== "lost").length > 0 && (
                <div>
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

              {/* Print & Share buttons */}
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 text-xs"
                  onClick={handlePrintCart}
                  disabled={selectedItems.length === 0}
                >
                  <Printer className="w-3.5 h-3.5" />
                  Печать КП
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5 text-xs w-full"
                      disabled={selectedItems.length === 0}
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      Поделиться
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleShareCart("telegram")}>
                      <MessageCircle className="w-4 h-4 mr-2" /> Telegram
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleShareCart("whatsapp")}>
                      <MessageCircle className="w-4 h-4 mr-2" /> WhatsApp
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleShareCart("email")}>
                      <Mail className="w-4 h-4 mr-2" /> Email
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleShareCart("copy")}>
                      <Copy className="w-4 h-4 mr-2" /> Копировать текст
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <Button
                className="w-full gap-2"
                size="sm"
                onClick={() => setSaveDialogOpen(true)}
                disabled={selectedItems.length === 0}
              >
                <FileText className="w-4 h-4" />
                {appendToLeadId ? "Добавить к лиду" : "Сохранить КП и создать лид"}
              </Button>
            </div>
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
  const r = item.result;
  return (
    <div className={`p-3 rounded-lg border transition-colors ${item.selected ? "bg-primary/5 border-primary/30" : "bg-secondary/30 border-border/50"}`}>
      <div className="flex items-start gap-3">
        <Switch checked={item.selected} onCheckedChange={() => onToggle(item.id)} className="mt-0.5" />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium truncate">{item.productLabel}</div>
          <div className="space-y-0.5 mt-1 text-xs text-muted-foreground">
            <div className="flex justify-between">
              <span>Стоимость изделия</span>
              <span className="font-medium text-foreground">{formatPrice(r.totalPrice)} ₽</span>
            </div>
            {r.weight > 0 && (
              <div className="flex justify-between">
                <span>Ориентировочный вес</span>
                <span>{r.weight} кг</span>
              </div>
            )}
            {r.riserLabel && r.riserPrice ? (
              <div className="flex justify-between">
                <span className="truncate mr-2">{r.riserLabel}</span>
                <span className="font-medium text-foreground">{formatPrice(r.riserPrice)} ₽</span>
              </div>
            ) : null}
            {r.boxLabel && r.boxPrice ? (
              <div className="flex justify-between">
                <span>Ящик транспортировочный</span>
                <span className="font-medium text-foreground">{formatPrice(r.boxPrice)} ₽</span>
              </div>
            ) : null}
            {r.supportPrice ? (
              <div className="flex justify-between">
                <span>{r.supportLabel || "Кронштейн"}</span>
                <span className="font-medium text-foreground">{formatPrice(r.supportPrice)} ₽</span>
              </div>
            ) : null}
            {!r.installationNote && (
              <div className="flex justify-between">
                <span>Монтаж</span>
                <span className="font-medium text-foreground">{formatPrice(r.installationPrice)} ₽</span>
              </div>
            )}
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={() => onRemove(item.id)} className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive shrink-0">
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}
