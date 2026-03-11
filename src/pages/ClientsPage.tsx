import { useState, useMemo } from "react";
import AppLayout from "@/components/AppLayout";
import { motion } from "framer-motion";
import { Users, UserPlus, Search, Pencil, Trash2, Phone, Mail, Building2, MessageCircle, LayoutGrid, List, CheckSquare } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useClients, type Client } from "@/hooks/useClients";
import ClientFormDialog from "@/components/clients/ClientFormDialog";
import ClientDetailDialog from "@/components/crm/ClientDetailDialog";
import PipelineBoard from "@/components/crm/PipelineBoard";
import TaskList from "@/components/crm/TaskList";

export default function ClientsPage() {
  const { clients, isLoading, addClient, updateClient, deleteClient } = useClients();
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
        c.telegram?.toLowerCase().includes(q)
    );
  }, [clients, search]);

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

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 rounded-xl bg-primary/10">
              <Users className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Продажи</h1>
              <p className="text-sm text-muted-foreground">Лиды, клиенты, сделки и задачи</p>
            </div>
          </div>
        </motion.div>

        <Tabs defaultValue="pipeline" className="space-y-4">
          <TabsList>
            <TabsTrigger value="pipeline" className="gap-1.5">
              <LayoutGrid className="w-4 h-4" /> Воронка
            </TabsTrigger>
            <TabsTrigger value="clients" className="gap-1.5">
              <List className="w-4 h-4" /> Клиенты ({clients.length})
            </TabsTrigger>
            <TabsTrigger value="tasks" className="gap-1.5">
              <CheckSquare className="w-4 h-4" /> Задачи
            </TabsTrigger>
          </TabsList>

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
                  <Input placeholder="Поиск по имени, телефону, email..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
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
                <Card>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Имя</TableHead>
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
                </Card>
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
