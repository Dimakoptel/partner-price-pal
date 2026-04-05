import { motion } from "framer-motion";
import DOMPurify from "dompurify";
import { CalculationResult } from "@/lib/calculator";
import { Button } from "@/components/ui/button";
import { Printer, Share2, Save, MessageCircle, Mail, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function formatPrice(num: number) {
  return Math.round(num).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

export interface CompanySettingsAccessor {
  getSetting: (key: string) => string;
}

export interface SpecialistInfo {
  fullName?: string;
  phone?: string;
  telegram?: string;
  email?: string;
}

// "Коптелов Дмитрий Владимирович" → "Дмитрий Коптелов"
function formatSpecialistName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[1]} ${parts[0]}`;
  }
  return fullName;
}

export function buildShareText(result: CalculationResult, cs?: CompanySettingsAccessor) {
  let text = `🧾 Расчёт стоимости\n\n`;
  text += `${result.productLabel}\n`;
  text += `Стоимость изделия: ${formatPrice(result.totalPrice)} ₽\n`;
  if (result.quantity > 1) {
    text += `Цена за 1 шт.: ${formatPrice(result.pricePerUnit)} ₽\n`;
  }
  if (result.weight > 0) {
    if (result.quantity > 1 && result.weightPerItem) {
      text += `Ориентировочный вес за 1 шт.: ${result.weightPerItem} кг\n`;
      text += `Ориентировочный общий вес: ${result.weight} кг\n`;
    } else {
      text += `Ориентировочный вес: ${result.weight} кг\n`;
    }
  }
  if (result.energyConsumptionPerItem && result.energyConsumptionPerItem > 0) {
    text += `Энергопотребление 1 шт.: ${result.energyConsumptionPerItem} Вт\n`;
    if (result.quantity > 1 && result.energyConsumption) {
      text += `Общее энергопотребление: ${result.energyConsumption} Вт\n`;
    }
  }
  if (result.supportPrice) {
    text += `${result.supportLabel || "Кронштейн"} (при необходимости): ${formatPrice(result.supportPrice)} ₽\n`;
  }
  if (result.riserLabel && result.riserPrice) {
    text += `\n${result.riserLabel}\n`;
    text += `Стоимость подступенков: ${formatPrice(result.riserPrice)} ₽\n`;
    if (result.quantity > 1 && result.riserPricePerUnit) {
      text += `Цена подступенка за 1 шт.: ${formatPrice(result.riserPricePerUnit)} ₽\n`;
    }
    if (result.riserWeightPerItem) {
      text += `Вес подступенка за 1 шт.: ${result.riserWeightPerItem} кг\n`;
    }
    if (result.riserWeight) {
      text += `Общий вес подступенков: ${result.riserWeight} кг\n`;
    }
  }
  if (result.boxLabel && result.boxPrice) {
    text += `${result.boxLabel}: ${formatPrice(result.boxPrice)} ₽\n`;
  }
  if (result.installationNote) {
    text += `\n${result.installationNote}\n`;
  } else {
    text += `Монтаж (при необходимости): ${formatPrice(result.installationPrice)} ₽\n`;
  }
  text += `\n📌 УСЛОВИЯ\n`;
  const days = cs?.getSetting("production_days") || "20";
  const warranty = cs?.getSetting("warranty_years") || "1";
  if (result.supportPrice) {
    text += `• Кронштейн и монтаж приобретаются при необходимости\n`;
  }
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

export interface ColorForPrint {
  name: string;
  image_url?: string;
  show_in_print?: boolean;
}

export function buildPrintHtml(result: CalculationResult, cs?: CompanySettingsAccessor, specialist?: SpecialistInfo, colorsForPrint?: ColorForPrint[]) {
  const phone = cs?.getSetting("phone_main") || "";
  const phoneExtra = cs?.getSetting("phone_extra") || "";
  const email = cs?.getSetting("email") || "";
  const site = cs?.getSetting("website") || "";
  const address = cs?.getSetting("address") || "";
  const workHours = cs?.getSetting("work_hours") || "";
  const telegram = cs?.getSetting("telegram") || "";
  const whatsapp = cs?.getSetting("whatsapp") || "";

  // Template settings - sanitize all user-controlled values
  const companyName = DOMPurify.sanitize(cs?.getSetting("print_company_name") || "COZY ART");
  const subtitle = DOMPurify.sanitize(cs?.getSetting("print_company_subtitle") || "архитектурный бетон");
  const logoUrl = DOMPurify.sanitize(cs?.getSetting("print_logo_url") || "");
  const customFooterLeft = cs?.getSetting("print_footer_left") || "";
  const customFooterRight = cs?.getSetting("print_footer_right") || "";
  const customConditions = cs?.getSetting("print_conditions") || "";
  const prodDays = DOMPurify.sanitize(cs?.getSetting("production_days") || "20");
  const warranty = DOMPurify.sanitize(cs?.getSetting("warranty_years") || "1");

  const supportLine = result.supportPrice
    ? `<tr>
        <td style="padding:12px 0;border-bottom:1px solid #e5e5e5;">
          <div style="font-size:14px;color:#333;">${result.supportLabel || "Кронштейн"} <span style="font-size:11px;color:#888;">(при необходимости)</span></div>
        </td>
        <td style="padding:12px 0;border-bottom:1px solid #e5e5e5;text-align:right;font-weight:600;white-space:nowrap;">${formatPrice(result.supportPrice)} ₽</td>
      </tr>`
    : "";

  const riserLine = (result.riserLabel && result.riserPrice)
    ? `<tr>
        <td style="padding:12px 0;border-bottom:1px solid #e5e5e5;">
          <div style="font-size:14px;color:#333;">${result.riserLabel}</div>
          ${result.quantity > 1 && result.riserPricePerUnit ? `<div style="font-size:11px;color:#888;margin-top:2px;">${result.quantity} шт. × ${formatPrice(result.riserPricePerUnit)} ₽</div>` : ""}
          ${result.riserWeightPerItem ? `<div style="font-size:11px;color:#888;margin-top:2px;">Вес за 1 шт.: ${result.riserWeightPerItem} кг${result.riserWeight && result.quantity > 1 ? ` · Общий: ${result.riserWeight} кг` : ""}</div>` : ""}
        </td>
        <td style="padding:12px 0;border-bottom:1px solid #e5e5e5;text-align:right;font-weight:600;white-space:nowrap;">${formatPrice(result.riserPrice)} ₽</td>
      </tr>`
    : "";

  const headerContactLines: string[] = [];
  if (phone) headerContactLines.push(phone);
  if (phoneExtra) headerContactLines.push(phoneExtra);
  if (email) headerContactLines.push(email);

  // Footer: use custom or fallback to dynamic contacts, sanitize each line
  const footerLeftLines: string[] = (customFooterLeft
    ? customFooterLeft.split("\n").filter(Boolean)
    : [address, workHours].filter(Boolean)).map(l => DOMPurify.sanitize(l));

  const footerRightLines: string[] = (customFooterRight
    ? customFooterRight.split("\n").filter(Boolean)
    : [site, telegram ? `Telegram: ${telegram}` : "", whatsapp ? `WhatsApp: ${whatsapp}` : ""].filter(Boolean)).map(l => DOMPurify.sanitize(l));

  // Conditions: use custom or default
  const defaultConditions = [];
  if (result.supportPrice) {
    defaultConditions.push("Кронштейн и монтаж приобретаются при необходимости");
  }
  defaultConditions.push(
    "Доставка и услуги грузчиков — по тарифам партнёров (оплачиваются отдельно)",
    `Срок изготовления: от ${prodDays} рабочих дней`,
    `Гарантия: ${warranty} год на изделие`,
  );
  const conditionLines = (customConditions
    ? customConditions.split("\n").filter(Boolean)
    : defaultConditions).map(l => DOMPurify.sanitize(l));

  return `<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="utf-8">
<title>${companyName} — Расчёт стоимости</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family:'Inter',sans-serif; color:#1a1a1a; background:#fff; padding:0; }
  .page { max-width:700px; margin:0 auto; padding:40px 32px; }
  .header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:32px; padding-bottom:20px; border-bottom:3px solid #1a1a1a; }
  .logo { font-size:28px; font-weight:700; letter-spacing:2px; color:#1a1a1a; }
  .logo-sub { font-size:11px; color:#888; letter-spacing:3px; text-transform:uppercase; margin-top:2px; }
  .logo-img { max-height:60px; max-width:200px; object-fit:contain; margin-bottom:4px; }
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
      ${logoUrl ? `<img src="${logoUrl}" class="logo-img" alt="Logo"><br>` : ""}
      <div class="logo">${companyName}</div>
      <div class="logo-sub">${subtitle}</div>
    </div>
    ${headerContactLines.length > 0 ? `<div class="header-contacts">${headerContactLines.join("<br>")}</div>` : ""}
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
    ${riserLine}
    ${(result.boxLabel && result.boxPrice) ? `<tr>
        <td style="padding:12px 0;border-bottom:1px solid #e5e5e5;">
          <div style="font-size:14px;color:#333;">${result.boxLabel}</div>
        </td>
        <td style="padding:12px 0;border-bottom:1px solid #e5e5e5;text-align:right;font-weight:600;white-space:nowrap;">${formatPrice(result.boxPrice)} ₽</td>
      </tr>` : ''}
    ${supportLine}
    ${result.installationNote ? `
    <tr>
      <td colspan="2" style="padding:12px 0;border-bottom:1px solid #e5e5e5;">
        <div style="font-size:14px;color:#333;font-weight:500;">Монтажные работы</div>
        <div style="font-size:12px;color:#666;margin-top:4px;white-space:pre-line;">${result.installationNote}</div>
        <div style="font-size:11px;color:#888;margin-top:4px;font-style:italic;">Оплата монтажных работ производится в день завершения монтажа специалисту по монтажу</div>
      </td>
    </tr>` : `
    <tr>
      <td style="padding:12px 0;border-bottom:1px solid #e5e5e5;">
        <div style="font-size:14px;color:#333;">Монтажные работы <span style="font-size:11px;color:#888;">(при необходимости)</span></div>
        <div style="font-size:11px;color:#888;margin-top:4px;font-style:italic;">Оплата монтажных работ производится в день завершения монтажа специалисту по монтажу</div>
      </td>
      <td style="padding:12px 0;border-bottom:1px solid #e5e5e5;text-align:right;font-weight:600;white-space:nowrap;">${formatPrice(result.installationPrice)} ₽</td>
    </tr>`}
    <tr>
      <td colspan="2" style="padding:8px 0;font-size:12px;color:#555;">
        ${result.quantity > 1 && result.weightPerItem ? `Ориентировочный вес за 1 шт.: <strong>${result.weightPerItem} кг</strong> · Общий вес: <strong>${result.weight} кг</strong>` : `Ориентировочный вес: <strong>${result.weight} кг</strong>`}
        ${result.energyConsumptionPerItem && result.energyConsumptionPerItem > 0 ? `<br>Энергопотребление 1 шт.: <strong>${result.energyConsumptionPerItem} Вт</strong>${result.quantity > 1 && result.energyConsumption ? ` · Общее: <strong>${result.energyConsumption} Вт</strong>` : ""}` : ""}
      </td>
    </tr>
  </table>

  <div class="section-title">Условия</div>
  <div class="conditions">
    <ul>
      ${conditionLines.map(l => `<li>${l}</li>`).join("\n      ")}
    </ul>
  </div>

  ${specialist?.fullName ? `
  <div class="section-title" style="margin-top:20px;">Ваш специалист</div>
  <div style="font-size:13px;color:#333;line-height:1.8;margin-bottom:20px;">
    <strong>${formatSpecialistName(specialist.fullName)}</strong><br>
    ${specialist.phone ? `📞 ${specialist.phone}<br>` : ""}
    ${specialist.email ? `✉️ ${specialist.email}<br>` : ""}
    ${specialist.telegram ? `Telegram: ${specialist.telegram}` : ""}
  </div>
  ` : ""}

  ${(() => {
    const showColors = (cs?.getSetting("print_color_show") || "да").toLowerCase();
    const colorPhotoW = parseInt(cs?.getSetting("print_color_photo_width") || "80") || 80;
    const colorPhotoH = parseInt(cs?.getSetting("print_color_photo_height") || "80") || 80;
    const colorGap = parseInt(cs?.getSetting("print_color_gap") || "12") || 12;
    const customNote = cs?.getSetting("print_color_custom_note") || "";
    const colorsWithImages = (colorsForPrint || []).filter(c => c.image_url && c.show_in_print !== false);
    if (showColors !== "да" || colorsWithImages.length === 0) return "";
    return `
    <div style="margin-top:24px;margin-bottom:20px;">
      <div style="font-size:11px;text-transform:uppercase;letter-spacing:2px;color:#888;margin-bottom:12px;font-weight:600;">Стандартные цвета COZY ART</div>
      <div style="display:flex;flex-wrap:wrap;gap:${colorGap}px;justify-content:flex-start;">
        ${colorsWithImages.map(c => `
          <div style="text-align:center;width:${colorPhotoW}px;flex-shrink:0;">
            <img src="${DOMPurify.sanitize(c.image_url || "")}" alt="${DOMPurify.sanitize(c.name)}" style="width:${colorPhotoW}px;height:${colorPhotoH}px;object-fit:cover;border-radius:6px;border:1px solid #e5e5e5;" />
            <div style="font-size:10px;color:#555;margin-top:4px;line-height:1.3;word-break:break-word;">${DOMPurify.sanitize(c.name)}</div>
          </div>
        `).join("")}
      </div>
      ${customNote ? `<div style="font-size:10px;color:#999;margin-top:8px;font-style:italic;">${DOMPurify.sanitize(customNote)}</div>` : ""}
    </div>`;
  })()}

  <div class="footer">
    ${footerLeftLines.length > 0 ? `<div class="footer-col">${footerLeftLines.join("<br>")}</div>` : ""}
    ${footerRightLines.length > 0 ? `<div class="footer-col" style="text-align:right;">${footerRightLines.join("<br>")}</div>` : ""}
  </div>
</div>
</body></html>`;
}

export function handlePrint(result: CalculationResult, cs?: CompanySettingsAccessor, specialist?: SpecialistInfo, colorsForPrint?: ColorForPrint[]) {
  const html = buildPrintHtml(result, cs, specialist, colorsForPrint);

  // Preload images to avoid blank photos on first print
  const imgUrls = (colorsForPrint || []).filter(c => c.image_url && c.show_in_print !== false).map(c => c.image_url!);
  const logoUrl = cs?.getSetting("print_logo_url") || "";
  if (logoUrl) imgUrls.push(logoUrl);

  const printWindow = window.open("", "_blank");
  if (!printWindow) return;
  printWindow.document.write(html);
  printWindow.document.close();

  if (imgUrls.length === 0) {
    printWindow.print();
    return;
  }

  // Wait for all images to load before printing
  const images = printWindow.document.querySelectorAll("img");
  let loaded = 0;
  const total = images.length;
  const onLoad = () => {
    loaded++;
    if (loaded >= total) printWindow.print();
  };
  images.forEach(img => {
    if (img.complete) { onLoad(); }
    else {
      img.addEventListener("load", onLoad);
      img.addEventListener("error", onLoad);
    }
  });
  // Fallback timeout
  setTimeout(() => printWindow.print(), 3000);
}

export function shareVia(platform: string, result: CalculationResult, cs?: CompanySettingsAccessor) {
  const text = encodeURIComponent(buildShareText(result, cs));
  let url = "";
  switch (platform) {
    case "telegram": url = `tg://msg_url?url=&text=${text}`; break;
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

export async function handleSaveFile(result: CalculationResult, calcName?: string, cs?: CompanySettingsAccessor, specialist?: SpecialistInfo) {
  const text = buildShareText(result, cs);
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${calcName || "расчёт"}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

interface Props {
  result: CalculationResult;
  onSave?: () => void;
  saving?: boolean;
  saveLabel?: string;
  saveIcon?: "save" | "cart" | "send";
  companySettings?: CompanySettingsAccessor;
  specialist?: SpecialistInfo;
  calcName?: string;
  colorsForPrint?: ColorForPrint[];
}

export default function ResultPanel({ result, onSave, saving, saveLabel, saveIcon, companySettings, specialist, calcName, colorsForPrint }: Props) {
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
          <span className="font-medium whitespace-nowrap ml-4">{formatPrice(result.totalPrice)} ₽</span>
        </div>

        {result.quantity > 1 && (
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Цена за 1 шт.</span>
            <span className="whitespace-nowrap ml-4">{formatPrice(result.pricePerUnit)} ₽</span>
          </div>
        )}

        {result.weight > 0 && (
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">
              Ориентировочный вес{result.quantity > 1 && result.weightPerItem ? ` (${result.weightPerItem} кг × ${result.quantity} шт.)` : ""}
            </span>
            <span className="whitespace-nowrap ml-4">{result.weight} кг</span>
          </div>
        )}

        {result.numElements != null && result.numElements > 0 && (
          <div className="text-xs text-muted-foreground p-2 rounded bg-secondary/30 border border-border/30">
            Фартук будет состоять из {result.numElements} элемент(ов) (~{result.elementWidth} мм){result.numElements > 1 ? `, ${result.numElements - 1} стык(ов)` : ""}
          </div>
        )}

        {result.liftWarning && (
          <div className="text-xs text-amber-600 p-2 rounded bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
            {result.liftWarning}
          </div>
        )}

        {result.customThicknessWarning && (
          <div className="text-xs text-amber-600 p-2 rounded bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
            ⚠️ {result.customThicknessWarning}
          </div>
        )}

        {result.energyConsumptionPerItem != null && result.energyConsumptionPerItem > 0 && (
          <>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Энергопотребление 1 шт.</span>
              <span className="whitespace-nowrap ml-4">{result.energyConsumptionPerItem} Вт</span>
            </div>
            {result.quantity > 1 && result.energyConsumption != null && (
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Общее энергопотребление</span>
                <span className="whitespace-nowrap ml-4">{result.energyConsumption} Вт</span>
              </div>
            )}
          </>
        )}

        {/* Riser as separate nomenclature */}
        {result.riserLabel && result.riserPrice != null && result.riserPrice > 0 && (
          <div className="p-3 rounded-lg bg-secondary/30 border border-border/30 space-y-1">
            <div className="text-xs font-medium text-foreground">{result.riserLabel}</div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Стоимость подступенков</span>
              <span className="whitespace-nowrap ml-4">{formatPrice(result.riserPrice)} ₽</span>
            </div>
            {result.quantity > 1 && result.riserPricePerUnit != null && (
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Цена за 1 шт.</span>
                <span className="whitespace-nowrap ml-4">{formatPrice(result.riserPricePerUnit)} ₽</span>
              </div>
            )}
            {result.riserWeightPerItem != null && (
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Вес подступенка за 1 шт.</span>
                <span className="whitespace-nowrap ml-4">{result.riserWeightPerItem} кг</span>
              </div>
            )}
            {result.riserWeight != null && result.quantity > 1 && (
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Общий вес подступенков</span>
                <span className="whitespace-nowrap ml-4">{result.riserWeight} кг</span>
              </div>
            )}
          </div>
        )}

        {/* Transportation box — as regular line item before installation */}
        {result.boxLabel && result.boxPrice != null && result.boxPrice > 0 && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">{result.boxLabel}</span>
            <span className="font-medium whitespace-nowrap ml-4">{formatPrice(result.boxPrice)} ₽</span>
          </div>
        )}

        {result.supportPrice != null && result.supportPrice > 0 && (
          <div className="flex justify-between">
            <span className="text-muted-foreground text-xs">{result.supportLabel || "Кронштейн"} <span className="text-[10px]">(при необходимости)</span></span>
            <span className="whitespace-nowrap ml-4">{formatPrice(result.supportPrice)} ₽</span>
          </div>
        )}

        {result.installationNote ? (
          <div className="text-xs text-muted-foreground p-2 rounded bg-secondary/30 border border-border/30">
            <span className="font-medium text-foreground">Монтажные работы</span>
            <p className="mt-1 whitespace-pre-line">{result.installationNote}</p>
          </div>
        ) : (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Монтаж <span className="text-[10px]">(при необходимости)</span></span>
            <span className="whitespace-nowrap ml-4">{formatPrice(result.installationPrice)} ₽</span>
          </div>
        )}
      </div>

      <div className="mt-6 p-3 rounded-lg bg-secondary/50 text-xs text-muted-foreground space-y-1">
        {result.supportPrice != null && result.supportPrice > 0 && (
          <p>• Кронштейн и монтаж приобретаются при необходимости</p>
        )}
        <p>• Доставка и грузчики оплачиваются отдельно</p>
        <p>• Срок изготовления: от {prodDays} рабочих дней</p>
        <p>• Гарантия: 1 год</p>
      </div>

      {specialist?.fullName && (
        <div className="mt-3 p-3 rounded-lg bg-secondary/30 text-xs text-muted-foreground space-y-0.5">
          <p className="font-medium text-foreground">Специалист: {formatSpecialistName(specialist.fullName)}</p>
          {specialist.phone && <p>📞 {specialist.phone}</p>}
          {specialist.email && <p>✉️ {specialist.email}</p>}
          {specialist.telegram && <p>Telegram: {specialist.telegram}</p>}
        </div>
      )}

      {/* Action buttons */}
      <div className="mt-4 flex flex-wrap gap-2">
        {onSave && (
          <Button size="sm" variant="secondary" onClick={onSave} disabled={saving} className="gap-1.5">
            {saveIcon === "cart" ? <ShoppingCart className="w-4 h-4" /> : saveIcon === "send" ? <Send className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            {saveLabel || (saving ? "Сохранено" : "Сохранить")}
          </Button>
        )}
        <Button size="sm" variant="secondary" onClick={() => handlePrint(result, companySettings, specialist, colorsForPrint)} className="gap-1.5">
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
