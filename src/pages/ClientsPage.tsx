import { useState, useMemo } from "react";
import AppLayout from "@/components/AppLayout";
import { motion } from "framer-motion";
import { Users, UserPlus, Search, Pencil, Trash2, Phone, Mail, Building2, MessageCircle, LayoutGrid, CheckSquare, Target, ShoppingCart, Badge as BadgeIcon, DollarSign } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useClients, type Client } from "@/hooks/useClients";
import { useLeads } from "@/hooks/useLeads";
import { useOrders } from "@/hooks/useOrders";
import { useAgentCommissions } from "@/hooks/useAgentCommissions";
import ClientFormDialog from "@/components/clients/ClientFormDialog";
import ClientDetailDialog from "@/components/crm/ClientDetailDialog";
import PipelineBoard from "@/components/crm/PipelineBoard";
import TaskList from "@/components/crm/TaskList";
import LeadsTab from "@/components/sales/LeadsTab";
import OrdersTab from "@/components/sales/OrdersTab";

const CLIENT_TYPE_LABELS: Record<string, string> = {
  b2c: "B2C",
  b2b: "B2B",
  agent: "Агент",
  designer: "Дизайнер",
  partner: "Партнёр",
  developer: "Застройщик",
};

const COMMISSION_STATUS_LABELS: Record<string, string> = {
  reserved: "Зарезервирована",
  accrued: "Начислена",
  paid: "Выплачена",
  cancelled: "Отменена",
};

export default function ClientsPage() {
  const { clients, isLoading, addClient, updateClient, deleteClient } = useClients();
  const { leads } = useLeads();
  const { orders } = useOrders();
  const { data: commissions } = useAgentCommissions();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [detailClient, setDetailClient] = useState<Client | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const filtered = useMemo(() => {
    if (!search.trim()) return clients;
    const q = search.toLowerCase();
    return clients.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.phone?.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q) ||
        c.company?.toLowerCase().includes(q) ||
        c.telegram?.toLowerCase().includes(q) ||
        (c as any).inn?.toLowerCase().includes(q)
    );
  }, [clients, search]);

  // Контрагенты = B2B clients with INN
  const contractors = useMemo(() => {
    return clients.filter((c) => {
      const ct = (c as any).client_type;
      return ["b2b", "developer", "partner", "agent"].includes(ct);
    });
  }, [clients]);

  const handleSubmit = (data: any) => {
    if (editingClient) {
      updateClient.mutate({ id: editingClient.id, ...data }, { onSuccess: () => { setDialogOpen(false); setEditingClient(null); } });
    } else {
      addClient.mutate(data, { onSuccess: () => setDialogOpen(false) });
    }
  };

  const openEdit = (client: Client) => { setEditingClient(client); setDialogOpen(true); };
  const openNew = () => { setEditingClient(null); setDialogOpen(true); };
  const openDetail = (client: Client) => { setDetailClient(client); setDetailOpen(true); };

  const formatMoney = (v: number) => v ? v.toLocaleString("ru-RU", { maximumFractionDigits: 0 }) + " ₽" : "—";

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 bg-primary/10">
              <Target className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-light tracking-tight">CRM</h1>
              <p className="text-sm text-muted-foreground">Лиды, клиенты, контрагенты, заказы, воронка, задачи и комиссии</p>
            </div>
          </div>
        </motion.div>

        <Tabs defaultValue="leads" className="space-y-4">
          <TabsList className="bg-secondary h-auto gap-1 p-1.5 flex-wrap">
            <TabsTrigger value="leads" className="text-xs gap-1.5">
              <Target className="w-3 h-3" /> Лиды ({leads.length})
            </TabsTrigger>
            <TabsTrigger value="orders" className="text-xs gap-1.5">
              <ShoppingCart className="w-3 h-3" /> Заказы ({orders.length})
            </TabsTrigger>
            <TabsTrigger value="pipeline" className="text-xs gap-1.5">
              <LayoutGrid className="w-3 h-3" /> Воронка
            </TabsTrigger>
            <TabsTrigger value="clients" className="text-xs gap-1.5">
              <Users className="w-3 h-3" /> Клиенты ({clients.length})
            </TabsTrigger>
            <TabsTrigger value="contractors" className="text-xs gap-1.5">
              <Building2 className="w-3 h-3" /> Контрагенты ({contractors.length})
            </TabsTrigger>
            <TabsTrigger value="tasks" className="text-xs gap-1.5">
              <CheckSquare className="w-3 h-3" /> Задачи
            </TabsTrigger>
            <TabsTrigger value="commissions" className="text-xs gap-1.5">
              <DollarSign className="w-3 h-3" /> Комиссии
            </TabsTrigger>
          </TabsList>

          {/* ===== LEADS TAB ===== */}
          <TabsContent value="leads">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <LeadsTab />
            </motion.div>
          </TabsContent>

          {/* ===== ORDERS TAB ===== */}
          <TabsContent value="orders">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <OrdersTab />
            </motion.div>
          </TabsContent>

          {/* ===== PIPELINE TAB ===== */}
          <TabsContent value="pipeline">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <PipelineBoard />
            </motion.div>
          </TabsContent>

          {/* ===== CLIENTS TAB ===== */}
          <TabsContent value="clients">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <div className="flex items-center gap-3 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input placeholder="Поиск по имени, телефону, email, ИНН..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
                </div>
                <Button onClick={openNew} className="gap-2 shrink-0">
                  <UserPlus className="w-4 h-4" /> Добавить
                </Button>
              </div>

              {isLoading ? (
                <div className="text-center py-12 text-muted-foreground">Загрузка...</div>
              ) : filtered.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="py-12 text-center">
                    <Users className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
                    <p className="text-muted-foreground text-sm">
                      {search ? "Ничего не найдено" : "Клиентов пока нет. Нажмите «Добавить» чтобы создать первого."}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="border border-border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Имя</TableHead>
                        <TableHead>Тип</TableHead>
                        <TableHead>Контакты</TableHead>
                        <TableHead>Компания</TableHead>
                        <TableHead className="w-[100px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filtered.map((client) => (
                        <TableRow key={client.id} className="cursor-pointer" onClick={() => openDetail(client)}>
                          <TableCell className="font-medium">{client.name}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-[10px]">
                              {CLIENT_TYPE_LABELS[(client as any).client_type] || "B2C"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                              {client.phone && <span className="inline-flex items-center gap-1"><Phone className="w-3 h-3" /> {client.phone}</span>}
                              {client.email && <span className="inline-flex items-center gap-1"><Mail className="w-3 h-3" /> {client.email}</span>}
                              {client.telegram && <span className="inline-flex items-center gap-1"><MessageCircle className="w-3 h-3" /> {client.telegram}</span>}
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">
                            {client.company && <span className="inline-flex items-center gap-1"><Building2 className="w-3 h-3 text-muted-foreground" /> {client.company}</span>}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(client)}>
                                <Pencil className="w-3.5 h-3.5" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Удалить клиента?</AlertDialogTitle>
                                    <AlertDialogDescription>Клиент «{client.name}» будет удалён без возможности восстановления.</AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Отмена</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => deleteClient.mutate(client.id)}>Удалить</AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </motion.div>
          </TabsContent>

          {/* ===== CONTRACTORS TAB ===== */}
          <TabsContent value="contractors">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <div className="flex items-center gap-3 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input placeholder="Поиск по ИНН, названию компании..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
                </div>
                <Button onClick={openNew} className="gap-2 shrink-0">
                  <UserPlus className="w-4 h-4" /> Добавить контрагента
                </Button>
              </div>

              {contractors.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="py-12 text-center">
                    <Building2 className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
                    <p className="text-muted-foreground text-sm">Контрагентов пока нет. Добавьте клиента с типом B2B, Агент, Партнёр или Застройщик.</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="border border-border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Компания</TableHead>
                        <TableHead>Тип</TableHead>
                        <TableHead>ИНН</TableHead>
                        <TableHead>Контакт</TableHead>
                        <TableHead>Условия</TableHead>
                        <TableHead className="w-[80px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {contractors.map((client) => (
                        <TableRow key={client.id} className="cursor-pointer" onClick={() => openDetail(client)}>
                          <TableCell className="font-medium">{client.company || client.name}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-[10px]">
                              {CLIENT_TYPE_LABELS[(client as any).client_type] || "B2B"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs font-mono">{(client as any).inn || "—"}</TableCell>
                          <TableCell className="text-xs">{client.name}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">{(client as any).payment_terms || "—"}</TableCell>
                          <TableCell>
                            <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(client)}>
                                <Pencil className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </motion.div>
          </TabsContent>

          {/* ===== TASKS TAB ===== */}
          <TabsContent value="tasks">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="p-4">
                <TaskList />
              </Card>
            </motion.div>
          </TabsContent>

          {/* ===== COMMISSIONS TAB ===== */}
          <TabsContent value="commissions">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              {!commissions?.length ? (
                <Card className="border-dashed">
                  <CardContent className="py-12 text-center">
                    <DollarSign className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
                    <p className="text-muted-foreground text-sm">Комиссий пока нет. Они создаются автоматически при оформлении заказов через агентов.</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="border border-border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Заказ</TableHead>
                        <TableHead>Сумма комиссии</TableHead>
                        <TableHead>Статус</TableHead>
                        <TableHead>Начислена</TableHead>
                        <TableHead>Выплачена</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {commissions.map((c) => (
                        <TableRow key={c.id}>
                          <TableCell className="text-sm font-mono">{c.order?.number || c.order_id?.slice(0, 8)}</TableCell>
                          <TableCell className="font-medium">{formatMoney(c.amount)}</TableCell>
                          <TableCell>
                            <Badge variant={c.status === "paid" ? "default" : "outline"} className="text-[10px]">
                              {COMMISSION_STATUS_LABELS[c.status] || c.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {c.calculated_at ? new Date(c.calculated_at).toLocaleDateString("ru-RU") : "—"}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {c.paid_at ? new Date(c.paid_at).toLocaleDateString("ru-RU") : "—"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>

      <ClientFormDialog
        open={dialogOpen}
        onOpenChange={(v) => { setDialogOpen(v); if (!v) setEditingClient(null); }}
        client={editingClient}
        onSubmit={handleSubmit}
        isPending={addClient.isPending || updateClient.isPending}
      />

      <ClientDetailDialog
        client={detailClient}
        open={detailOpen}
        onOpenChange={(v) => { setDetailOpen(v); if (!v) setDetailClient(null); }}
        onEdit={() => { if (detailClient) { setDetailOpen(false); openEdit(detailClient); } }}
      />
    </AppLayout>
  );
}
