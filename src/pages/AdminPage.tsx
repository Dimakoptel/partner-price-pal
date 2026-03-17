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
import { Button } from "@/components/ui/button";
import {
  DollarSign, Palette, Users, FileText, ShieldCheck,
  Image, BookOpen, Building2, LayoutList, Database, Sprout, ClipboardCheck
} from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type AdminSection = "products" | "people" | "references" | "settings" | "dictionaries";

const SECTIONS: { key: AdminSection; label: string; icon: typeof DollarSign }[] = [
  { key: "products", label: "Продукты и цены", icon: DollarSign },
  { key: "people", label: "Пользователи и доступ", icon: Users },
  { key: "references", label: "Справочники", icon: BookOpen },
  { key: "dictionaries", label: "Справочники системы", icon: Database },
  { key: "settings", label: "Настройки и документы", icon: FileText },
];

export default function AdminPage() {
  const { allSettings, loading } = usePricing();
  const [section, setSection] = useState<AdminSection>("products");
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

        {/* Products & Prices */}
        {section === "products" && (
          <Tabs defaultValue="pricing" className="space-y-6">
            <TabsList className="bg-secondary h-auto gap-1 p-1.5 flex-wrap">
              <TabsTrigger value="pricing" className="text-xs gap-1.5">
                <DollarSign className="w-3 h-3" /> Цены
              </TabsTrigger>
              <TabsTrigger value="colors" className="text-xs gap-1.5">
                <Palette className="w-3 h-3" /> Цвета
              </TabsTrigger>
              <TabsTrigger value="icons" className="text-xs gap-1.5">
                <Image className="w-3 h-3" /> Иконки
              </TabsTrigger>
            </TabsList>
            <TabsContent value="pricing"><PricingTab allSettings={allSettings} loading={loading} /></TabsContent>
            <TabsContent value="colors"><ColorsTab /></TabsContent>
            <TabsContent value="icons"><ProductIconsTab /></TabsContent>
          </Tabs>
        )}

        {/* People & Access */}
        {section === "people" && (
          <Tabs defaultValue="users" className="space-y-6">
            <TabsList className="bg-secondary h-auto gap-1 p-1.5 flex-wrap">
              <TabsTrigger value="users" className="text-xs gap-1.5">
                <Users className="w-3 h-3" /> Пользователи
              </TabsTrigger>
              <TabsTrigger value="calculations" className="text-xs gap-1.5">
                <LayoutList className="w-3 h-3" /> Расчёты
              </TabsTrigger>
              <TabsTrigger value="access" className="text-xs gap-1.5">
                <ShieldCheck className="w-3 h-3" /> Группы доступа
              </TabsTrigger>
            </TabsList>
            <TabsContent value="users"><UsersTab /></TabsContent>
            <TabsContent value="calculations"><CalculationsTab /></TabsContent>
            <TabsContent value="access"><AccessGroupsTab /></TabsContent>
          </Tabs>
        )}

        {/* References */}
        {section === "references" && (
          <Tabs defaultValue="contractors" className="space-y-6">
            <TabsList className="bg-secondary h-auto gap-1 p-1.5 flex-wrap">
              <TabsTrigger value="contractors" className="text-xs gap-1.5">
                <Building2 className="w-3 h-3" /> Контрагенты
              </TabsTrigger>
              <TabsTrigger value="nomenclature" className="text-xs gap-1.5">
                <LayoutList className="w-3 h-3" /> Номенклатура
              </TabsTrigger>
              <TabsTrigger value="categories" className="text-xs gap-1.5">
                <LayoutList className="w-3 h-3" /> Категории товаров
              </TabsTrigger>
            </TabsList>
            <TabsContent value="contractors">
              <div className="border border-border p-8 bg-card text-center">
                <Building2 className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
                <h3 className="text-sm font-medium mb-1">Контрагенты</h3>
                <p className="text-xs text-muted-foreground">Справочник контрагентов — поставщики, подрядчики, партнёры</p>
              </div>
            </TabsContent>
            <TabsContent value="nomenclature">
              <NomenclatureTab />
            </TabsContent>
            <TabsContent value="categories">
              <CategoriesTab />
            </TabsContent>
          </Tabs>
        )}

        {/* Dictionaries & System Settings */}
        {section === "dictionaries" && <DictionariesTab />}

        {/* Settings & Docs */}
        {section === "settings" && (
          <Tabs defaultValue="company" className="space-y-6">
            <TabsList className="bg-secondary h-auto gap-1 p-1.5 flex-wrap">
              <TabsTrigger value="company" className="text-xs gap-1.5">
                <Building2 className="w-3 h-3" /> Контакты
              </TabsTrigger>
              <TabsTrigger value="template" className="text-xs gap-1.5">
                <FileText className="w-3 h-3" /> Шаблон печати
              </TabsTrigger>
            </TabsList>
            <TabsContent value="company"><CompanySettingsTab /></TabsContent>
            <TabsContent value="template"><PrintTemplateTab /></TabsContent>
          </Tabs>
        )}
      </div>
    </AppLayout>
  );
}
