import { useState } from "react";
import { useEmployees, useOperations, useTimesheets, useCreateTimesheet, useDeleteTimesheet } from "@/hooks/usePayroll";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

const COEF_OPTIONS = [
  { value: "0", label: "0 — отсутствие" },
  { value: "1", label: "1.0 — обычные" },
  { value: "1.5", label: "1.5 — переработка" },
];

export default function TimesheetsTab() {
  const { data: employees = [] } = useEmployees();
  const { data: operations = [] } = useOperations();
  const { data: timesheets = [], isLoading } = useTimesheets();
  const create = useCreateTimesheet();
  const del = useDeleteTimesheet();

  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState({
    employee_id: "",
    operation_id: "",
    order_id: "",
    work_date: today,
    hours_worked: "",
    coefficient: "1",
    comment: "",
  });

  const handleSubmit = async () => {
    if (!form.employee_id || !form.work_date || !form.hours_worked) {
      toast.error("Заполните сотрудника, дату и часы");
      return;
    }
    const hours = Number(form.hours_worked);
    if (hours <= 0) {
      toast.error("Часы должны быть больше 0");
      return;
    }
    try {
      await create.mutateAsync({
        employee_id: form.employee_id,
        operation_id: form.operation_id || null,
        order_id: form.order_id || null,
        work_date: form.work_date,
        hours_worked: hours,
        coefficient: Number(form.coefficient),
        comment: form.comment || null,
      });
      toast.success("Запись добавлена");
      setForm({ ...form, hours_worked: "", order_id: "", comment: "" });
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-4">
          <div>
            <Label>Сотрудник *</Label>
            <Select value={form.employee_id} onValueChange={(v) => setForm({ ...form, employee_id: v })}>
              <SelectTrigger><SelectValue placeholder="Выберите" /></SelectTrigger>
              <SelectContent>
                {employees.map((e) => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Операция</Label>
            <Select value={form.operation_id} onValueChange={(v) => setForm({ ...form, operation_id: v })}>
              <SelectTrigger><SelectValue placeholder="Выберите" /></SelectTrigger>
              <SelectContent>
                {operations.map((o) => <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Заказ</Label>
            <Input value={form.order_id} onChange={(e) => setForm({ ...form, order_id: e.target.value })} placeholder="Номер" />
          </div>
          <div>
            <Label>Дата *</Label>
            <Input type="date" value={form.work_date} onChange={(e) => setForm({ ...form, work_date: e.target.value })} />
          </div>
          <div>
            <Label>Часы *</Label>
            <Input type="number" step="0.25" min="0.25" value={form.hours_worked} onChange={(e) => setForm({ ...form, hours_worked: e.target.value })} />
          </div>
          <div>
            <Label>Коэффициент</Label>
            <Select value={form.coefficient} onValueChange={(v) => setForm({ ...form, coefficient: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {COEF_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="md:col-span-2">
            <Label>Комментарий</Label>
            <Input value={form.comment} onChange={(e) => setForm({ ...form, comment: e.target.value })} />
          </div>
          <div className="flex items-end">
            <Button onClick={handleSubmit} className="w-full">Добавить запись</Button>
          </div>
        </div>
      </Card>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Дата</TableHead>
              <TableHead>Сотрудник</TableHead>
              <TableHead>Операция</TableHead>
              <TableHead>Заказ</TableHead>
              <TableHead>Часы</TableHead>
              <TableHead>Коэф.</TableHead>
              <TableHead>Комментарий</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground">Загрузка…</TableCell></TableRow>
            ) : timesheets.length === 0 ? (
              <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground">Записей нет</TableCell></TableRow>
            ) : timesheets.map((t) => (
              <TableRow key={t.id}>
                <TableCell>{t.work_date}</TableCell>
                <TableCell>{t.employees?.name || "—"}</TableCell>
                <TableCell>{t.operations?.name || "—"}</TableCell>
                <TableCell>{t.order_id || "—"}</TableCell>
                <TableCell>{t.hours_worked}</TableCell>
                <TableCell>{t.coefficient}</TableCell>
                <TableCell className="max-w-xs truncate">{t.comment || "—"}</TableCell>
                <TableCell>
                  <Button size="icon" variant="ghost" onClick={() => del.mutate(t.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
