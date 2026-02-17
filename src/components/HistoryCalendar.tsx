import { useState } from "react";
import { Button } from "@/components/ui/button";

const WEEKDAYS_RU = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
const MONTHS_RU = ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"];

interface Props {
  countByDate: Record<string, number>;
  selectedDate: string | null;
  onSelectDate: (d: string | null) => void;
}

export default function HistoryCalendar({ countByDate, selectedDate, onSelectDate }: Props) {
  const [viewDate, setViewDate] = useState(() => new Date());
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const firstDay = new Date(year, month, 1);
  const startWeekday = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (number | null)[] = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div className="glass-panel p-4">
      <div className="flex items-center justify-between mb-3">
        <Button variant="ghost" size="sm" onClick={() => setViewDate(new Date(year, month - 1, 1))}>←</Button>
        <span className="text-sm font-semibold">{MONTHS_RU[month]} {year}</span>
        <Button variant="ghost" size="sm" onClick={() => setViewDate(new Date(year, month + 1, 1))}>→</Button>
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
