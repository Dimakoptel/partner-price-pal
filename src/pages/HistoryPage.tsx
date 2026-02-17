import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import AppLayout from "@/components/AppLayout";
import { useCalculations } from "@/hooks/useCalculations";
import { Search, CalendarDays, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { Badge } from "@/components/ui/badge";

function formatPrice(num: number) {
  return Math.round(num).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function toDateKey(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const WEEKDAYS_RU = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
const MONTHS_RU = ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"];

function CalendarView({
  countByDate,
  selectedDate,
  onSelectDate,
}: {
  countByDate: Record<string, number>;
  selectedDate: string | null;
  onSelectDate: (d: string | null) => void;
}) {
  const [viewDate, setViewDate] = useState(() => new Date());
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const firstDay = new Date(year, month, 1);
  // Monday-based: 0=Mon..6=Sun
  const startWeekday = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (number | null)[] = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const prevMonth = () => setViewDate(new Date(year, month - 1, 1));
  const nextMonth = () => setViewDate(new Date(year, month + 1, 1));

  return (
    <div className="glass-panel p-4">
      <div className="flex items-center justify-between mb-3">
        <Button variant="ghost" size="sm" onClick={prevMonth}>←</Button>
        <span className="text-sm font-semibold">{MONTHS_RU[month]} {year}</span>
        <Button variant="ghost" size="sm" onClick={nextMonth}>→</Button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center">
        {WEEKDAYS_RU.map((wd) => (
          <div key={wd} className="text-xs text-muted-foreground font-medium py-1">{wd}</div>
        ))}
        {cells.map((day, i) => {
          if (day === null) return <div key={`empty-${i}`} />;
          const key = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const count = countByDate[key] || 0;
          const isSelected = selectedDate === key;
          return (
            <button
              key={key}
              onClick={() => onSelectDate(isSelected ? null : key)}
              className={`relative rounded-md p-1 text-xs transition-colors
                ${count > 0 ? "hover:bg-primary/20 cursor-pointer" : "text-muted-foreground/50 cursor-default"}
                ${isSelected ? "bg-primary text-primary-foreground" : ""}
              `}
            >
              {day}
              {count > 0 && (
                <span className={`absolute -top-1 -right-1 min-w-[16px] h-4 rounded-full text-[10px] font-bold flex items-center justify-center px-0.5
                  ${isSelected ? "bg-primary-foreground text-primary" : "bg-primary text-primary-foreground"}
                `}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>
      {selectedDate && (
        <div className="mt-2 text-center">
          <Button variant="ghost" size="sm" onClick={() => onSelectDate(null)} className="text-xs text-muted-foreground">
            Сбросить фильтр
          </Button>
        </div>
      )}
    </div>
  );
}

export default function HistoryPage() {
  const { calculations, loading } = useCalculations();
  const [search, setSearch] = useState("");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");

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
            <CalendarView countByDate={countByDate} selectedDate={selectedDate} onSelectDate={setSelectedDate} />
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
                    <span className="font-medium">{formatPrice(calc.result.totalPrice)} ₽</span>
                  </div>
                  {calc.result.supportPrice > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Кронштейн</span>
                      <span>{formatPrice(calc.result.supportPrice)} ₽</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Монтаж</span>
                    <span>{formatPrice(calc.result.installationPrice)} ₽</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
