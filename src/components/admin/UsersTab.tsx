import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { CheckCircle, XCircle, Search, UserCheck, Clock, Pencil, Save, X, Shield, UserPlus, Trash2 } from "lucide-react";
import { useAccessGroups } from "@/hooks/usePermissions";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

const PENDING_ROLE_LABELS: Record<string, string> = {
  staff: "Сотрудник",
  dealer: "Дилер",
  agent: "Агент",
  designer: "Дизайнер",
  client: "Клиент",
  manager: "Менеджер",
};

interface UserProfile {
  id: string;
  user_id: string;
  full_name: string | null;
  phone: string | null;
  telegram: string | null;
  city: string | null;
  is_approved: boolean;
  created_at: string;
  pending_role: string | null;
}

export default function UsersTab() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const accessGroups = useAccessGroups();
  const [editUser, setEditUser] = useState<UserProfile | null>(null);
  const [deleteUser, setDeleteUser] = useState<UserProfile | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("id, user_id, full_name, phone, telegram, city, is_approved, created_at, pending_role")
      .order("created_at", { ascending: false });
    if (!error && data) setUsers(data as any);
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

  const confirmAsPartner = async (userId: string) => {
    const { error: roleError } = await supabase.from("user_roles").upsert(
      { user_id: userId, role: "partner" as any },
      { onConflict: "user_id,role" }
    );
    if (roleError) { toast.error("Ошибка назначения роли партнёра"); return; }
    const { error: approveError } = await supabase
      .from("profiles")
      .update({ is_approved: true } as any)
      .eq("user_id", userId);
    if (approveError) { toast.error("Ошибка одобрения"); return; }
    setUsers(prev => prev.map(u => u.user_id === userId ? { ...u, is_approved: true } : u));
    toast.success("Партнёр подтверждён и получил роль partner");
  };

  const handleDeleteUser = async () => {
    if (!deleteUser) return;
    setDeleting(true);
    try {
      const { data, error } = await supabase.functions.invoke("delete-user", {
        body: { user_id: deleteUser.user_id },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setUsers(prev => prev.filter(u => u.user_id !== deleteUser.user_id));
      toast.success("Пользователь удалён");
    } catch (err: any) {
      toast.error("Ошибка удаления: " + err.message);
    }
    setDeleting(false);
    setDeleteUser(null);
  };

  const handleSaveProfile = async (profile: UserProfile) => {
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: profile.full_name,
        phone: profile.phone,
        telegram: profile.telegram,
        city: (profile as any).city,
        pending_role: profile.pending_role,
        is_approved: profile.is_approved,
      } as any)
      .eq("user_id", profile.user_id);
    if (error) {
      toast.error("Ошибка сохранения");
    } else {
      setUsers(prev => prev.map(u => u.user_id === profile.user_id ? { ...u, ...profile } : u));
      toast.success("Профиль обновлён");
      setEditUser(null);
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
        <Input placeholder="Поиск по имени, телефону, telegram..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 bg-secondary border-border" />
      </div>

      {pending.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-1.5">
            <Clock className="w-4 h-4" /> Ожидают одобрения ({pending.length})
          </h3>
          <div className="space-y-2">
            {pending.map(u => (
              <UserRow key={u.id} user={u} onToggle={toggleApproval} onConfirmPartner={confirmAsPartner}
                onEdit={() => setEditUser(u)} onDelete={() => setDeleteUser(u)} accessGroups={accessGroups} />
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
              <UserRow key={u.id} user={u} onToggle={toggleApproval} onConfirmPartner={confirmAsPartner}
                onEdit={() => setEditUser(u)} onDelete={() => setDeleteUser(u)} accessGroups={accessGroups} />
            ))}
          </div>
        )}
      </div>

      {/* Edit Profile Dialog */}
      {editUser && (
        <EditProfileDialog user={editUser} onClose={() => setEditUser(null)} onSave={handleSaveProfile} />
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteUser} onOpenChange={(v) => { if (!v) setDeleteUser(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить пользователя?</AlertDialogTitle>
            <AlertDialogDescription>
              Пользователь <strong>{deleteUser?.full_name || "Без имени"}</strong> будет удалён безвозвратно.
              Все его данные (профиль, роли, группы доступа) будут потеряны.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteUser} disabled={deleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deleting ? "Удаление..." : "Удалить"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function EditProfileDialog({ user, onClose, onSave }: {
  user: UserProfile;
  onClose: () => void;
  onSave: (p: UserProfile) => Promise<void>;
}) {
  const [form, setForm] = useState({ ...user });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    setSaving(true);
    await onSave(form);
    setSaving(false);
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Редактирование профиля</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label className="text-xs">ФИО</Label>
            <Input value={form.full_name || ""} onChange={e => setForm(p => ({ ...p, full_name: e.target.value }))} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Телефон</Label>
            <Input value={form.phone || ""} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Telegram</Label>
            <Input value={form.telegram || ""} onChange={e => setForm(p => ({ ...p, telegram: e.target.value }))} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Тип аккаунта</Label>
            <Select value={form.pending_role || ""} onValueChange={v => setForm(p => ({ ...p, pending_role: v || null }))}>
              <SelectTrigger><SelectValue placeholder="Не указан" /></SelectTrigger>
              <SelectContent>
                {Object.entries(PENDING_ROLE_LABELS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="is_approved" checked={form.is_approved}
              onChange={e => setForm(p => ({ ...p, is_approved: e.target.checked }))}
              className="rounded border-border" />
            <Label htmlFor="is_approved" className="text-sm">Доступ одобрен</Label>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={onClose}>Отмена</Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? "Сохранение..." : "Сохранить"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function UserRow({ user, onToggle, onConfirmPartner, onEdit, onDelete, accessGroups }: {
  user: UserProfile;
  onToggle: (userId: string, status: boolean) => void;
  onConfirmPartner: (userId: string) => Promise<void>;
  onEdit: () => void;
  onDelete: () => void;
  accessGroups: ReturnType<typeof useAccessGroups>;
}) {
  const [confirmingPartner, setConfirmingPartner] = useState(false);
  const userGroupIds = accessGroups.getUserGroups(user.user_id);
  const isPartnerPending = user.pending_role && user.pending_role !== "staff" && !user.is_approved;

  const handleConfirmPartner = async () => {
    setConfirmingPartner(true);
    await onConfirmPartner(user.user_id);
    setConfirmingPartner(false);
  };

  const handleAssignGroup = async (groupId: string) => {
    const { error } = await accessGroups.assignUser(user.user_id, groupId);
    if (error) toast.error("Ошибка назначения группы");
    else toast.success("Группа назначена");
  };

  const handleRemoveGroup = async (groupId: string) => {
    const { error } = await accessGroups.removeUser(user.user_id, groupId);
    if (error) toast.error("Ошибка удаления группы");
    else toast.success("Группа убрана");
  };

  const availableGroups = accessGroups.groups.filter(g => !userGroupIds.includes(g.id));

  return (
    <div className="p-3 rounded-lg bg-secondary/50 border border-border/50 space-y-2">
      <div className="flex items-center justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <p className="font-medium text-sm truncate">{user.full_name || "Без имени"}</p>
          </div>
          <div className="flex gap-3 text-xs text-muted-foreground mt-0.5 flex-wrap">
            {user.phone && <span>📞 {user.phone}</span>}
            {user.telegram && <span>TG: {user.telegram}</span>}
            {user.pending_role && (
              <Badge variant={user.pending_role === "staff" ? "outline" : "default"} className="text-[10px] h-4">
                {PENDING_ROLE_LABELS[user.pending_role] || user.pending_role}
              </Badge>
            )}
          </div>
          <p className="text-[10px] text-muted-foreground mt-0.5">{new Date(user.created_at).toLocaleDateString("ru-RU")}</p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0 ml-2">
          {isPartnerPending && (
            <Button size="sm" variant="default" onClick={handleConfirmPartner} disabled={confirmingPartner} className="gap-1.5">
              <UserPlus className="w-4 h-4" /> Партнёр
            </Button>
          )}
          <Button size="sm" variant={user.is_approved ? "outline" : "default"} onClick={() => onToggle(user.user_id, user.is_approved)} className="gap-1.5">
            {user.is_approved ? <><XCircle className="w-4 h-4" /> Отозвать</> : <><CheckCircle className="w-4 h-4" /> Одобрить</>}
          </Button>
          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={onEdit} title="Редактировать">
            <Pencil className="w-3.5 h-3.5" />
          </Button>
          <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={onDelete} title="Удалить">
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Group assignments */}
      <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-border/30">
        <Shield className="w-3.5 h-3.5 text-muted-foreground" />
        {userGroupIds.length === 0 && <span className="text-xs text-muted-foreground">Нет группы</span>}
        {userGroupIds.map(gid => {
          const group = accessGroups.groups.find(g => g.id === gid);
          if (!group) return null;
          return (
            <Badge key={gid} variant="secondary" className="text-xs gap-1">
              {group.name}
              <button onClick={() => handleRemoveGroup(gid)} className="ml-0.5 hover:text-destructive"><X className="w-3 h-3" /></button>
            </Badge>
          );
        })}
        {availableGroups.length > 0 && (
          <Select onValueChange={handleAssignGroup}>
            <SelectTrigger className="h-6 w-auto min-w-[100px] text-xs bg-background border-border">
              <SelectValue placeholder="+ Группа" />
            </SelectTrigger>
            <SelectContent>
              {availableGroups.map(g => (
                <SelectItem key={g.id} value={g.id} className="text-xs">{g.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
    </div>
  );
}
