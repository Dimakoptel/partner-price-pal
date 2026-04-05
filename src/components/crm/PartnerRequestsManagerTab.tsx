import { useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Calculator, Send, ShoppingCart, FileText } from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import ManagerRequestCalculateDialog from "./ManagerRequestCalculateDialog";

const STATUS_MAP: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  new: { label: "Новый", variant: "default" },
  in_progress: { label: "В работе", variant: "secondary" },
  quoted: { label: "Просчитан", variant: "outline" },
  approved: { label: "Одобрен", variant: "default" },
  rejected: { label: "Отклонён", variant: "destructive" },
  ordered: { label: "В заказе", variant: "secondary" },
};

const PRODUCT_LABELS: Record<string, string> = {
  countertop: "Столешница",
  sink: "Мойка",
  windowsill: "Подоконник",
  stepslab: "Ступень (накладная)",
  backsplash: "Фартук",
  stair: "Ступень (монолит)",
};

interface PartnerRequest {
  id: string;
  number: string;
  client_id: string;
  user_id: string;
  category_id: string | null;
  product_type: string | null;
  params: Record<string, any>;
  status: string;
  retail_price: number | null;
  partner_price: number | null;
  assigned_manager_id: string | null;
  attachment_urls: string[];
  notes: string | null;
  converted_order_id: string | null;
  created_at: string;
  updated_at: string;
}

export default function PartnerRequestsManagerTab() {
  const { user } = useAuth();
  const { categories } = useProductCategories();
  const [search, setSearch] = useState("");
  const [selectedRequest, setSelectedRequest] = useState<PartnerRequest | null>(null);
  const [calcDialogOpen, setCalcDialogOpen] = useState(false);

  const { data: requests = [], isLoading, refetch } = useQuery({
    queryKey: ["manager_partner_requests"],
    queryFn: async () => {
      const { data, error } = await (supabase.from("partner_requests" as any) as any)
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as PartnerRequest[];
    },
    enabled: !!user,
  });

  // Fetch client names
  const clientIds = useMemo(() => [...new Set(requests.map(r => r.client_id))], [requests]);
  const { data: clientsMap = {} } = useQuery({
    queryKey: ["partner_request_clients", clientIds],
    queryFn: async () => {
      if (clientIds.length === 0) return {};
      const { data } = await supabase.from("clients").select("id, name, company").in("id", clientIds);
      const map: Record<string, { name: string; company: string | null }> = {};
      (data || []).forEach(c => { map[c.id] = { name: c.name, company: c.company }; });
      return map;
    },
    enabled: clientIds.length > 0,
  });

  const filtered = useMemo(() => {
    if (!search.trim()) return requests;
    const q = search.toLowerCase();
    return requests.filter(r =>
      r.number.toLowerCase().includes(q) ||
      (clientsMap[r.client_id]?.name || "").toLowerCase().includes(q) ||
      (clientsMap[r.client_id]?.company || "").toLowerCase().includes(q) ||
      (r.product_type && PRODUCT_LABELS[r.product_type]?.toLowerCase().includes(q))
    );
  }, [requests, search, clientsMap]);

  const handleCalculate = (request: PartnerRequest) => {
    setSelectedRequest(request);
    setCalcDialogOpen(true);
  };

  if (isLoading) {
    return <div className="text-center py-12 text-muted-foreground">Загрузка...</div>;
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Поиск по номеру, клиенту, типу изделия..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
      </div>

      {filtered.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <FileText className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">Запросов от партнёров пока нет</p>
          </CardContent>
        </Card>
      ) : (
        <div className="border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Номер</TableHead>
                <TableHead>Партнёр</TableHead>
                <TableHead>Изделие</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead>Цена</TableHead>
                <TableHead>Дата</TableHead>
                <TableHead className="w-[120px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(r => {
                const st = STATUS_MAP[r.status] || { label: r.status, variant: "outline" as const };
                const client = clientsMap[r.client_id];
                return (
                  <TableRow key={r.id}>
                    <TableCell className="font-mono text-sm">{r.number}</TableCell>
                    <TableCell className="text-sm">
                      <div>{client?.name || "—"}</div>
                      {client?.company && <div className="text-xs text-muted-foreground">{client.company}</div>}
                    </TableCell>
                    <TableCell className="text-sm">{r.product_type ? PRODUCT_LABELS[r.product_type] || r.product_type : "—"}</TableCell>
                    <TableCell>
                      <Badge variant={st.variant} className="text-[10px]">{st.label}</Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {r.partner_price != null ? (
                        <span className="font-medium text-primary">{r.partner_price.toLocaleString("ru-RU")} ₽</span>
                      ) : "—"}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {format(new Date(r.created_at), "dd.MM.yy", { locale: ru })}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {r.product_type && r.status !== "ordered" && (
                          <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => handleCalculate(r)}>
                            <Calculator className="w-3 h-3" /> Рассчитать
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {selectedRequest && (
        <ManagerRequestCalculateDialog
          open={calcDialogOpen}
          onOpenChange={setCalcDialogOpen}
          request={selectedRequest}
          onDone={() => { refetch(); setCalcDialogOpen(false); }}
        />
      )}
    </div>
  );
}
