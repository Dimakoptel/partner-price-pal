import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { CheckCircle, XCircle, Search, UserCheck, Clock, Pencil, Save, X } from "lucide-react";

interface UserProfile {
  id: string;
  user_id: string;
  full_name: string | null;
  phone: string | null;
  telegram: string | null;
  is_approved: boolean;
  created_at: string;
}

export default function UsersTab() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("id, user_id, full_name, phone, telegram, is_approved, created_at")
      .order("created_at", { ascending: false });
    if (!error && data) setUsers(data);
    setLoading(false);
  };

  useEffect(() => { fetchUsers(); }, []);

  const toggleApproval = async (userId: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from("profiles")
      .update({ is_approved: !currentStatus })
      .eq("user_id", userId);
    if (error) {
      toast.error("Ошибка обновления");
    } else {
      setUsers(prev => prev.map(u => u.user_id === userId ? { ...u, is_approved: !currentStatus } : u));
      toast.success(!currentStatus ? "Пользователь одобрен" : "Доступ отозван");
    }
  };

  const updateName = async (userId: string, newName: string) => {
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: newName })
      .eq("user_id", userId);
    if (error) {
      toast.error("Ошибка обновления имени");
    } else {
      setUsers(prev => prev.map(u => u.user_id === userId ? { ...u, full_name: newName } : u));
      toast.success("Имя обновлено");
    }
  };

  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    return !q || (u.full_name?.toLowerCase().includes(q) || u.phone?.includes(q) || u.telegram?.toLowerCase().includes(q));
  });

  const pending = filtered.filter(u => !u.is_approved);
  const approved = filtered.filter(u => u.is_approved);

  if (loading) return <div className="text-center py-8 text-muted-foreground">Загрузка...</div>;

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Поиск по имени, телефону, telegram..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-10 bg-secondary border-border"
        />
      </div>

      {pending.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-1.5">
            <Clock className="w-4 h-4" /> Ожидают одобрения ({pending.length})
          </h3>
          <div className="space-y-2">
            {pending.map(u => (
              <UserRow key={u.id} user={u} onToggle={toggleApproval} onUpdateName={updateName} />
            ))}
          </div>
        </div>
      )}

      <div>
        <h3 className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-1.5">
          <UserCheck className="w-4 h-4" /> Активные пользователи ({approved.length})
        </h3>
        {approved.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">Нет активных пользователей</p>
        ) : (
          <div className="space-y-2">
            {approved.map(u => (
              <UserRow key={u.id} user={u} onToggle={toggleApproval} onUpdateName={updateName} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function UserRow({ user, onToggle, onUpdateName }: { user: UserProfile; onToggle: (userId: string, status: boolean) => void; onUpdateName: (userId: string, name: string) => Promise<void> }) {
  const [editing, setEditing] = useState(false);
  const [nameValue, setNameValue] = useState(user.full_name || "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!nameValue.trim()) return;
    setSaving(true);
    await onUpdateName(user.user_id, nameValue.trim());
    setSaving(false);
    setEditing(false);
  };

  const handleCancel = () => {
    setNameValue(user.full_name || "");
    setEditing(false);
  };

  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 border border-border/50">
      <div className="min-w-0 flex-1">
        {editing ? (
          <div className="flex items-center gap-1.5">
            <Input
              value={nameValue}
              onChange={e => setNameValue(e.target.value)}
              className="h-7 text-sm bg-background border-border"
              autoFocus
              onKeyDown={e => { if (e.key === "Enter") handleSave(); if (e.key === "Escape") handleCancel(); }}
            />
            <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0" onClick={handleSave} disabled={saving}>
              <Save className="w-3.5 h-3.5" />
            </Button>
            <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0" onClick={handleCancel}>
              <X className="w-3.5 h-3.5" />
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-1.5">
            <p className="font-medium text-sm truncate">{user.full_name || "Без имени"}</p>
            <Button size="icon" variant="ghost" className="h-6 w-6 shrink-0 text-muted-foreground hover:text-foreground" onClick={() => setEditing(true)}>
              <Pencil className="w-3 h-3" />
            </Button>
          </div>
        )}
        <div className="flex gap-3 text-xs text-muted-foreground mt-0.5">
          {user.phone && <span>📞 {user.phone}</span>}
          {user.telegram && <span>TG: {user.telegram}</span>}
        </div>
        <p className="text-[10px] text-muted-foreground mt-0.5">
          {new Date(user.created_at).toLocaleDateString("ru-RU")}
        </p>
      </div>
      <Button
        size="sm"
        variant={user.is_approved ? "outline" : "default"}
        onClick={() => onToggle(user.user_id, user.is_approved)}
        className="gap-1.5 shrink-0 ml-2"
      >
        {user.is_approved ? (
          <><XCircle className="w-4 h-4" /> Отозвать</>
        ) : (
          <><CheckCircle className="w-4 h-4" /> Одобрить</>
        )}
      </Button>
    </div>
  );
}
