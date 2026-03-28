import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { Tables } from "@/integrations/supabase/types";

export const APP_MODULES = [
  { key: "calculator", label: "Калькулятор столешниц" },
  { key: "box_calculator", label: "Калькулятор ящиков" },
  { key: "history", label: "История расчётов" },
  { key: "clients", label: "CRM / Клиенты" },
  { key: "sales_leads", label: "Продажи — Лиды" },
  { key: "sales_orders", label: "Продажи — Заказы" },
  { key: "sales_pipeline", label: "Продажи — Воронка" },
  { key: "sales_tasks", label: "Продажи — Задачи" },
  { key: "production", label: "Производство" },
  { key: "warehouse", label: "Склад" },
  { key: "docs", label: "Инструкция" },
] as const;

export type ModuleKey = (typeof APP_MODULES)[number]["key"];

type AccessGroup = Tables<"access_groups">;
type GroupPermission = Tables<"group_permissions">;

interface UserGroupAssignment {
  user_id: string;
  group_id: string;
}

export function usePermissions() {
  const { user, isAdmin } = useAuth();
  const [allowedModules, setAllowedModules] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    if (isAdmin) {
      setAllowedModules(new Set(APP_MODULES.map(m => m.key)));
      setLoading(false);
      return;
    }

    const fetch = async () => {
      const { data: assignments } = await supabase
        .from("user_group_assignments")
        .select("group_id")
        .eq("user_id", user.id);

      if (!assignments || assignments.length === 0) {
        setAllowedModules(new Set());
        setLoading(false);
        return;
      }

      const groupIds = assignments.map(a => a.group_id);

      const { data: perms } = await supabase
        .from("group_permissions")
        .select("module, allowed")
        .in("group_id", groupIds)
        .eq("allowed", true);

      const modules = new Set<string>();
      if (perms) {
        perms.forEach((p) => { if (p.allowed) modules.add(p.module); });
      }
      setAllowedModules(modules);
      setLoading(false);
    };

    fetch();
  }, [user, isAdmin]);

  const hasAccess = (module: ModuleKey): boolean => {
    if (isAdmin) return true;
    return allowedModules.has(module);
  };

  return { hasAccess, allowedModules, loading };
}

// Hook for admin to manage groups
export function useAccessGroups() {
  const [groups, setGroups] = useState<AccessGroup[]>([]);
  const [permissions, setPermissions] = useState<GroupPermission[]>([]);
  const [assignments, setAssignments] = useState<UserGroupAssignment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = async () => {
    setLoading(true);
    const [g, p, a] = await Promise.all([
      supabase.from("access_groups").select("*").order("created_at"),
      supabase.from("group_permissions").select("*"),
      supabase.from("user_group_assignments").select("*"),
    ]);
    if (g.data) setGroups(g.data);
    if (p.data) setPermissions(p.data);
    if (a.data) setAssignments(a.data as UserGroupAssignment[]);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const createGroup = async (name: string, description: string) => {
    const { data, error } = await supabase
      .from("access_groups")
      .insert({ name, description })
      .select()
      .single();
    if (!error && data) {
      setGroups(prev => [...prev, data]);
    }
    return { data, error };
  };

  const deleteGroup = async (groupId: string) => {
    const { error } = await supabase.from("access_groups").delete().eq("id", groupId);
    if (!error) {
      setGroups(prev => prev.filter(g => g.id !== groupId));
      setPermissions(prev => prev.filter(p => p.group_id !== groupId));
      setAssignments(prev => prev.filter(a => a.group_id !== groupId));
    }
    return { error };
  };

  const setPermission = async (groupId: string, module: string, allowed: boolean) => {
    const { error } = await supabase
      .from("group_permissions")
      .upsert({ group_id: groupId, module, allowed }, { onConflict: "group_id,module" });
    if (!error) {
      setPermissions(prev => {
        const filtered = prev.filter(p => !(p.group_id === groupId && p.module === module));
        return [...filtered, { group_id: groupId, module, allowed, id: "" }];
      });
    }
    return { error };
  };

  const assignUser = async (userId: string, groupId: string) => {
    const { error } = await supabase
      .from("user_group_assignments")
      .insert({ user_id: userId, group_id: groupId });
    if (!error) {
      setAssignments(prev => [...prev, { user_id: userId, group_id: groupId }]);
    }
    return { error };
  };

  const removeUser = async (userId: string, groupId: string) => {
    const { error } = await supabase
      .from("user_group_assignments")
      .delete()
      .eq("user_id", userId)
      .eq("group_id", groupId);
    if (!error) {
      setAssignments(prev => prev.filter(a => !(a.user_id === userId && a.group_id === groupId)));
    }
    return { error };
  };

  const getGroupPermissions = (groupId: string): Record<string, boolean> => {
    const result: Record<string, boolean> = {};
    APP_MODULES.forEach(m => { result[m.key] = false; });
    permissions
      .filter(p => p.group_id === groupId)
      .forEach(p => { result[p.module] = p.allowed; });
    return result;
  };

  const getUserGroups = (userId: string) => {
    return assignments.filter(a => a.user_id === userId).map(a => a.group_id);
  };

  return {
    groups, permissions, assignments, loading,
    createGroup, deleteGroup, setPermission,
    assignUser, removeUser, getGroupPermissions, getUserGroups,
    refetch: fetchAll,
  };
}
