import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Phone, Mail, MessageCircle, Building2, MapPin, Pencil, FileText, Target, Package } from "lucide-react";
import type { Client } from "@/hooks/useClients";
import { useDeals } from "@/hooks/useDeals";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import TaskList from "./TaskList";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

interface Props {
  client: Client | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: () => void;
}

export default function ClientDetailDialog({ client, open, onOpenChange, onEdit }: Props) {
  if (!client) return null;

  const { deals, stages } = useDeals();
  const clientDeals = deals.filter((d) => d.client_id === client.id);

  // Linked calculations
  const calcsQuery = useQuery({
    queryKey: ["client_calculations", client.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("saved_calculations")
        .select("*")
        .eq("client_id", client.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: open && !!client.id,
  });

  // Linked leads
  const leadsQuery = useQuery({
    queryKey: ["client_leads", client.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leads")
        .select("*")
        .eq("client_id", client.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: open && !!client.id,
  });

  // Linked orders
  const ordersQuery = useQuery({
    queryKey: ["client_orders", client.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("client_id", client.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: open && !!client.id,
  });

  const stageName = (id: string) => stages.find((s) => s.id === id)?.name || "—";
  const stageColor = (id: string) => stages.find((s) => s.id === id)?.color || "#888";

  const formatAmount = (n: number) =>
    n > 0 ? new Intl.NumberFormat("ru-RU", { style: "currency", currency: "RUB", maximumFractionDigits: 0 }).format(n) : "—";

  const clientLeads = leadsQuery.data || [];
  const clientOrders = ordersQuery.data || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl">{client.name}</DialogTitle>
            <Button variant="ghost" size="sm" onClick={onEdit} className="gap-1.5">
              <Pencil className="w-3.5 h-3.5" /> Редактировать
            </Button>
          </div>
        </DialogHeader>

        {/* Contact info */}
        <div className="flex flex-wrap gap-3 text-sm text-muted-foreground pb-3 border-b border-border/50">
          {client.phone && <span className="inline-flex items-center gap-1"><Phone className="w-3.5 h-3.5" /> {client.phone}</span>}
          {client.email && <span className="inline-flex items-center gap-1"><Mail className="w-3.5 h-3.5" /> {client.email}</span>}
          {client.telegram && <span className="inline-flex items-center gap-1"><MessageCircle className="w-3.5 h-3.5" /> {client.telegram}</span>}
          {client.company && <span className="inline-flex items-center gap-1"><Building2 className="w-3.5 h-3.5" /> {client.company}</span>}
          {client.address && <span className="inline-flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {client.address}</span>}
        </div>

        <Tabs defaultValue="leads" className="mt-2">
          <TabsList className="w-full">
            <TabsTrigger value="leads" className="flex-1">Лиды ({clientLeads.length})</TabsTrigger>
            <TabsTrigger value="orders" className="flex-1">Заказы ({clientOrders.length})</TabsTrigger>
            <TabsTrigger value="deals" className="flex-1">Сделки ({clientDeals.length})</TabsTrigger>
            <TabsTrigger value="tasks" className="flex-1">Задачи</TabsTrigger>
            <TabsTrigger value="calcs" className="flex-1">Расчёты ({calcsQuery.data?.length || 0})</TabsTrigger>
          </TabsList>

          <TabsContent value="leads" className="mt-3">
            {clientLeads.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">Нет привязанных лидов</p>
            ) : (
              <div className="space-y-2">
                {clientLeads.map((lead: any) => (
                  <div key={lead.id} className="flex items-center justify-between p-2.5 rounded-lg border border-border/50 text-sm">
                    <div className="flex items-center gap-2">
                      <Target className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{lead.client_name}</p>
                        <p className="text-xs text-muted-foreground">{lead.source} · {format(new Date(lead.created_at), "d MMM yyyy", { locale: ru })}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-[10px]">{lead.status}</Badge>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="orders" className="mt-3">
            {clientOrders.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">Нет заказов</p>
            ) : (
              <div className="space-y-2">
                {clientOrders.map((order: any) => (
                  <div key={order.id} className="flex items-center justify-between p-2.5 rounded-lg border border-border/50 text-sm">
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{order.number}</p>
                        <p className="text-xs text-muted-foreground">{format(new Date(order.created_at), "d MMM yyyy", { locale: ru })}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-medium text-sm">{formatAmount(order.total_amount)}</span>
                      <Badge variant="outline" className="text-[10px] ml-2">{order.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="deals" className="mt-3">
            {clientDeals.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">Нет сделок</p>
            ) : (
              <div className="space-y-2">
                {clientDeals.map((deal) => (
                  <div key={deal.id} className="flex items-center justify-between p-2.5 rounded-lg border border-border/50 text-sm">
                    <div>
                      <p className="font-medium">{deal.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: stageColor(deal.stage_id) }} />
                        <span className="text-xs text-muted-foreground">{stageName(deal.stage_id)}</span>
                      </div>
                    </div>
                    <span className="text-sm font-medium">{formatAmount(deal.amount)}</span>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="tasks" className="mt-3">
            <TaskList clientId={client.id} />
          </TabsContent>

          <TabsContent value="calcs" className="mt-3">
            {!calcsQuery.data?.length ? (
              <p className="text-xs text-muted-foreground text-center py-4">Нет привязанных расчётов</p>
            ) : (
              <div className="space-y-2">
                {calcsQuery.data.map((calc: any) => (
                  <div key={calc.id} className="flex items-center justify-between p-2.5 rounded-lg border border-border/50 text-sm">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{calc.calc_name || calc.product_label}</p>
                        <p className="text-xs text-muted-foreground">{format(new Date(calc.created_at), "d MMM yyyy", { locale: ru })}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {client.notes && (
          <div className="mt-3 pt-3 border-t border-border/50">
            <p className="text-xs text-muted-foreground mb-1">Заметки</p>
            <p className="text-sm whitespace-pre-wrap">{client.notes}</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
