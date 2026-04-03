import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import AppLayout from "@/components/AppLayout";
import { useAuth } from "@/hooks/useAuth";
import { usePartnerRequests } from "@/hooks/usePartnerRequests";
import { FilePlus, History, FileSpreadsheet, ArrowRight, Package } from "lucide-react";

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

export default function PartnerDashboardPage() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { requests } = usePartnerRequests();

  const newRequests = requests.filter(r => r.status === "new").length;
  const quotedRequests = requests.filter(r => r.status === "quoted").length;
  const orderedRequests = requests.filter(r => r.status === "ordered").length;

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
            {greeting()}{profile?.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Личный кабинет партнёра
          </p>
        </motion.div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
          <StatCard label="Новые запросы" value={newRequests} icon={FilePlus} onClick={() => navigate("/partner/requests")} />
          <StatCard label="На рассмотрении" value={quotedRequests} icon={Package} onClick={() => navigate("/partner/requests")} />
          <StatCard label="В заказах" value={orderedRequests} icon={History} onClick={() => navigate("/partner/requests")} />
          <StatCard label="Всего запросов" value={requests.length} icon={FileSpreadsheet} onClick={() => navigate("/partner/requests")} />
        </div>

        <div className="mb-3">
          <h2 className="text-xs uppercase tracking-widest text-muted-foreground font-medium">Быстрые действия</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={() => navigate("/partner/requests/new")}
            className="border border-border bg-card p-5 text-left hover:border-primary/40 transition-all group flex items-start gap-4"
          >
            <div className="p-2 border border-border group-hover:border-primary/40 transition-colors">
              <FilePlus className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium text-foreground">Новый запрос на расчёт</div>
              <div className="text-xs text-muted-foreground mt-0.5">Отправить запрос на просчёт стоимости изделия</div>
            </div>
            <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity mt-1" />
          </motion.button>
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={() => navigate("/partner/pricelist")}
            className="border border-border bg-card p-5 text-left hover:border-primary/40 transition-all group flex items-start gap-4"
          >
            <div className="p-2 border border-border group-hover:border-primary/40 transition-colors">
              <FileSpreadsheet className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium text-foreground">Прайс-лист</div>
              <div className="text-xs text-muted-foreground mt-0.5">Посмотреть цены с вашей скидкой</div>
            </div>
            <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity mt-1" />
          </motion.button>
        </div>
      </div>
    </AppLayout>
  );
}
