import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Phone, Mail, Calendar, FileText, ArrowRight, ShoppingCart } from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Lead } from "@/hooks/useLeads";

const LEAD_STATUSES = [
  { value: "new", label: "Новый", color: "#3b82f6" },
  { value: "qualified", label: "Квалифицирован", color: "#8b5cf6" },
  { value: "proposal_sent", label: "КП отправлено", color: "#f59e0b" },
  { value: "negotiation", label: "Переговоры", color: "#f97316" },
  { value: "won", label: "Выигран", color: "#22c55e" },
  { value: "lost", label: "Проигран", color: "#ef4444" },
];

interface Props {
  lead: Lead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStatusChange: (id: string, status: string) => void;
  onConvertToOrder?: (lead: Lead) => void;
}

export default function LeadDetailDialog({ lead, open, onOpenChange, onStatusChange, onConvertToOrder }: Props) {
  if (!lead) return null;

  const statusInfo = (s: string) => LEAD_STATUSES.find((st) => st.value === s) || { label: s, color: "#888" };
  const si = statusInfo(lead.status);

  const formatAmount = (n: number | null) =>
    n && n > 0 ? new Intl.NumberFormat("ru-RU", { style: "currency", currency: "RUB", maximumFractionDigits: 0 }).format(n) : "—";

  // Load linked calculation
  const calcQuery = useQuery({
    queryKey: ["lead_calculation", lead.calculation_id],
    queryFn: async () => {
      if (!lead.calculation_id) return null;
      const { data, error } = await supabase
        .from("saved_calculations")
        .select("*")
        .eq("id", lead.calculation_id)
        .single();
      if (error) return null;
      return data;
    },
    enabled: open && !!lead.calculation_id,
  });

  const calc = calcQuery.data as any;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl">Лид: {lead.client_name || "Без имени"}</DialogTitle>
            <Badge variant="outline" style={{ borderColor: si.color, color: si.color }}>
              {si.label}
            </Badge>
          </div>
        </DialogHeader>

        {/* Contact info */}
        <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
          {lead.client_phone && <span className="inline-flex items-center gap-1"><Phone className="w-3.5 h-3.5" /> {lead.client_phone}</span>}
          {lead.client_email && <span className="inline-flex items-center gap-1"><Mail className="w-3.5 h-3.5" /> {lead.client_email}</span>}
          <span className="inline-flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {format(new Date(lead.created_at), "d MMMM yyyy, HH:mm", { locale: ru })}</span>
        </div>

        <Separator />

        {/* Details */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-xs text-muted-foreground block mb-0.5">Сумма</span>
            <span className="font-medium">{formatAmount(lead.amount)}</span>
          </div>
          <div>
            <span className="text-xs text-muted-foreground block mb-0.5">Источник</span>
            <span>{lead.source}</span>
          </div>
          {(lead as any).product_interest && (
            <div className="col-span-2">
              <span className="text-xs text-muted-foreground block mb-0.5">Интерес к продукту</span>
              <span>{(lead as any).product_interest}</span>
            </div>
          )}
          {(lead as any).region && (
            <div>
              <span className="text-xs text-muted-foreground block mb-0.5">Регион</span>
              <span>{(lead as any).region}</span>
            </div>
          )}
          {(lead as any).budget && (
            <div>
              <span className="text-xs text-muted-foreground block mb-0.5">Бюджет</span>
              <span>{formatAmount((lead as any).budget)}</span>
            </div>
          )}
        </div>

        {lead.notes && (
          <div>
            <span className="text-xs text-muted-foreground block mb-0.5">Заметки</span>
            <p className="text-sm whitespace-pre-wrap">{lead.notes}</p>
          </div>
        )}

        {/* Linked calculation */}
        {calc && (
          <>
            <Separator />
            <div>
              <span className="text-xs text-muted-foreground block mb-2">Привязанный расчёт</span>
              <div className="border border-border p-3 bg-secondary/30">
                <div className="flex items-center gap-2 mb-1">
                  <FileText className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium text-sm">{calc.calc_name || calc.product_label}</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  {calc.product_label} · {format(new Date(calc.created_at), "d MMM yyyy", { locale: ru })}
                </div>
                {calc.result && (
                  <div className="mt-2 text-sm font-medium text-primary">
                    {formatAmount((calc.result as any)?.totalPrice || (calc.result as any)?.total || 0)}
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        <Separator />

        {/* Status change */}
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground shrink-0">Статус:</span>
          <Select value={lead.status} onValueChange={(v) => onStatusChange(lead.id, v)}>
            <SelectTrigger className="flex-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LEAD_STATUSES.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                    {s.label}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Convert to order */}
        {lead.status !== "won" && lead.status !== "lost" && (
          <div className="flex gap-2">
            <Button
              variant="default"
              className="flex-1 gap-2"
              onClick={() => {
                onStatusChange(lead.id, "won");
                onConvertToOrder?.(lead);
              }}
            >
              <ShoppingCart className="w-4 h-4" /> Создать заказ
            </Button>
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => onStatusChange(lead.id, "lost")}
            >
              Проигран
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
