import { useState } from "react";
import { useProductCategories, ProductCategory } from "@/hooks/useProductCategories";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Check, X } from "lucide-react";

export default function CategoriesTab() {
  const { categories, loading, addCategory, updateCategory, deleteCategory } = useProductCategories();
  const [newName, setNewName] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const handleAdd = async () => {
    if (!newName.trim()) return;
    const maxOrder = categories.reduce((m, c) => Math.max(m, c.sort_order), 0);
    const { error } = await addCategory(newName.trim(), maxOrder + 1);
    if (error) toast.error("Ошибка добавления");
    else { toast.success("Категория добавлена"); setNewName(""); }
  };

  const handleSaveEdit = async () => {
    if (!editId || !editName.trim()) return;
    const { error } = await updateCategory(editId, { name: editName.trim() });
    if (error) toast.error("Ошибка");
    else { toast.success("Обновлено"); setEditId(null); }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Удалить категорию "${name}"?`)) return;
    const { error } = await deleteCategory(id);
    if (error) toast.error("Ошибка удаления");
    else toast.success("Удалено");
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2 max-w-md">
        <Input
          placeholder="Новая категория..."
          value={newName}
          onChange={e => setNewName(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleAdd()}
        />
        <Button onClick={handleAdd} disabled={!newName.trim()} className="gap-1.5">
          <Plus className="w-4 h-4" /> Добавить
        </Button>
      </div>

      <div className="border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="text-xs">Название</TableHead>
              <TableHead className="text-xs w-24 text-center">Активна</TableHead>
              <TableHead className="text-xs w-20"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={3} className="text-center py-6 text-muted-foreground">Загрузка...</TableCell></TableRow>
            ) : categories.length === 0 ? (
              <TableRow><TableCell colSpan={3} className="text-center py-6 text-muted-foreground">Нет категорий</TableCell></TableRow>
            ) : categories.map(cat => (
              <TableRow key={cat.id}>
                <TableCell>
                  {editId === cat.id ? (
                    <div className="flex gap-1.5">
                      <Input value={editName} onChange={e => setEditName(e.target.value)} className="h-8 text-sm"
                        onKeyDown={e => e.key === "Enter" && handleSaveEdit()} autoFocus />
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleSaveEdit}><Check className="w-3.5 h-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditId(null)}><X className="w-3.5 h-3.5" /></Button>
                    </div>
                  ) : (
                    <span className="text-sm">{cat.name}</span>
                  )}
                </TableCell>
                <TableCell className="text-center">
                  <Switch checked={cat.is_active} onCheckedChange={v => updateCategory(cat.id, { is_active: v })} />
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditId(cat.id); setEditName(cat.name); }}>
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(cat.id, cat.name)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
