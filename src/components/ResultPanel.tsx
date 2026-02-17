import { motion } from "framer-motion";
import { CalculationResult } from "@/lib/calculator";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Printer, Share2, Save, MessageCircle, Mail } from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function formatPrice(num: number) {
  return Math.round(num).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

interface CompanySettingsAccessor {
  getSetting: (key: string) => string;
}

function buildShareText(result: CalculationResult, cs?: CompanySettingsAccessor) {
  let text = `🧾 Расчёт стоимости\n\n`;
  text += `${result.productLabel}\n`;
  text += `Стоимость изделия: ${formatPrice(result.totalPrice)} ₽\n`;
  if (result.supportPrice) {
    text += `${result.supportLabel || "Кронштейн"} (при необходимости): ${formatPrice(result.supportPrice)} ₽\n`;
  }
  text += `Монтаж (при необходимости): ${formatPrice(result.installationPrice)} ₽\n`;
  text += `\n📌 УСЛОВИЯ\n`;
  const days = cs?.getSetting("production_days") || "20";
  const warranty = cs?.getSetting("warranty_years") || "1";
  text += `• Кронштейн и монтаж приобретаются при необходимости\n`;
  text += `• Доставка и грузчики — отдельно\n`;
  text += `• Срок изготовления: от ${days} рабочих дней\n`;
  text += `• Гарантия: ${warranty} год\n`;
  if (cs) {
    const phone = cs.getSetting("phone_main");
    if (phone) text += `\n📞 ${phone}`;
    const site = cs.getSetting("website");
    if (site) text += `\n🌐 ${site}`;
  }
  text += `\n\nCOZY ART — архитектурный бетон`;
  return text;
}

function handlePrint(result: CalculationResult, cs?: CompanySettingsAccessor, specialist?: SpecialistInfo) {
  const phone = cs?.getSetting("phone_main") || "+7 (913) 748-05-03";
  const phoneExtra = cs?.getSetting("phone_extra") || "";
  const email = cs?.getSetting("email") || "cozyartnsk1@gmail.com";
  const site = cs?.getSetting("website") || "www.cozyart.ru";
  const address = cs?.getSetting("address") || "г. Новосибирск";
  const workHours = cs?.getSetting("work_hours") || "Пн-Пт: 09:00 — 18:00";
  const prodDays = cs?.getSetting("production_days") || "20";
  const warranty = cs?.getSetting("warranty_years") || "1";
  const telegram = cs?.getSetting("telegram") || "@dimakopt";
  const whatsapp = cs?.getSetting("whatsapp") || "";

  const printWindow = window.open("", "_blank");
  if (!printWindow) return;

  const supportLine = result.supportPrice
    ? `<tr>
        <td style="padding:12px 0;border-bottom:1px solid #e5e5e5;">
          <div style="font-size:14px;color:#333;">${result.supportLabel || "Кронштейн"} <span style="font-size:11px;color:#888;">(при необходимости)</span></div>
        </td>
        <td style="padding:12px 0;border-bottom:1px solid #e5e5e5;text-align:right;font-weight:600;white-space:nowrap;">${formatPrice(result.supportPrice)} ₽</td>
      </tr>`
    : "";

  printWindow.document.write(`<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="utf-8">
<title>COZY ART — Расчёт стоимости</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family:'Inter',sans-serif; color:#1a1a1a; background:#fff; padding:0; }
  .page { max-width:700px; margin:0 auto; padding:40px 32px; }
  .header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:32px; padding-bottom:20px; border-bottom:3px solid #1a1a1a; }
  .logo { font-size:28px; font-weight:700; letter-spacing:2px; color:#1a1a1a; }
  .logo-sub { font-size:11px; color:#888; letter-spacing:3px; text-transform:uppercase; margin-top:2px; }
  .header-contacts { text-align:right; font-size:12px; color:#555; line-height:1.8; }
  .section-title { font-size:11px; text-transform:uppercase; letter-spacing:2px; color:#888; margin-bottom:12px; font-weight:600; }
  .nomenclature { background:#f8f8f8; border-left:4px solid #1a1a1a; padding:16px 20px; margin-bottom:28px; font-size:14px; line-height:1.7; color:#333; }
  .price-table { width:100%; border-collapse:collapse; margin-bottom:28px; }
  .price-table td { padding:12px 0; border-bottom:1px solid #e5e5e5; }
  .price-table td:last-child { text-align:right; font-weight:600; white-space:nowrap; }
  .conditions { background:#fafafa; border:1px solid #eee; border-radius:6px; padding:16px 20px; margin-bottom:28px; }
  .conditions li { font-size:12px; color:#555; margin-bottom:6px; list-style:none; padding-left:16px; position:relative; }
  .conditions li::before { content:"—"; position:absolute; left:0; color:#bbb; }
  .footer { border-top:2px solid #1a1a1a; padding-top:16px; display:flex; justify-content:space-between; font-size:11px; color:#777; }
  .footer-col { line-height:1.8; }
  @media print {
    body { padding:0; }
    .page { padding:20px; }
    @page { margin:15mm; }
  }
</style>
</head>
<body>
<div class="page">
  <div class="header">
    <div>
      <div class="logo">COZY ART</div>
      <div class="logo-sub">архитектурный бетон</div>
    </div>
    <div class="header-contacts">
      ${phone}<br>
      ${phoneExtra ? phoneExtra + "<br>" : ""}
      ${email}
    </div>
  </div>

  <div class="section-title">Расчёт стоимости изделия</div>
  <div class="nomenclature">${result.productLabel}</div>

  <table class="price-table">
    <tr>
      <td style="padding:12px 0;border-bottom:1px solid #e5e5e5;">
        <div style="font-size:14px;color:#333;">Стоимость изделия</div>
        ${result.quantity > 1 ? `<div style="font-size:11px;color:#888;margin-top:2px;">${result.quantity} шт. × ${formatPrice(result.pricePerUnit)} ₽</div>` : ""}
      </td>
      <td style="padding:12px 0;border-bottom:1px solid #e5e5e5;text-align:right;font-weight:600;white-space:nowrap;">${formatPrice(result.totalPrice)} ₽</td>
    </tr>
    ${supportLine}
    <tr>
      <td style="padding:12px 0;border-bottom:1px solid #e5e5e5;">
        <div style="font-size:14px;color:#333;">Монтажные работы <span style="font-size:11px;color:#888;">(при необходимости)</span></div>
        <div style="font-size:11px;color:#888;margin-top:2px;">в черте города Новосибирск</div>
      </td>
      <td style="padding:12px 0;border-bottom:1px solid #e5e5e5;text-align:right;font-weight:600;white-space:nowrap;">${formatPrice(result.installationPrice)} ₽</td>
    </tr>
  </table>

  <div class="section-title">Условия</div>
  <div class="conditions">
    <ul>
      <li>Кронштейн и монтаж приобретаются при необходимости</li>
      <li>Доставка и услуги грузчиков — по тарифам партнёров (оплачиваются отдельно)</li>
      <li>Срок изготовления: от ${prodDays} рабочих дней</li>
      <li>Гарантия: ${warranty} год на изделие</li>
    </ul>
  </div>

  ${specialist?.fullName ? `
  <div class="section-title" style="margin-top:20px;">Ваш специалист</div>
  <div style="font-size:13px;color:#333;line-height:1.8;margin-bottom:20px;">
    <strong>${specialist.fullName}</strong><br>
    ${specialist.phone ? `📞 ${specialist.phone}<br>` : ""}
    ${specialist.email ? `✉️ ${specialist.email}<br>` : ""}
    ${specialist.telegram ? `Telegram: ${specialist.telegram}` : ""}
  </div>
  ` : ""}

  <div class="footer">
    <div class="footer-col">
      ${address}<br>
      ${workHours}
    </div>
    <div class="footer-col" style="text-align:right;">
      ${site}<br>
      Telegram: ${telegram}${whatsapp ? "<br>WhatsApp: " + whatsapp : ""}
    </div>
  </div>
</div>
</body></html>`);
  printWindow.document.close();
  printWindow.print();
}

function shareVia(platform: string, result: CalculationResult, cs?: CompanySettingsAccessor) {
  const text = encodeURIComponent(buildShareText(result, cs));
  let url = "";
  switch (platform) {
    case "telegram": url = `https://t.me/share/url?text=${text}`; break;
    case "whatsapp": url = `https://wa.me/?text=${text}`; break;
    case "email": url = `mailto:?subject=${encodeURIComponent("COZY ART — Расчёт стоимости")}&body=${text}`; break;
    default: {
      navigator.clipboard.writeText(buildShareText(result, cs));
      toast.success("Скопировано в буфер обмена");
      return;
    }
  }
  window.open(url, "_blank");
}

interface SpecialistInfo {
  fullName?: string;
  phone?: string;
  telegram?: string;
  email?: string;
}

interface Props {
  result: CalculationResult;
  onSave?: () => void;
  saving?: boolean;
  companySettings?: CompanySettingsAccessor;
  specialist?: SpecialistInfo;
}

export default function ResultPanel({ result, onSave, saving, companySettings, specialist }: Props) {
  const prodDays = companySettings?.getSetting("production_days") || "20";

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="glass-panel p-6 glow-primary"
    >
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        🧾 <span>Расчёт стоимости</span>
      </h3>

      {/* Nomenclature */}
      <div className="text-sm leading-relaxed mb-4 p-3 rounded-lg bg-secondary/50 border border-border/50">
        {result.productLabel}
      </div>

      <div className="space-y-3 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Стоимость изделия</span>
          <span className="font-medium">{formatPrice(result.totalPrice)} ₽</span>
        </div>

        {result.quantity > 1 && (
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Цена за 1 шт.</span>
            <span>{formatPrice(result.pricePerUnit)} ₽</span>
          </div>
        )}

        {result.supportPrice != null && result.supportPrice > 0 && (
          <div className="flex justify-between">
            <span className="text-muted-foreground text-xs">{result.supportLabel || "Кронштейн"} <span className="text-[10px]">(при необходимости)</span></span>
            <span>{formatPrice(result.supportPrice)} ₽</span>
          </div>
        )}

        <div className="flex justify-between">
          <span className="text-muted-foreground">Монтаж <span className="text-[10px]">(при необходимости)</span></span>
          <span>{formatPrice(result.installationPrice)} ₽</span>
        </div>
      </div>

      <div className="mt-6 p-3 rounded-lg bg-secondary/50 text-xs text-muted-foreground space-y-1">
        <p>• Кронштейн и монтаж приобретаются при необходимости</p>
        <p>• Доставка и грузчики оплачиваются отдельно</p>
        <p>• Срок изготовления: от {prodDays} рабочих дней</p>
        <p>• Гарантия: 1 год</p>
      </div>

      {specialist?.fullName && (
        <div className="mt-3 p-3 rounded-lg bg-secondary/30 text-xs text-muted-foreground space-y-0.5">
          <p className="font-medium text-foreground">Специалист: {specialist.fullName}</p>
          {specialist.phone && <p>📞 {specialist.phone}</p>}
          {specialist.email && <p>✉️ {specialist.email}</p>}
          {specialist.telegram && <p>Telegram: {specialist.telegram}</p>}
        </div>
      )}

      {/* Action buttons */}
      <div className="mt-4 flex flex-wrap gap-2">
        {onSave && (
          <Button size="sm" variant="secondary" onClick={onSave} disabled={saving} className="gap-1.5">
            <Save className="w-4 h-4" />
            {saving ? "Сохранено" : "Сохранить"}
          </Button>
        )}
        <Button size="sm" variant="secondary" onClick={() => handlePrint(result, companySettings, specialist)} className="gap-1.5">
          <Printer className="w-4 h-4" />
          Печать
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" variant="secondary" className="gap-1.5">
              <Share2 className="w-4 h-4" />
              Поделиться
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => shareVia("telegram", result, companySettings)}>
              <MessageCircle className="w-4 h-4 mr-2" /> Telegram
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => shareVia("whatsapp", result, companySettings)}>
              <MessageCircle className="w-4 h-4 mr-2" /> WhatsApp
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => shareVia("email", result, companySettings)}>
              <Mail className="w-4 h-4 mr-2" /> Email
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => shareVia("copy", result, companySettings)}>
              <Share2 className="w-4 h-4 mr-2" /> Копировать
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </motion.div>
  );
}
