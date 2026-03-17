import { useState, useMemo } from "react";
import { useLeads, type Lead } from "@/hooks/useLeads";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Phone, Mail, Calendar, ArrowRight, Filter, User, Plus } from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { toast } from "sonner";
import LeadDetailDialog from "./LeadDetailDialog";
import LeadFormDialog from "./LeadFormDialog";

const LEAD_STATUSES = [
  { value: "new", label: "Новый", color: "#3b82f6" },
  { value: "qualified", label: "Квалифицирован", color: "#8b5cf6" },
  { value: "proposal_sent", label: "КП отправлено", color: "#f59e0b" },
  { value: "negotiation", label: "Переговоры", color: "#f97316" },
  { value: "won", label: "Выигран", color: "#22c55e" },
  { value: "lost", label: "Проигран", color: "#ef4444" },
];

const LEAD_SOURCES = [
  { value: "calculator", label: "Калькулятор" },
  { value: "website", label: "Сайт" },
  { value: "phone", label: "Телефон" },
  { value: "exhibition", label: "Выставка" },
  { value: "agent", label: "Агент" },
  { value: "referral", label: "Рекомендация" },
  { value: "lead", label: "Лид" },
];

export default function LeadsTab() {
  const { leads, loading, updateLead, convertToClient, convertToOrder, fetchLeads } = useLeads();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editLead, setEditLead] = useState<Lead | null>(null);

  const filtered = useMemo(() => {
    let result = leads;
    if (statusFilter !== "all") {
      result = result.filter((l) => l.status === statusFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (l) =>
          l.client_name.toLowerCase().includes(q) ||
          l.client_phone?.toLowerCase().includes(q) ||
          l.client_email?.toLowerCase().includes(q)
      );
    }
    return result;
  }, [leads, search, statusFilter]);

  const statusInfo = (status: string) => LEAD_STATUSES.find((s) => s.value === status) || { label: status, color: "#888" };
  const sourceLabel = (source: string) => LEAD_SOURCES.find((s) => s.value === source)?.label || source;

  const formatAmount = (n: number | null) =>
    n && n > 0 ? new Intl.NumberFormat("ru-RU", { style: "currency", currency: "RUB", maximumFractionDigits: 0 }).format(n) : "—";

  const openDetail = (lead: Lead) => {
    setSelectedLead(lead);
    setDetailOpen(true);
  };

  const handleConvertToClient = async (lead: Lead) => {
    const { error, clientId } = await convertToClient(lead);
    if (error) {
      toast.error("Ошибка создания клиента: " + error.message);
    } else {
      toast.success("Клиент создан и привязан к лиду");
      // Refresh selected lead
      const updated = { ...lead, client_id: clientId, status: lead.status === "new" ? "qualified" : lead.status };
      setSelectedLead(updated as Lead);
    }
  };

  const handleConvertToOrder = async (lead: Lead) => {
    // If no client yet, create one first
    let leadWithClient = lead;
    if (!lead.client_id) {
      const { error, clientId } = await convertToClient(lead);
      if (error) {
        toast.error("Ошибка создания клиента: " + error.message);
        return;
      }
      leadWithClient = { ...lead, client_id: clientId } as Lead;
    }

    const { error, orderId } = await convertToOrder(leadWithClient);
    if (error) {
      toast.error("Ошибка создания заказа: " + error.message);
    } else {
      toast.success("Заказ создан, лид выигран!");
      setSelectedLead({ ...leadWithClient, status: "won", converted_to_order_id: orderId } as Lead);
    }
  };

  if (loading) return <div className="text-center py-12 text-muted-foreground">Загрузка лидов...</div>;

  return (
    <>
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Поиск по имени, телефону, email..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <Filter className="w-3.5 h-3.5 mr-1.5" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все статусы</SelectItem>
            {LEAD_STATUSES.map((s) => (
              <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        {[
          { label: "Всего", count: leads.length, color: "text-foreground" },
          { label: "Новые", count: leads.filter((l) => l.status === "new").length, color: "text-blue-500" },
          { label: "В работе", count: leads.filter((l) => ["qualified", "proposal_sent", "negotiation"].includes(l.status)).length, color: "text-amber-500" },
          { label: "Выиграно", count: leads.filter((l) => l.status === "won").length, color: "text-green-500" },
        ].map((stat) => (
          <div key={stat.label} className="border border-border p-3 bg-card">
            <div className={`text-2xl font-light ${stat.color}`}>{stat.count}</div>
            <div className="text-xs text-muted-foreground">{stat.label}</div>
          </div>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="border border-dashed border-border p-12 text-center">
          <p className="text-muted-foreground text-sm">
            {search || statusFilter !== "all" ? "Ничего не найдено" : "Лидов пока нет. Они создаются автоматически при сохранении расчёта."}
          </p>
        </div>
      ) : (
        <div className="border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Клиент</TableHead>
                <TableHead>Контакты</TableHead>
                <TableHead>Источник</TableHead>
                <TableHead>Сумма</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead>Дата</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((lead) => {
                const si = statusInfo(lead.status);
                return (
                  <TableRow key={lead.id} className="cursor-pointer" onClick={() => openDetail(lead)}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{lead.client_name || "—"}</span>
                        {lead.client_id && (
                          <User className="w-3 h-3 text-primary" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-0.5 text-xs text-muted-foreground">
                        {lead.client_phone && <span className="inline-flex items-center gap-1"><Phone className="w-3 h-3" />{lead.client_phone}</span>}
                        {lead.client_email && <span className="inline-flex items-center gap-1"><Mail className="w-3 h-3" />{lead.client_email}</span>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs">{sourceLabel(lead.source)}</span>
                    </TableCell>
                    <TableCell className="font-medium text-sm">{formatAmount(lead.amount)}</TableCell>
                    <TableCell>
                      <Badge variant="outline" style={{ borderColor: si.color, color: si.color }} className="text-[10px]">
                        {si.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {format(new Date(lead.created_at), "d MMM", { locale: ru })}
                    </TableCell>
                    <TableCell>
                      <ArrowRight className="w-4 h-4 text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <LeadDetailDialog
        lead={selectedLead}
        open={detailOpen}
        onOpenChange={(v) => { setDetailOpen(v); if (!v) setSelectedLead(null); }}
        onStatusChange={async (id, status) => {
          await updateLead(id, { status });
          if (selectedLead?.id === id) setSelectedLead({ ...selectedLead, status });
        }}
        onConvertToClient={handleConvertToClient}
        onConvertToOrder={handleConvertToOrder}
      />
    </>
  );
}
