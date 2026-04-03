import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import AppLayout from "@/components/AppLayout";
import { usePartnerRequests } from "@/hooks/usePartnerRequests";
import { useProductCategories } from "@/hooks/useProductCategories";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FilePlus, Eye } from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

const STATUS_MAP: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  new: { label: "Новый", variant: "default" },
  in_progress: { label: "В работе", variant: "secondary" },
  quoted: { label: "Просчитан", variant: "outline" },
  approved: { label: "Одобрен", variant: "default" },
  rejected: { label: "Отклонён", variant: "destructive" },
  ordered: { label: "В заказе", variant: "secondary" },
};

export default function PartnerRequestsPage() {
  const navigate = useNavigate();
  const { requests, loading } = usePartnerRequests();
  const { categories } = useProductCategories();
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filtered = statusFilter === "all" ? requests : requests.filter(r => r.status === statusFilter);

  const getCategoryName = (id: string | null) => {
    if (!id) return "—";
    return categories.find(c => c.id === id)?.name || "—";
  };

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold">Запросы на расчёт</h1>
              <p className="text-muted-foreground text-sm mt-1">История ваших запросов</p>
            </div>
            <Button onClick={() => navigate("/partner/requests/new")}>
              <FilePlus className="w-4 h-4 mr-2" />
              Новый запрос
            </Button>
          </div>
        </motion.div>

        {/* Status filter */}
        <div className="flex gap-2 mb-4 flex-wrap">
          {[{ key: "all", label: "Все" }, ...Object.entries(STATUS_MAP).map(([k, v]) => ({ key: k, label: v.label }))].map(f => (
            <Button
              key={f.key}
              variant={statusFilter === f.key ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter(f.key)}
            >
              {f.label}
            </Button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-10 text-muted-foreground">Загрузка...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground">
            {statusFilter === "all" ? "Запросов пока нет. Создайте первый!" : "Нет запросов с таким статусом"}
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(req => {
              const st = STATUS_MAP[req.status] || { label: req.status, variant: "outline" as const };
              return (
                <motion.div
                  key={req.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="border border-border bg-card p-4 flex items-center gap-4 hover:border-primary/40 transition-colors cursor-pointer"
                  onClick={() => navigate(`/partner/requests/${req.id}`)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium">{req.number}</span>
                      <Badge variant={st.variant}>{st.label}</Badge>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {getCategoryName(req.category_id)} • {req.product_type || "—"} • {format(new Date(req.created_at), "dd MMM yyyy, HH:mm", { locale: ru })}
                    </div>
                    {req.partner_price != null && (
                      <div className="text-sm mt-1">
                        <span className="text-muted-foreground line-through mr-2">{req.retail_price?.toLocaleString("ru-RU")} ₽</span>
                        <span className="font-medium text-primary">{req.partner_price.toLocaleString("ru-RU")} ₽</span>
                      </div>
                    )}
                  </div>
                  <Eye className="w-4 h-4 text-muted-foreground" />
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
