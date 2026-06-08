import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { usePricing } from "@/hooks/usePricing";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PricingTab from "@/components/admin/PricingTab";
import ColorsTab from "@/components/admin/ColorsTab";
import CompanySettingsTab from "@/components/admin/CompanySettingsTab";
import CalculationsTab from "@/components/admin/CalculationsTab";
import PrintTemplateTab from "@/components/admin/PrintTemplateTab";
import ProductIconsTab from "@/components/admin/ProductIconsTab";
import UsersTab from "@/components/admin/UsersTab";
import AccessGroupsTab from "@/components/admin/AccessGroupsTab";
import NomenclatureTab from "@/components/admin/NomenclatureTab";
import CategoriesTab from "@/components/admin/CategoriesTab";
import DictionariesTab from "@/components/admin/DictionariesTab";
import SystemSettingsTab from "@/components/admin/SystemSettingsTab";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useIntegrationQueue, useRetryIntegration } from "@/hooks/useIntegrationQueue";
import {
  DollarSign, Palette, Users, FileText, ShieldCheck,
  Image, BookOpen, Building2, LayoutList, Database, Sprout,
  ClipboardCheck, Calculator, Factory, Warehouse, RefreshCw,
  Settings, SlidersHorizontal, AlertCircle, CheckCircle, Clock, Send, Target
} from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type AdminSection = "calculators" | "references" | "sales" | "production" | "warehouse" | "integrations" | "settings" | "system";

const SECTIONS: { key: AdminSection; label: string; icon: typeof DollarSign }[] = [
  { key: "calculators", label: "Калькуляторы", icon: Calculator },
  { key: "references", label: "Справочники", icon: BookOpen },
  { key: "sales", label: "Продажи", icon: Target },
  { key: "production", label: "Производство", icon: Factory },
  { key: "warehouse", label: "Склад", icon: Warehouse },
  { key: "integrations", label: "Интеграции", icon: RefreshCw },
  { key: "settings", label: "Системные настройки", icon: SlidersHorizontal },
  { key: "system", label: "Система", icon: Settings },
];

export default function AdminPage() {
  const { allSettings, loading } = usePricing();
  const [section, setSection] = useState<AdminSection>("calculators");
  const [seeding, setSeeding] = useState(false);

  const handleSeed = async () => {
    setSeeding(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await supabase.functions.invoke("seed-sales-demo", {
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      if (res.error) throw res.error;
      toast.success(`Демо-данные созданы: ${res.data.created.clients} клиентов, ${res.data.created.leads} лидов, ${res.data.created.orders} заказов`);
    } catch (e: any) {
      toast.error("Ошибка seed: " + (e.message || e));
    } finally {
      setSeeding(false);
    }
  };

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-light text-foreground tracking-tight">
                Администрирование
              </h1>
              <p className="text-muted-foreground text-sm mt-2 mb-8">
                Управление системой MES COZY ART
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link to="/admin/checklist" className="gap-2">
                  <ClipboardCheck className="w-4 h-4" /> Чек-лист
                </Link>
              </Button>
              <Button variant="outline" size="sm" onClick={handleSeed} disabled={seeding} className="gap-2">
                <Sprout className="w-4 h-4" />
                {seeding ? "Создание..." : "Демо-данные"}
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Section selector */}
        <div className="flex flex-wrap gap-2 mb-8">
          {SECTIONS.map((s) => (
            <button
              key={s.key}
              onClick={() => setSection(s.key)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm transition-all border ${
                section === s.key
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-muted-foreground border-border hover:text-foreground hover:border-foreground/30"
              }`}
            >
              <s.icon className="w-4 h-4" />
              <span className="font-light tracking-wide">{s.label}</span>
            </button>
          ))}
        </div>

        {/* Калькуляторы */}
        {section === "calculators" && (
          <Tabs defaultValue="pricing" className="space-y-6">
            <TabsList className="bg-secondary h-auto gap-1 p-1.5 flex-wrap">
              <TabsTrigger value="pricing" className="text-xs gap-1.5">
                <DollarSign className="w-3 h-3" /> Цены
              </TabsTrigger>
              <TabsTrigger value="colors" className="text-xs gap-1.5">
                <Palette className="w-3 h-3" /> Цвета
              </TabsTrigger>
              <TabsTrigger value="icons" className="text-xs gap-1.5">
                <Image className="w-3 h-3" /> Иконки продуктов
              </TabsTrigger>
              <TabsTrigger value="calculations" className="text-xs gap-1.5">
                <LayoutList className="w-3 h-3" /> Расчёты
              </TabsTrigger>
            </TabsList>
            <TabsContent value="pricing"><PricingTab allSettings={allSettings} loading={loading} /></TabsContent>
            <TabsContent value="colors"><ColorsTab /></TabsContent>
            <TabsContent value="icons"><ProductIconsTab /></TabsContent>
            <TabsContent value="calculations"><CalculationsTab /></TabsContent>
          </Tabs>
        )}

        {/* Справочники */}
        {section === "references" && (
          <Tabs defaultValue="nomenclature" className="space-y-6">
            <TabsList className="bg-secondary h-auto gap-1 p-1.5 flex-wrap">
              <TabsTrigger value="nomenclature" className="text-xs gap-1.5">
                <LayoutList className="w-3 h-3" /> Номенклатура
              </TabsTrigger>
              <TabsTrigger value="categories" className="text-xs gap-1.5">
                <LayoutList className="w-3 h-3" /> Категории товаров
              </TabsTrigger>
              <TabsTrigger value="dictionaries" className="text-xs gap-1.5">
                <Database className="w-3 h-3" /> Справочники системы
              </TabsTrigger>
            </TabsList>
            <TabsContent value="nomenclature"><NomenclatureTab /></TabsContent>
            <TabsContent value="categories"><CategoriesTab /></TabsContent>
            <TabsContent value="dictionaries"><DictionariesTab /></TabsContent>
          </Tabs>
        )}

        {/* Продажи */}
        {section === "sales" && (
          <Tabs defaultValue="contractors" className="space-y-6">
            <TabsList className="bg-secondary h-auto gap-1 p-1.5 flex-wrap">
              <TabsTrigger value="contractors" className="text-xs gap-1.5">
                <Building2 className="w-3 h-3" /> Контрагенты
              </TabsTrigger>
            </TabsList>
            <TabsContent value="contractors">
              <div className="border border-border p-8 bg-card text-center">
                <Building2 className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
                <h3 className="text-sm font-medium mb-1">Контрагенты</h3>
                <p className="text-xs text-muted-foreground">Справочник контрагентов — поставщики, подрядчики, партнёры. Управление клиентами доступно в CRM.</p>
              </div>
            </TabsContent>
          </Tabs>
        )}

        {/* Производство */}
        {section === "production" && (
          <div className="border border-border p-8 bg-card text-center">
            <Factory className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
            <h3 className="text-sm font-medium mb-1">Настройки производства</h3>
            <p className="text-xs text-muted-foreground">
              Этапы производства управляются через справочники системы (тип: production_stage, production_order_status).
            </p>
            <Button variant="outline" size="sm" className="mt-4" onClick={() => setSection("references")}>
              Перейти в справочники
            </Button>
          </div>
        )}

        {/* Склад */}
        {section === "warehouse" && (
          <div className="border border-border p-8 bg-card text-center">
            <Warehouse className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
            <h3 className="text-sm font-medium mb-1">Настройки склада</h3>
            <p className="text-xs text-muted-foreground">
              Настройки резервирования и сроков хранения управляются через системные настройки (reserve_hours_paid, reserve_hours_unpaid).
            </p>
          </div>
        )}

        {/* Интеграции */}
        {section === "integrations" && <IntegrationsSection />}

        {/* Системные настройки */}
        {section === "settings" && <SystemSettingsTab />}

        {/* Система */}
        {section === "system" && (
          <Tabs defaultValue="users" className="space-y-6">
            <TabsList className="bg-secondary h-auto gap-1 p-1.5 flex-wrap">
              <TabsTrigger value="users" className="text-xs gap-1.5">
                <Users className="w-3 h-3" /> Пользователи
              </TabsTrigger>
              <TabsTrigger value="access" className="text-xs gap-1.5">
                <ShieldCheck className="w-3 h-3" /> Группы доступа
              </TabsTrigger>
              <TabsTrigger value="company" className="text-xs gap-1.5">
                <Building2 className="w-3 h-3" /> Контакты компании
              </TabsTrigger>
              <TabsTrigger value="template" className="text-xs gap-1.5">
                <FileText className="w-3 h-3" /> Шаблон печати
              </TabsTrigger>
            </TabsList>
            <TabsContent value="users"><UsersTab /></TabsContent>
            <TabsContent value="access"><AccessGroupsTab /></TabsContent>
            <TabsContent value="company"><CompanySettingsTab /></TabsContent>
            <TabsContent value="template"><PrintTemplateTab /></TabsContent>
          </Tabs>
        )}
      </div>
    </AppLayout>
  );
}

function IntegrationsSection() {
  const { data: queue, isLoading } = useIntegrationQueue();
  const retryMutation = useRetryIntegration();

  const statusIcon = (status: string) => {
    switch (status) {
      case "pending": return <Clock className="h-4 w-4 text-amber-500" />;
      case "sent": return <Send className="h-4 w-4 text-blue-500" />;
      case "confirmed": return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "error": return <AlertCircle className="h-4 w-4 text-destructive" />;
      default: return null;
    }
  };

  const stats = {
    pending: queue?.filter((q) => q.status === "pending").length || 0,
    sent: queue?.filter((q) => q.status === "sent").length || 0,
    confirmed: queue?.filter((q) => q.status === "confirmed").length || 0,
    error: queue?.filter((q) => q.status === "error").length || 0,
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "В очереди", count: stats.pending, color: "text-amber-500" },
          { label: "Отправлено", count: stats.sent, color: "text-blue-500" },
          { label: "Подтверждено", count: stats.confirmed, color: "text-green-500" },
          { label: "Ошибки", count: stats.error, color: "text-destructive" },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="pt-6 text-center">
              <p className={`text-3xl font-bold ${stat.color}`}>{stat.count}</p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Queue table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Очередь обмена с 1С</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground py-4 text-center">Загрузка...</p>
          ) : !queue?.length ? (
            <p className="text-sm text-muted-foreground py-4 text-center">Очередь пуста</p>
          ) : (
            <div className="border rounded-md overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Время</TableHead>
                    <TableHead className="text-xs">Направление</TableHead>
                    <TableHead className="text-xs">Сущность</TableHead>
                    <TableHead className="text-xs">Статус</TableHead>
                    <TableHead className="text-xs">Попытки</TableHead>
                    <TableHead className="text-xs w-24" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {queue.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="text-xs">
                        {new Date(item.created_at).toLocaleString("ru-RU")}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {item.direction === "to_1c" ? "→ 1С" : "← 1С"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs">
                        {item.entity_type}
                        {item.entity_id && (
                          <span className="text-muted-foreground ml-1">
                            ({item.entity_id.slice(0, 8)}…)
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          {statusIcon(item.status)}
                          <span className="text-xs">{item.status}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs">
                        {item.retry_count} / {item.max_retries}
                      </TableCell>
                      <TableCell>
                        {item.status === "error" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs"
                            onClick={() => retryMutation.mutate(item.id)}
                            disabled={retryMutation.isPending}
                          >
                            <RefreshCw className="h-3 w-3 mr-1" />
                            Повтор
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* WordPress webhook info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Webhook для WordPress</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p className="text-muted-foreground">
            Для приёма заявок с сайта используйте следующий endpoint:
          </p>
          <code className="block bg-muted px-3 py-2 rounded text-xs break-all">
            POST {import.meta.env.VITE_SUPABASE_URL}/functions/v1/webhook-wordpress-lead
          </code>
          <p className="text-muted-foreground">
            Заголовок: <code className="bg-muted px-1 rounded">Authorization: Bearer YOUR_API_KEY</code>
          </p>
          <p className="text-muted-foreground">
            Тело: <code className="bg-muted px-1 rounded">{"{ name, phone, email, source, message }"}</code>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
