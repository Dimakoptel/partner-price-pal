import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Phone, Mail, Calendar, FileText, ShoppingCart, UserPlus, User, Package, AlertCircle, Pencil, ChevronDown, ChevronUp } from "lucide-react";
import LeadFormDialog from "./LeadFormDialog";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Lead } from "@/hooks/useLeads";
import { useConvertLeadToOrder } from "@/hooks/useLeadConversion";
import { useDictOptions } from "@/hooks/useDictOptions";
import { Textarea } from "@/components/ui/textarea";
import ResultPanel from "@/components/ResultPanel";
import { useCompanySettings } from "@/hooks/useCompanySettings";
import { useColors } from "@/hooks/useColors";
import type { CalculationResult } from "@/lib/calculator";

interface Props {
  lead: Lead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStatusChange: (id: string, status: string) => void;
  onConvertToClient?: (lead: Lead) => void;
  onConvertToOrder?: (lead: Lead) => void;
}

export default function LeadDetailDialog({ lead, open, onOpenChange, onStatusChange, onConvertToClient, onConvertToOrder }: Props) {
  const [lostReason, setLostReason] = useState("");
  const [showLostDialog, setShowLostDialog] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [expandedCalcs, setExpandedCalcs] = useState<Set<string>>(new Set());
  const toggleCalc = (id: string) => setExpandedCalcs((prev) => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });
  const convertMutation = useConvertLeadToOrder();
  const leadStatuses = useDictOptions("lead_statuses");
  const { getSetting } = useCompanySettings();
  const { colors } = useColors();
  const colorsForPrint = colors.map((c) => ({ name: c.name, image_url: c.image_url, show_in_print: c.show_in_print }));

  // Load linked calculation (main one referenced by lead)
  const calcQuery = useQuery({
    queryKey: ["lead_calculation", lead?.calculation_id],
    queryFn: async () => {
      if (!lead?.calculation_id) return null;
      const { data, error } = await supabase
        .from("saved_calculations")
        .select("*")
        .eq("id", lead.calculation_id)
        .maybeSingle();
      if (error) return null;
      return data;
    },
    enabled: open && !!lead?.calculation_id,
  });

  // Load ALL related calculations (by lead_id or by client_id)
  const allCalcsQuery = useQuery({
    queryKey: ["lead_all_calculations", lead?.id, lead?.client_id],
    queryFn: async () => {
      if (!lead) return [];
      let query = supabase.from("saved_calculations").select("*").order("created_at", { ascending: false });
      if (lead.client_id) {
        query = query.or(`lead_id.eq.${lead.id},client_id.eq.${lead.client_id}`);
      } else {
        query = query.eq("lead_id", lead.id);
      }
      const { data, error } = await query;
      if (error) return [];
      return data || [];
    },
    enabled: open && !!lead,
  });

  // Load linked client
  const clientQuery = useQuery({
    queryKey: ["lead_client", lead?.client_id],
    queryFn: async () => {
      if (!lead?.client_id) return null;
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .eq("id", lead.client_id)
        .maybeSingle();
      if (error) return null;
      return data;
    },
    enabled: open && !!lead?.client_id,
  });

  // Load linked order
  const orderQuery = useQuery({
    queryKey: ["lead_order", lead?.converted_to_order_id],
    queryFn: async () => {
      if (!lead?.converted_to_order_id) return null;
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("id", lead.converted_to_order_id)
        .maybeSingle();
      if (error) return null;
      return data;
    },
    enabled: open && !!lead?.converted_to_order_id,
  });

  if (!lead) return null;

  const si = leadStatuses.find(lead.status);
  const stepsOnly = leadStatuses.options.filter((s) => s.value !== "lost");
  const currentStepIdx = stepsOnly.findIndex((s) => s.value === lead.status);
  const totalSteps = stepsOnly.length;
  const progressPercent = lead.status === "lost" ? 0 : ((currentStepIdx + 1) / totalSteps) * 100;

  const formatAmount = (n: number | null) =>
    n && n > 0 ? new Intl.NumberFormat("ru-RU", { style: "currency", currency: "RUB", maximumFractionDigits: 0 }).format(n) : "—";

  const calc = calcQuery.data as any;
  const linkedClient = clientQuery.data as any;
  const linkedOrder = orderQuery.data as any;

  const handleLost = () => {
    onStatusChange(lead.id, "lost");
    setShowLostDialog(false);
    setLostReason("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl">Лид: {lead.client_name || "Без имени"}</DialogTitle>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={() => setEditOpen(true)} title="Редактировать">
                <Pencil className="w-4 h-4" />
              </Button>
              <Badge variant="outline" style={{ borderColor: si.color, color: si.color }}>
                {si.label}
              </Badge>
            </div>
          </div>
        </DialogHeader>

        {/* Progress timeline */}
        {lead.status !== "lost" && (
          <div className="space-y-2">
            <div className="flex justify-between text-[10px] text-muted-foreground">
              {stepsOnly.map((s) => (
                <span key={s.value} className={leadStatuses.options.indexOf(s) <= currentStepIdx ? "text-primary font-medium" : ""}>
                  {s.label}
                </span>
              ))}
            </div>
            <Progress value={progressPercent} className="h-2" />
          </div>
        )}

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
          {lead.product_interest && (
            <div className="col-span-2">
              <span className="text-xs text-muted-foreground block mb-0.5">Интерес к продукту</span>
              <span>{lead.product_interest}</span>
            </div>
          )}
          {lead.region && (
            <div>
              <span className="text-xs text-muted-foreground block mb-0.5">Регион</span>
              <span>{lead.region}</span>
            </div>
          )}
          {lead.budget && (
            <div>
              <span className="text-xs text-muted-foreground block mb-0.5">Бюджет</span>
              <span>{formatAmount(lead.budget)}</span>
            </div>
          )}
        </div>

        {lead.notes && (
          <div>
            <span className="text-xs text-muted-foreground block mb-0.5">Заметки</span>
            <p className="text-sm whitespace-pre-wrap">{lead.notes}</p>
          </div>
        )}

        {/* Linked client */}
        {linkedClient && (
          <>
            <Separator />
            <div>
              <span className="text-xs text-muted-foreground block mb-2">Привязанный клиент</span>
              <div className="border border-border p-3 bg-secondary/30 flex items-center gap-3">
                <User className="w-5 h-5 text-primary" />
                <div>
                  <div className="font-medium text-sm">{linkedClient.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {linkedClient.phone && <span>{linkedClient.phone}</span>}
                    {linkedClient.email && <span className="ml-2">{linkedClient.email}</span>}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Linked order */}
        {linkedOrder && (
          <>
            <Separator />
            <div>
              <span className="text-xs text-muted-foreground block mb-2">Созданный заказ</span>
              <div className="border border-border p-3 bg-secondary/30 flex items-center gap-3">
                <Package className="w-5 h-5 text-primary" />
                <div>
                  <div className="font-medium text-sm">{linkedOrder.number}</div>
                  <div className="text-xs text-muted-foreground">
                    {formatAmount(linkedOrder.total_amount)} · {linkedOrder.status}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Linked calculation */}
        {calc && (
          <>
            <Separator />
            <div>
              <span className="text-xs text-muted-foreground block mb-2">Привязанный расчёт (КП)</span>
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
                    {formatAmount((calc.result as any)?.grandTotal || (calc.result as any)?.totalPrice || 0)}
                  </div>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-3 w-full gap-2"
                  onClick={() => setShowFullCalc((v) => !v)}
                >
                  {showFullCalc ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  {showFullCalc ? "Свернуть КП" : "Показать полный расчёт (КП)"}
                </Button>
              </div>

              {showFullCalc && calc.result && (
                <div className="mt-3">
                  <ResultPanel
                    result={calc.result as CalculationResult}
                    companySettings={{ getSetting }}
                    colorsForPrint={colorsForPrint}
                    calcName={calc.calc_name}
                  />
                </div>
              )}
            </div>
          </>
        )}

        <Separator />

        {/* Status change */}
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground shrink-0">Статус:</span>
          <Select value={lead.status} onValueChange={(v) => {
            if (v === "lost") {
              setShowLostDialog(true);
            } else {
              onStatusChange(lead.id, v);
            }
          }}>
            <SelectTrigger className="flex-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {leadStatuses.options.map((s) => (
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

        {/* Lost reason dialog inline */}
        {showLostDialog && (
          <div className="border border-destructive/30 bg-destructive/5 p-3 rounded space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-destructive">
              <AlertCircle className="w-4 h-4" /> Причина проигрыша
            </div>
            <Textarea
              value={lostReason}
              onChange={(e) => setLostReason(e.target.value)}
              placeholder="Укажите причину..."
              rows={2}
            />
            <div className="flex gap-2">
              <Button size="sm" variant="destructive" onClick={handleLost}>Подтвердить</Button>
              <Button size="sm" variant="outline" onClick={() => setShowLostDialog(false)}>Отмена</Button>
            </div>
          </div>
        )}

        {/* Action buttons */}
        {lead.status !== "won" && lead.status !== "lost" && (
          <div className="flex flex-wrap gap-2">
            {!lead.client_id && (
              <Button
                variant="outline"
                className="flex-1 gap-2"
                onClick={() => onConvertToClient?.(lead)}
              >
                <UserPlus className="w-4 h-4" /> Создать клиента
              </Button>
            )}
            <Button
              variant="default"
              className="flex-1 gap-2"
              disabled={convertMutation.isPending}
              onClick={() => convertMutation.mutate(lead.id, { onSuccess: () => onOpenChange(false) })}
            >
              <ShoppingCart className="w-4 h-4" /> {convertMutation.isPending ? "Конвертация..." : "Выиграть и создать заказ"}
            </Button>
          </div>
        )}

        {lead.status === "won" && !lead.converted_to_order_id && (
          <Button
            variant="default"
            className="w-full gap-2"
            disabled={convertMutation.isPending}
            onClick={() => convertMutation.mutate(lead.id, { onSuccess: () => onOpenChange(false) })}
          >
            <ShoppingCart className="w-4 h-4" /> {convertMutation.isPending ? "Конвертация..." : "Создать заказ"}
          </Button>
        )}
      </DialogContent>

      <LeadFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        lead={lead}
        onSuccess={() => {
          setEditOpen(false);
          onOpenChange(false);
        }}
      />
    </Dialog>
  );
}
