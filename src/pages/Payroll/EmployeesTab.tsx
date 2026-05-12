import { useState, useMemo } from "react";
import { useEmployees, useUpsertEmployee, useDeleteEmployee, type Employee } from "@/hooks/usePayroll";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2, Save } from "lucide-react";
import { toast } from "sonner";

const SKILL_LABELS: Record<string, string> = {
  junior: "Junior",
  middle: "Middle",
  senior: "Senior",
  master: "Мастер",
};

export default function EmployeesTab() {
  const { data: employees = [], isLoading } = useEmployees(true);
  const upsert = useUpsertEmployee();
  const del = useDeleteEmployee();

  const [search, setSearch] = useState("");
  const [skillFilter, setSkillFilter] = useState<string>("all");
  const [editing, setEditing] = useState<Record<string, number>>({});
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<Partial<Employee>>({ hourly_rate: 500, skill_level: "middle", is_active: true });

  const filtered = useMemo(() => {
    return employees.filter((e) => {
      const matchSearch = e.name.toLowerCase().includes(search.toLowerCase());
      const matchSkill = skillFilter === "all" || e.skill_level === skillFilter;
      return matchSearch && matchSkill;
    });
  }, [employees, search, skillFilter]);

  const handleRateChange = (id: string, val: string) => {
    const n = Number(val);
    setEditing((prev) => ({ ...prev, [id]: n }));
  };

  const handleSaveRate = async (emp: Employee) => {
    const newRate = editing[emp.id];
    if (newRate === undefined || newRate === emp.hourly_rate) return;
    if (newRate < 500) {
      toast.error("Ставка не может быть меньше 500₽");
      return;
    }
    try {
      await upsert.mutateAsync({ id: emp.id, name: emp.name, hourly_rate: newRate });
      toast.success("Ставка сохранена");
      setEditing((prev) => {
        const c = { ...prev };
        delete c[emp.id];
        return c;
      });
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleCreate = async () => {
    if (!form.name || !form.hourly_rate || form.hourly_rate < 500) {
      toast.error("Заполните имя и ставку (≥500₽)");
      return;
    }
    try {
      await upsert.mutateAsync({
        name: form.name,
        position: form.position || null,
        hourly_rate: form.hourly_rate,
        skill_level: (form.skill_level as any) || null,
        is_active: true,
      });
      toast.success("Сотрудник добавлен");
      setDialogOpen(false);
      setForm({ hourly_rate: 500, skill_level: "middle", is_active: true });
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Деактивировать сотрудника?")) return;
    await del.mutateAsync(id);
    toast.success("Сотрудник деактивирован");
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Input
            placeholder="Поиск по ФИО"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="sm:w-64"
          />
          <Select value={skillFilter} onValueChange={setSkillFilter}>
            <SelectTrigger className="sm:w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все уровни</SelectItem>
              {Object.entries(SKILL_LABELS).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-1" />Добавить сотрудника</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Новый сотрудник</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>ФИО *</Label>
                <Input value={form.name || ""} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <Label>Должность</Label>
                <Input value={form.position || ""} onChange={(e) => setForm({ ...form, position: e.target.value })} />
              </div>
              <div>
                <Label>Ставка ₽/час *</Label>
                <Input type="number" min={500} value={form.hourly_rate || ""} onChange={(e) => setForm({ ...form, hourly_rate: Number(e.target.value) })} />
              </div>
              <div>
                <Label>Уровень</Label>
                <Select value={form.skill_level || "middle"} onValueChange={(v) => setForm({ ...form, skill_level: v as any })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(SKILL_LABELS).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Отмена</Button>
              <Button onClick={handleCreate}>Сохранить</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ФИО</TableHead>
              <TableHead>Должность</TableHead>
              <TableHead>Уровень</TableHead>
              <TableHead>Ставка ₽/час</TableHead>
              <TableHead>Статус</TableHead>
              <TableHead className="text-right">Действия</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">Загрузка…</TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">Сотрудников нет</TableCell></TableRow>
            ) : filtered.map((emp) => (
              <TableRow key={emp.id} className={!emp.is_active ? "opacity-50" : ""}>
                <TableCell className="font-medium">{emp.name}</TableCell>
                <TableCell>{emp.position || "—"}</TableCell>
                <TableCell>{emp.skill_level ? SKILL_LABELS[emp.skill_level] : "—"}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min={500}
                      className="w-28"
                      value={editing[emp.id] ?? emp.hourly_rate}
                      onChange={(e) => handleRateChange(emp.id, e.target.value)}
                    />
                    {editing[emp.id] !== undefined && editing[emp.id] !== emp.hourly_rate && (
                      <Button size="icon" variant="ghost" onClick={() => handleSaveRate(emp)}>
                        <Save className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </TableCell>
                <TableCell>{emp.is_active ? "Активен" : "Неактивен"}</TableCell>
                <TableCell className="text-right">
                  {emp.is_active && (
                    <Button size="icon" variant="ghost" onClick={() => handleDelete(emp.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
