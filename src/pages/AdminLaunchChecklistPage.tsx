import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Circle, Download } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const CHECKLIST_SECTIONS = [
  {
    title: "Подготовка",
    items: [
      "Миграции применены в Supabase",
      "Справочники заполнены (статусы, типы, этапы)",
      "system_settings загружены с начальными значениями",
      "Edge Functions развёрнуты",
      "RLS-политики проверены",
      "Создан пользователь с ролью admin",
    ],
  },
  {
    title: "Тестирование",
    items: [
      "Создан тестовый клиент-агент с комиссией",
      "Создан лид и конвертирован в заказ",
      "Позиции заказа добавляются и удаляются",
      "Сумма заказа пересчитывается автоматически",
      "Скидка >15% требует согласования",
      "Счёт на оплату генерируется (HTML)",
      "Гарантийный талон генерируется",
      "Комиссия агента создаётся со статусом reserved",
      "Резервирование товаров работает",
    ],
  },
  {
    title: "Интеграции",
    items: [
      "Webhook WordPress создаёт лид",
      "Очередь 1С отображается на /admin/integrations",
      "Кнопка Retry для ошибок работает",
    ],
  },
  {
    title: "Производство",
    items: [
      "Производственный заказ создаётся из заказа продаж",
      "Этапы производства создаются из справочника",
      "Завершение производства обновляет статус заказа",
    ],
  },
  {
    title: "Документация",
    items: [
      "KNOWLEDGE.md актуален",
      "docs/SALES_MODULE.md создан",
      "docs/LAUNCH_CHECKLIST.md создан",
    ],
  },
  {
    title: "Готовность команды",
    items: [
      "Менеджеры обучены работе с модулем",
      "Ответственные назначены",
      "Чат поддержки создан",
    ],
  },
];

export default function AdminLaunchChecklistPage() {
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});

  const totalItems = CHECKLIST_SECTIONS.reduce(
    (sum, s) => sum + s.items.length,
    0
  );
  const checkedCount = Object.values(checkedItems).filter(Boolean).length;
  const progress = totalItems > 0 ? (checkedCount / totalItems) * 100 : 0;

  const toggleItem = (key: string) => {
    setCheckedItems((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleExport = () => {
    const report = CHECKLIST_SECTIONS.map(
      (section) =>
        `## ${section.title}\n` +
        section.items
          .map(
            (item, i) =>
              `  [${checkedItems[`${section.title}-${i}`] ? "x" : " "}] ${item}`
          )
          .join("\n")
    ).join("\n\n");

    const blob = new Blob(
      [`# Чек-лист запуска: Модуль Продажи\n\nДата: ${new Date().toLocaleDateString("ru-RU")}\nГотовность: ${checkedCount}/${totalItems} (${Math.round(progress)}%)\n\n${report}\n`],
      { type: "text/plain" }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "launch-checklist.txt";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Чек-лист экспортирован");
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Запуск модуля Продажи</h1>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="w-4 h-4 mr-1" /> Экспорт
          </Button>
        </div>

        {/* Progress */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Готовность</span>
              <span className="text-sm text-muted-foreground">
                {checkedCount}/{totalItems} ({Math.round(progress)}%)
              </span>
            </div>
            <Progress value={progress} className="h-3" />
          </CardContent>
        </Card>

        {/* Sections */}
        {CHECKLIST_SECTIONS.map((section) => (
          <Card key={section.title}>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">{section.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {section.items.map((item, i) => {
                  const key = `${section.title}-${i}`;
                  const isChecked = !!checkedItems[key];
                  return (
                    <div
                      key={key}
                      className="flex items-center gap-3 py-1.5 px-2 rounded-md cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => toggleItem(key)}
                    >
                      {isChecked ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                      ) : (
                        <Circle className="h-5 w-5 text-muted-foreground shrink-0" />
                      )}
                      <span
                        className={`text-sm ${isChecked ? "line-through text-muted-foreground" : ""}`}
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
          <CardHeader>
            <CardTitle className="text-lg">Финализация запуска</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs">Дата запуска</Label>
                <Input type="date" />
              </div>
              <div>
                <Label className="text-xs">Ответственный</Label>
                <Input placeholder="ФИО" />
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button variant="default" size="sm">Готов к запуску</Button>
              <Button variant="outline" size="sm">Требует доработки</Button>
              <Button variant="ghost" size="sm">Отложен</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
