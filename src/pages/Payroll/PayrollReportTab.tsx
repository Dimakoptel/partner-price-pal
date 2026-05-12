import { useMemo, useState } from "react";
import { useTimesheets } from "@/hooks/usePayroll";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Printer } from "lucide-react";

const fmtRub = (n: number) =>
  new Intl.NumberFormat("ru-RU", { style: "currency", currency: "RUB", maximumFractionDigits: 0 }).format(n);

export default function PayrollReportTab() {
  const now = new Date();
  const defaultMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const [period, setPeriod] = useState(defaultMonth);
  const { data: timesheets = [], isLoading } = useTimesheets(period);

  const rows = useMemo(() => {
    const map = new Map<string, { name: string; rate: number; hours: number; total: number }>();
    for (const t of timesheets) {
      if (!t.employees) continue;
      const key = t.employee_id;
      const effHours = Number(t.hours_worked) * Number(t.coefficient);
      const sum = effHours * Number(t.employees.hourly_rate);
      const cur = map.get(key) || { name: t.employees.name, rate: Number(t.employees.hourly_rate), hours: 0, total: 0 };
      cur.hours += effHours;
      cur.total += sum;
      map.set(key, cur);
    }
    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }, [timesheets]);

  const grandTotal = rows.reduce((s, r) => s + r.total, 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between print:hidden">
        <div>
          <Label>Период (месяц)</Label>
          <Input type="month" value={period} onChange={(e) => setPeriod(e.target.value)} className="w-48" />
        </div>
        <Button onClick={() => window.print()} variant="outline">
          <Printer className="mr-2 h-4 w-4" /> Печать
        </Button>
      </div>

      <div className="print:block hidden text-center mb-4">
        <h2 className="text-xl font-semibold">Отчёт по заработной плате — {period}</h2>
      </div>

      <Card className="bg-primary text-primary-foreground">
        <CardContent className="p-6 flex items-center justify-between">
          <div className="text-sm uppercase opacity-80">Итого к выплате</div>
          <div className="text-3xl font-bold">{fmtRub(grandTotal)}</div>
        </CardContent>
      </Card>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Сотрудник</TableHead>
              <TableHead className="text-right">Ставка ₽/час</TableHead>
              <TableHead className="text-right">Часы (с коэф.)</TableHead>
              <TableHead className="text-right">Сумма</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">Загрузка…</TableCell></TableRow>
            ) : rows.length === 0 ? (
              <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">Нет данных за период</TableCell></TableRow>
            ) : rows.map((r, i) => (
              <TableRow key={i}>
                <TableCell className="font-medium">{r.name}</TableCell>
                <TableCell className="text-right">{fmtRub(r.rate)}</TableCell>
                <TableCell className="text-right">{r.hours.toFixed(2)}</TableCell>
                <TableCell className="text-right font-semibold">{fmtRub(r.total)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
          {rows.length > 0 && (
            <TableFooter>
              <TableRow>
                <TableCell colSpan={3} className="font-semibold">Итого</TableCell>
                <TableCell className="text-right font-bold">{fmtRub(grandTotal)}</TableCell>
              </TableRow>
            </TableFooter>
          )}
        </Table>
      </div>
    </div>
  );
}
