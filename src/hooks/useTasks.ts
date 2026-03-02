import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export interface Task {
  id: string;
  title: string;
  description: string | null;
  client_id: string | null;
  deal_id: string | null;
  assigned_to: string;
  created_by: string;
  status: string;
  priority: string;
  due_date: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  client?: { id: string; name: string } | null;
  deal?: { id: string; title: string } | null;
}

export function useTasks(filters?: { client_id?: string; deal_id?: string }) {
  const { user } = useAuth();
  const qc = useQueryClient();

  const tasksQuery = useQuery({
    queryKey: ["tasks", filters],
    queryFn: async () => {
      let query = supabase
        .from("tasks")
        .select("*, client:clients(id, name), deal:deals(id, title)")
        .order("due_date", { ascending: true, nullsFirst: false });

      if (filters?.client_id) query = query.eq("client_id", filters.client_id);
      if (filters?.deal_id) query = query.eq("deal_id", filters.deal_id);

      const { data, error } = await query;
      if (error) {
        // Fallback without joins
        let q2 = supabase.from("tasks").select("*").order("due_date", { ascending: true, nullsFirst: false });
        if (filters?.client_id) q2 = q2.eq("client_id", filters.client_id);
        if (filters?.deal_id) q2 = q2.eq("deal_id", filters.deal_id);
        const { data: d2, error: e2 } = await q2;
        if (e2) throw e2;
        return d2 as Task[];
      }
      return data as Task[];
    },
    enabled: !!user,
  });

  const addTask = useMutation({
    mutationFn: async (task: { title: string; description?: string; client_id?: string | null; deal_id?: string | null; assigned_to?: string; priority?: string; due_date?: string | null }) => {
      if (!user) throw new Error("Not authenticated");
      const { data, error } = await supabase
        .from("tasks")
        .insert({
          ...task,
          assigned_to: task.assigned_to || user.id,
          created_by: user.id,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tasks"] });
      toast.success("Задача создана");
    },
    onError: (e) => toast.error("Ошибка: " + e.message),
  });

  const updateTask = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<Pick<Task, "title" | "description" | "status" | "priority" | "due_date" | "completed_at" | "client_id" | "deal_id" | "assigned_to">>) => {
      const { data, error } = await supabase.from("tasks").update(updates).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tasks"] });
    },
    onError: (e) => toast.error("Ошибка: " + e.message),
  });

  const deleteTask = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("tasks").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tasks"] });
      toast.success("Задача удалена");
    },
    onError: (e) => toast.error("Ошибка: " + e.message),
  });

  const completeTask = (id: string, completed: boolean) => {
    updateTask.mutate({
      id,
      status: completed ? "done" : "todo",
      completed_at: completed ? new Date().toISOString() : null,
    });
  };

  return {
    tasks: tasksQuery.data ?? [],
    isLoading: tasksQuery.isLoading,
    addTask, updateTask, deleteTask, completeTask,
  };
}
