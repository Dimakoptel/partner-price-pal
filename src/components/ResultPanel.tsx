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

function buildShareText(result: CalculationResult) {
  let text = `🧾 Расчёт изделия\n\n`;
  text += `${result.productLabel}\n — ${formatPrice(result.totalPrice)} ₽\n`;
  text += `Площадь: ${result.area} м²\n`;
  text += `Вес: ${result.weight} кг\n`;
  if (result.quantity > 1) text += `Количество: ${result.quantity} шт.\n`;
  text += `\nБазовая стоимость: ${formatPrice(result.basePrice)} ₽\n`;
  result.optionItems.forEach((item) => {
    text += `+ ${item.name}: ${formatPrice(item.price)} ₽\n`;
  });
  text += `\nСтоимость изделия: ${formatPrice(result.totalPrice)} ₽\n`;
  if (result.quantity > 1) text += `Цена за 1 шт.: ${formatPrice(result.pricePerUnit)} ₽\n`;
  if (result.supportPrice) {
    text += `Кронштейн: ${formatPrice(result.supportPrice)} ₽`;
    if (result.supportPricePerItem && result.quantity > 1) text += ` (${formatPrice(result.supportPricePerItem)} ₽/шт.)`;
    text += `\n`;
  }
  text += `Монтаж: ${formatPrice(result.installationPrice)} ₽\n`;
  text += `\n💰 ИТОГО: ${formatPrice(result.grandTotal)} ₽\n`;
  text += `\n📌 УСЛОВИЯ\n`;
  text += `• Доставка и грузчики — отдельно\n`;
  text += `• Срок изготовления: от 10 дней\n`;
  text += `• Гарантия: 1 год\n`;
  text += `\nCOZY ART — архитектурный бетон`;
  return text;
}

function handlePrint(result: CalculationResult) {
  const text = buildShareText(result);
  const printWindow = window.open("", "_blank");
  if (!printWindow) return;
  printWindow.document.write(`
    <html><head><title>COZY ART — Расчёт</title>
    <style>body{font-family:sans-serif;padding:40px;max-width:600px;margin:0 auto;white-space:pre-line;line-height:1.6}</style>
    </head><body>${text}</body></html>
  `);
  printWindow.document.close();
  printWindow.print();
}

function shareVia(platform: string, result: CalculationResult) {
  const text = encodeURIComponent(buildShareText(result));
  let url = "";
  switch (platform) {
    case "telegram": url = `https://t.me/share/url?text=${text}`; break;
    case "whatsapp": url = `https://wa.me/?text=${text}`; break;
    case "email": url = `mailto:?subject=${encodeURIComponent("COZY ART — Расчёт стоимости")}&body=${text}`; break;
    default: {
      navigator.clipboard.writeText(buildShareText(result));
      toast.success("Скопировано в буфер обмена");
      return;
    }
  }
  window.open(url, "_blank");
}

interface Props {
  result: CalculationResult;
  onSave?: () => void;
  saving?: boolean;
}

export default function ResultPanel({ result, onSave, saving }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="glass-panel p-6 glow-primary"
    >
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        🧾 <span>Расчёт стоимости</span>
      </h3>

      <div className="space-y-3 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Изделие</span>
          <span className="font-medium">{result.productLabel}</span>
        </div>

        <div className="flex justify-between">
          <span className="text-muted-foreground">Площадь</span>
          <span>{result.area} м²</span>
        </div>

        <div className="flex justify-between">
          <span className="text-muted-foreground">Вес</span>
          <span>{result.weight} кг{result.weightPerItem && result.quantity > 1 ? ` (${result.weightPerItem} кг/шт.)` : ""}</span>
        </div>

        {result.quantity > 1 && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Количество</span>
            <span>{result.quantity} шт.</span>
          </div>
        )}

        <Separator className="bg-border/50" />

        <div className="flex justify-between">
          <span className="text-muted-foreground">Базовая стоимость</span>
          <span>{formatPrice(result.basePrice)} ₽</span>
        </div>

        {result.optionItems.map((item, i) => (
          <div key={i} className="flex justify-between text-xs">
            <span className="text-muted-foreground">+ {item.name}</span>
            <span>{formatPrice(item.price)} ₽</span>
          </div>
        ))}

        <Separator className="bg-border/50" />

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

        <div className="flex justify-between">
          <span className="text-muted-foreground">Монтаж</span>
          <span>{formatPrice(result.installationPrice)} ₽</span>
        </div>

        <Separator className="bg-primary/30" />

        <div className="flex justify-between text-lg font-bold">
          <span className="text-gradient">ИТОГО</span>
          <span className="text-gradient">{formatPrice(result.grandTotal)} ₽</span>
        </div>
      </div>

      <div className="mt-6 p-3 rounded-lg bg-secondary/50 text-xs text-muted-foreground space-y-1">
        <p>• Доставка и грузчики оплачиваются отдельно</p>
        <p>• Срок изготовления: от 10 дней</p>
        <p>• Гарантия: 1 год</p>
      </div>

      {/* Action buttons */}
      <div className="mt-4 flex flex-wrap gap-2">
        {onSave && (
          <Button size="sm" variant="secondary" onClick={onSave} disabled={saving} className="gap-1.5">
            <Save className="w-4 h-4" />
            {saving ? "Сохранено" : "Сохранить"}
          </Button>
        )}
        <Button size="sm" variant="secondary" onClick={() => handlePrint(result)} className="gap-1.5">
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
            <DropdownMenuItem onClick={() => shareVia("telegram", result)}>
              <MessageCircle className="w-4 h-4 mr-2" /> Telegram
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => shareVia("whatsapp", result)}>
              <MessageCircle className="w-4 h-4 mr-2" /> WhatsApp
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => shareVia("email", result)}>
              <Mail className="w-4 h-4 mr-2" /> Email
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => shareVia("copy", result)}>
              <Share2 className="w-4 h-4 mr-2" /> Копировать
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </motion.div>
  );
}
