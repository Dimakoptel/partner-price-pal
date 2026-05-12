import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Employee {
  id: string;
  name: string;
  position: string | null;
  hourly_rate: number;
  skill_level: "junior" | "middle" | "senior" | "master" | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Operation {
  id: string;
  name: string;
  category: string | null;
  norm_hours: number | null;
  created_at: string;
}

export interface Timesheet {
  id: string;
  employee_id: string;
  operation_id: string | null;
  order_id: string | null;
  hours_worked: number;
  work_date: string;
  coefficient: number;
  comment: string | null;
  created_at: string;
  employees?: Employee | null;
  operations?: Operation | null;
}

const T = (n: string) => (supabase as any).from(n);

export function useEmployees(includeInactive = false) {
  return useQuery({
    queryKey: ["employees", includeInactive],
    queryFn: async () => {
      let q = T("employees").select("*").order("name");
      if (!includeInactive) q = q.eq("is_active", true);
      const { data, error } = await q;
      if (error) throw error;
      return data as Employee[];
    },
  });
}

export function useOperations() {
  return useQuery({
    queryKey: ["operations"],
    queryFn: async () => {
      const { data, error } = await T("operations").select("*").order("name");
      if (error) throw error;
      return data as Operation[];
    },
  });
}

export function useTimesheets(periodMonth?: string) {
  return useQuery({
    queryKey: ["timesheets", periodMonth],
    queryFn: async () => {
      let q = T("timesheets")
        .select("*, employees(*), operations(*)")
        .order("work_date", { ascending: false });
      if (periodMonth) {
        const start = `${periodMonth}-01`;
        const [y, m] = periodMonth.split("-").map(Number);
        const next = new Date(y, m, 1);
        const end = `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}-01`;
        q = q.gte("work_date", start).lt("work_date", end);
      }
      const { data, error } = await q;
      if (error) throw error;
      return data as Timesheet[];
    },
  });
}

export function useUpsertEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<Employee> & { name: string; hourly_rate: number }) => {
      const { id, ...rest } = payload;
      if (id) {
        const { error } = await T("employees").update(rest).eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await T("employees").insert(rest);
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["employees"] }),
  });
}

export function useDeleteEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await T("employees").update({ is_active: false }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["employees"] }),
  });
}

export function useCreateTimesheet() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Omit<Timesheet, "id" | "created_at" | "employees" | "operations">) => {
      const { error } = await T("timesheets").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["timesheets"] }),
  });
}

export function useDeleteTimesheet() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await T("timesheets").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["timesheets"] }),
  });
}
