import { useState } from "react";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckCircle2, Circle } from "lucide-react";

const CHECKLIST_SECTIONS = [
  {
    title: "База данных",
    items: [
      "Таблица clients: все поля из ТЗ",
      "Таблица leads: все поля",
      "Таблица orders: номер, type, status, RLS",
      "Таблица order_items: связь с orders и variants",
      "Справочники dictionary_items заполнены",
      "system_settings: warranty=12, discount_threshold=15",
      "Функция is_admin() работает",
      "Функция recalculate_order_totals() работает",
      "Функция calculate_warranty_months() работает",
    ],
  },
  {
    title: "Интерфейс",
    items: [
      'Вкладка "Лиды": таблица, фильтрация, поиск',
      "Карточка лида: детали, смена статуса, конвертация",
      'Вкладка "Заказы": таблица, фильтрация, статистика',
      "Форма заказа: выбор клиента, типа, доставки",
      'Вкладка "Клиенты": расширенная форма',
      'Вкладка "Воронка": Kanban-доска',
      'Вкладка "Задачи": список задач',
    ],
  },
  {
    title: "Бизнес-логика",
    items: [
      "Конвертация лида в заказ работает",
      "Позиции заказа: автопересчёт суммы",
      "Скидка >15% → статус pending_approval",
      "Гарантия: из товара или 12 месяцев",
      "Комиссия агента: расчёт при создании",
      "RLS: менеджер видит только свои заказы",
    ],
  },
  {
    title: "Документы",
    items: [
      "Генерация счёта: HTML с реквизитами",
      "Генерация гарантии: HTML с сроком",
      "Переменные шаблонов: order, client, items",
    ],
  },
];

export default function AdminChecklistPage() {
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [acceptDate, setAcceptDate] = useState("");
  const [acceptedBy, setAcceptedBy] = useState("");
  const [status, setStatus] = useState<string | null>(null);

  const totalItems = CHECKLIST_SECTIONS.reduce((sum, s) => sum + s.items.length, 0);
  const checkedCount = Object.values(checkedItems).filter(Boolean).length;
  const progress = totalItems > 0 ? (checkedCount / totalItems) * 100 : 0;

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <h1 className="text-2xl font-light text-foreground tracking-tight">
          Приёмка модуля «Продажи»
        </h1>

        {/* Progress */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Прогресс</span>
              <span className="text-sm font-medium">
                {checkedCount}/{totalItems}
              </span>
            </div>
            <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Sections */}
        {CHECKLIST_SECTIONS.map((section, si) => (
          <Card key={si}>
            <CardContent className="pt-6">
              <h2 className="text-base font-medium mb-4">{section.title}</h2>
              <div className="space-y-2">
                {section.items.map((item, ii) => {
                  const key = `${si}-${ii}`;
                  const checked = checkedItems[key] || false;
                  return (
                    <div
                      key={key}
                      className="flex items-center gap-3 p-2 rounded-md cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() =>
                        setCheckedItems((prev) => ({ ...prev, [key]: !checked }))
                      }
                    >
                      {checked ? (
                        <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                      ) : (
                        <Circle className="w-5 h-5 text-muted-foreground/40 shrink-0" />
                      )}
                      <span
                        className={`text-sm ${checked ? "line-through text-muted-foreground" : "text-foreground"}`}
                      >
                        {item}
                      </span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Finalization */}
        <Card>
          <CardContent className="pt-6 space-y-4">
            <h2 className="text-base font-medium">Финализация</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">Дата приёмки</label>
                <Input
                  type="date"
                  value={acceptDate}
                  onChange={(e) => setAcceptDate(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">Принял</label>
                <Input
                  placeholder="ФИО"
                  value={acceptedBy}
                  onChange={(e) => setAcceptedBy(e.target.value)}
                />
              </div>
            </div>
            <div className="flex gap-2">
              {["Принято", "Требует доработки", "Отклонено"].map((s) => (
                <Badge
                  key={s}
                  variant={status === s ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => setStatus(s)}
                >
                  {s}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
