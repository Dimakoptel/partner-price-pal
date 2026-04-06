import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import AppLayout from "@/components/AppLayout";
import { useAuth } from "@/hooks/useAuth";
import { useCalculations } from "@/hooks/useCalculations";
import { useLeads } from "@/hooks/useLeads";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Calculator, TrendingUp, History,
  ArrowRight, Users, Factory, Warehouse, Clock
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

const PENDING_ROLE_LABELS: Record<string, string> = {
  staff: "Сотрудник", dealer: "Дилер", agent: "Агент", designer: "Дизайнер",
};

function StatCard({ label, value, icon: Icon, onClick }: {
  label: string; value: string | number; icon: any; onClick?: () => void;
}) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={onClick}
      className="border border-border bg-card p-5 text-left hover:border-primary/40 transition-colors group"
    >
      <div className="flex items-center justify-between mb-3">
        <Icon className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
        {onClick && <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />}
      </div>
      <div className="text-2xl font-light tracking-tight text-foreground">{value}</div>
      <div className="text-xs text-muted-foreground uppercase tracking-wider mt-1">{label}</div>
    </motion.button>
  );
}

function QuickAction({ label, description, icon: Icon, onClick }: {
  label: string; description: string; icon: any; onClick: () => void;
}) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={onClick}
      className="border border-border bg-card p-5 text-left hover:border-primary/40 transition-all group flex items-start gap-4"
    >
      <div className="p-2 border border-border group-hover:border-primary/40 transition-colors">
        <Icon className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
      </div>
      <div className="flex-1">
        <div className="text-sm font-medium text-foreground">{label}</div>
        <div className="text-xs text-muted-foreground mt-0.5">{description}</div>
      </div>
      <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity mt-1" />
    </motion.button>
  );
}

function PendingUsersWidget() {
  const navigate = useNavigate();
  const [pendingUsers, setPendingUsers] = useState<any[]>([]);

  useEffect(() => {
    supabase
      .from("profiles")
      .select("user_id, full_name, phone, pending_role, created_at")
      .eq("is_approved", false)
      .order("created_at", { ascending: false })
      .limit(10)
      .then(({ data }) => { if (data) setPendingUsers(data as any); });
  }, []);

  if (pendingUsers.length === 0) return null;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="border border-border bg-card p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-amber-500" />
          <h3 className="text-sm font-medium">Ожидают подтверждения</h3>
          <Badge variant="secondary" className="text-xs">{pendingUsers.length}</Badge>
        </div>
        <button onClick={() => navigate("/admin")} className="text-xs text-primary hover:underline flex items-center gap-1">
          Управление <ArrowRight className="w-3 h-3" />
        </button>
      </div>
      <div className="space-y-2">
        {pendingUsers.slice(0, 5).map((u) => (
          <div key={u.user_id} className="flex items-center justify-between py-1.5 border-b border-border/30 last:border-0">
            <div>
              <span className="text-sm font-medium">{u.full_name || "Без имени"}</span>
              {u.phone && <span className="text-xs text-muted-foreground ml-2">{u.phone}</span>}
            </div>
            <Badge variant="outline" className="text-[10px]">
              {PENDING_ROLE_LABELS[u.pending_role] || u.pending_role || "—"}
            </Badge>
          </div>
        ))}
        {pendingUsers.length > 5 && (
          <p className="text-xs text-muted-foreground text-center pt-1">
            и ещё {pendingUsers.length - 5}...
          </p>
        )}
      </div>
    </motion.div>
  );
}

export default function Index() {
  const navigate = useNavigate();
  const { profile, isAdmin } = useAuth();
  const { calculations } = useCalculations();
  const { leads } = useLeads();

  const todayCalcs = calculations.filter(
    (c) => new Date(c.created_at).toDateString() === new Date().toDateString()
  ).length;

  const activeLeads = leads.filter((l) => l.status === "new" || l.status === "in_progress").length;

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 6) return "Доброй ночи";
    if (h < 12) return "Доброе утро";
    if (h < 18) return "Добрый день";
    return "Добрый вечер";
  };

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-8">
          <h1 className="text-2xl font-light text-foreground tracking-tight">
            {greeting()}{profile?.full_name ? `, ${profile.full_name.split(" ").length > 1 ? profile.full_name.split(" ")[1] : profile.full_name.split(" ")[0]}` : ""}
          </h1>
        </motion.div>

        {/* Admin: pending users widget */}
        {isAdmin && (
          <div className="mb-6">
            <PendingUsersWidget />
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
          <StatCard label="Расчётов сегодня" value={todayCalcs} icon={Calculator} onClick={() => navigate("/history")} />
          <StatCard label="Всего расчётов" value={calculations.length} icon={History} onClick={() => navigate("/history")} />
          <StatCard label="Активные лиды" value={activeLeads} icon={TrendingUp} onClick={() => navigate("/crm")} />
          <StatCard label="Всего лидов" value={leads.length} icon={Users} onClick={() => navigate("/crm")} />
        </div>

        {/* Quick Actions */}
        <div className="mb-3">
          <h2 className="text-xs uppercase tracking-widest text-muted-foreground font-medium">Быстрые действия</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <QuickAction label="Новый расчёт" description="Рассчитать стоимость изделия" icon={Calculator} onClick={() => navigate("/calculator")} />
          <QuickAction label="Продажи" description="Лиды, сделки и клиенты" icon={TrendingUp} onClick={() => navigate("/crm")} />
          <QuickAction label="Производство" description="Управление заказами" icon={Factory} onClick={() => navigate("/production")} />
          <QuickAction label="Склад" description="Учёт материалов" icon={Warehouse} onClick={() => navigate("/warehouse")} />
        </div>
      </div>
    </AppLayout>
  );
}
