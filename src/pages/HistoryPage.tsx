import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import AppLayout from "@/components/AppLayout";
import { useCalculations } from "@/hooks/useCalculations";
import { useCompanySettings } from "@/hooks/useCompanySettings";
import { useAuth } from "@/hooks/useAuth";
import { Search, CalendarDays, List, Printer, Share2, Download, MessageCircle, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  formatPrice,
  handlePrint,
  shareVia,
  handleSaveFile,
} from "@/components/ResultPanel";
import HistoryCalendar from "@/components/HistoryCalendar";

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function toDateKey(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function HistoryPage() {
  const { calculations, loading } = useCalculations();
  const { getSetting } = useCompanySettings();
  const { user, profile } = useAuth();
  const [search, setSearch] = useState("");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");

  const cs = { getSetting };
  const specialist = {
    fullName: profile?.full_name || undefined,
    phone: profile?.phone || undefined,
    email: user?.email || undefined,
    telegram: profile?.telegram || undefined,
  };

  const countByDate = useMemo(() => {
    const map: Record<string, number> = {};
    calculations.forEach((c) => {
      const key = toDateKey(c.created_at);
      map[key] = (map[key] || 0) + 1;
    });
    return map;
  }, [calculations]);

  const filtered = useMemo(() => {
    let result = calculations;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (c) =>
          (c.calc_name && c.calc_name.toLowerCase().includes(q)) ||
          c.product_label.toLowerCase().includes(q) ||
          c.product_type.toLowerCase().includes(q)
      );
    }
    if (selectedDate) {
      result = result.filter((c) => toDateKey(c.created_at) === selectedDate);
    }
    return result;
  }, [calculations, search, selectedDate]);

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <h1 className="text-2xl font-bold mb-1">Мои расчёты</h1>
          <p className="text-muted-foreground text-sm mb-4">История сохранённых расчётов</p>
        </motion.div>

        {/* Search & view toggle */}
        <div className="flex gap-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Поиск по названию, изделию..."
              className="pl-9 bg-secondary border-border"
            />
          </div>
          <Button
            variant={viewMode === "calendar" ? "default" : "outline"}
            size="icon"
            onClick={() => setViewMode(viewMode === "calendar" ? "list" : "calendar")}
          >
            {viewMode === "calendar" ? <List className="w-4 h-4" /> : <CalendarDays className="w-4 h-4" />}
          </Button>
        </div>

        {/* Calendar */}
        {viewMode === "calendar" && (
          <div className="mb-4">
            <HistoryCalendar countByDate={countByDate} selectedDate={selectedDate} onSelectDate={setSelectedDate} />
          </div>
        )}

        {/* Selected date badge */}
        {selectedDate && (
          <div className="mb-3 flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              {new Date(selectedDate + "T00:00:00").toLocaleDateString("ru-RU", { day: "2-digit", month: "long", year: "numeric" })}
              {" · "}{countByDate[selectedDate] || 0} расчётов
            </Badge>
          </div>
        )}

        {loading ? (
          <div className="animate-pulse text-muted-foreground">Загрузка...</div>
        ) : filtered.length === 0 ? (
          <div className="glass-panel p-8 text-center text-muted-foreground">
            {calculations.length === 0
              ? "Нет сохранённых расчётов. Сделайте расчёт и нажмите «Сохранить»."
              : "Ничего не найдено по вашему запросу."}
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((calc) => (
              <motion.div
                key={calc.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-panel p-4"
              >
                <div className="flex justify-between items-start gap-2">
                  <div className="flex-1 min-w-0">
                    {calc.calc_name && (
                      <div className="font-semibold text-primary text-sm mb-1">{calc.calc_name}</div>
                    )}
                    <div className="text-xs text-muted-foreground mb-2">{formatDate(calc.created_at)}</div>
                    <div className="text-sm leading-relaxed">{calc.product_label}</div>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-border/50 space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Стоимость изделия</span>
                    <span className="font-medium whitespace-nowrap ml-4">{formatPrice((calc.result as any).totalPrice)} ₽</span>
                  </div>
                  {(calc.result as any).weight > 0 && (
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Ориентировочный вес</span>
                      <span className="whitespace-nowrap ml-4">{(calc.result as any).weight} кг</span>
                    </div>
                  )}
                  {(calc.result as any).energyConsumptionPerItem > 0 && (
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Энергопотребление</span>
                      <span className="whitespace-nowrap ml-4">{(calc.result as any).energyConsumption || (calc.result as any).energyConsumptionPerItem} Вт</span>
                    </div>
                  )}
                  {(calc.result as any).supportPrice > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Кронштейн <span className="text-[10px]">(при необходимости)</span></span>
                      <span className="whitespace-nowrap ml-4">{formatPrice((calc.result as any).supportPrice)} ₽</span>
                    </div>
                  )}
                  {(calc.result as any).installationNote ? (
                    <div className="text-xs text-muted-foreground mt-1">
                      <span className="font-medium text-foreground">Монтаж:</span> уточняется у менеджера
                    </div>
                  ) : (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Монтаж <span className="text-[10px]">(при необходимости)</span></span>
                      <span className="whitespace-nowrap ml-4">{formatPrice((calc.result as any).installationPrice)} ₽</span>
                    </div>
                  )}
                </div>

                {/* Action buttons */}
                <div className="mt-3 pt-3 border-t border-border/50 flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="gap-1.5 text-xs"
                    onClick={() => handlePrint(calc.result as unknown as CalculationResult, cs, specialist)}
                  >
                    <Printer className="w-3.5 h-3.5" /> Печать
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="gap-1.5 text-xs"
                    onClick={() => handleSaveFile(calc.result as unknown as CalculationResult, calc.calc_name, cs)}
                  >
                    <Download className="w-3.5 h-3.5" /> Сохранить файл
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="sm" variant="ghost" className="gap-1.5 text-xs">
                        <Share2 className="w-3.5 h-3.5" /> Поделиться
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => shareVia("telegram", calc.result as unknown as CalculationResult, cs)}>
                        <MessageCircle className="w-4 h-4 mr-2" /> Telegram
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => shareVia("whatsapp", calc.result as unknown as CalculationResult, cs)}>
                        <MessageCircle className="w-4 h-4 mr-2" /> WhatsApp
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => shareVia("email", calc.result as unknown as CalculationResult, cs)}>
                        <Mail className="w-4 h-4 mr-2" /> Email
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => shareVia("copy", calc.result as unknown as CalculationResult, cs)}>
                        <Share2 className="w-4 h-4 mr-2" /> Копировать
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
