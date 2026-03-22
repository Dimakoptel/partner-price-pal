import { useState } from "react";
import { useAccessGroups, APP_MODULES } from "@/hooks/usePermissions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Plus, Trash2, Shield, Pencil, Check, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export default function AccessGroupsTab() {
  const {
    groups, loading, createGroup, deleteGroup,
    setPermission, getGroupPermissions, refetch,
  } = useAccessGroups();

  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [creating, setCreating] = useState(false);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    const { error } = await createGroup(newName.trim(), newDesc.trim());
    if (error) {
      toast.error("Ошибка создания группы");
    } else {
      toast.success("Группа создана");
      setNewName("");
      setNewDesc("");
    }
    setCreating(false);
  };

  const handleDelete = async (groupId: string, name: string) => {
    if (!confirm(`Удалить группу "${name}"? Все пользователи будут отвязаны.`)) return;
    const { error } = await deleteGroup(groupId);
    if (error) toast.error("Ошибка удаления");
    else toast.success("Группа удалена");
  };

  const handleToggle = async (groupId: string, module: string, current: boolean) => {
    const { error } = await setPermission(groupId, module, !current);
    if (error) toast.error("Ошибка обновления");
  };

  const startEdit = (group: { id: string; name: string; description: string }) => {
    setEditingGroupId(group.id);
    setEditName(group.name);
    setEditDesc(group.description || "");
  };

  const handleSaveEdit = async () => {
    if (!editingGroupId || !editName.trim()) return;
    const { error } = await (supabase
      .from("access_groups") as any)
      .update({ name: editName.trim(), description: editDesc.trim() })
      .eq("id", editingGroupId);
    if (error) {
      toast.error("Ошибка обновления");
    } else {
      toast.success("Группа обновлена");
      setEditingGroupId(null);
      refetch();
    }
  };

  if (loading) return <div className="text-center py-8 text-muted-foreground">Загрузка...</div>;

  return (
    <div className="space-y-6">
      {/* Create new group */}
      <div className="p-4 rounded-lg bg-secondary/50 border border-border/50 space-y-3">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Plus className="w-4 h-4" /> Новая группа доступа
        </h3>
        <div className="flex gap-2">
          <Input
            placeholder="Название (напр. Менеджер)"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            className="bg-background border-border"
          />
          <Input
            placeholder="Описание (необязательно)"
            value={newDesc}
            onChange={e => setNewDesc(e.target.value)}
            className="bg-background border-border"
          />
          <Button onClick={handleCreate} disabled={creating || !newName.trim()} className="shrink-0">
            Создать
          </Button>
        </div>
      </div>

      {/* Groups list */}
      {groups.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">
          Нет групп доступа. Создайте первую группу выше.
        </p>
      ) : (
        <div className="space-y-4">
          {groups.map(group => {
            const perms = getGroupPermissions(group.id);
            const isEditing = editingGroupId === group.id;
            return (
              <div key={group.id} className="p-4 rounded-lg bg-secondary/50 border border-border/50">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    {isEditing ? (
                      <div className="flex items-center gap-2">
                        <Input
                          value={editName}
                          onChange={e => setEditName(e.target.value)}
                          className="h-8 text-sm bg-background border-border"
                          autoFocus
                        />
                        <Input
                          value={editDesc}
                          onChange={e => setEditDesc(e.target.value)}
                          placeholder="Описание"
                          className="h-8 text-sm bg-background border-border"
                        />
                        <Button variant="ghost" size="sm" onClick={handleSaveEdit} className="shrink-0 h-8 w-8 p-0">
                          <Check className="w-4 h-4 text-primary" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setEditingGroupId(null)} className="shrink-0 h-8 w-8 p-0">
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <>
                        <h3 className="font-semibold flex items-center gap-2">
                          <Shield className="w-4 h-4 text-primary" />
                          {group.name}
                        </h3>
                        {group.description && (
                          <p className="text-xs text-muted-foreground mt-0.5">{group.description}</p>
                        )}
                      </>
                    )}
                  </div>
                  {!isEditing && (
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => startEdit(group)}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(group.id, group.name)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {APP_MODULES.map(mod => (
                    <div
                      key={mod.key}
                      className="flex items-center justify-between p-2 rounded bg-background/50 border border-border/30"
                    >
                      <span className="text-sm">{mod.label}</span>
                      <Switch
                        checked={perms[mod.key] || false}
                        onCheckedChange={() => handleToggle(group.id, mod.key, perms[mod.key] || false)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
