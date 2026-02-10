import { motion } from "framer-motion";
import { CalculationResult } from "@/lib/calculator";
import { Separator } from "@/components/ui/separator";

function formatPrice(num: number) {
  return Math.round(num).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

export default function ResultPanel({ result }: { result: CalculationResult }) {
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
          <span>{result.weight} кг</span>
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
    </motion.div>
  );
}
