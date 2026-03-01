import { motion } from "framer-motion";
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
import { DollarSign, Palette, Users, FileText } from "lucide-react";

export default function AdminPage() {
  const { allSettings, loading } = usePricing();

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <h1 className="text-2xl font-bold mb-1">Панель администратора</h1>
          <p className="text-muted-foreground text-sm mb-6">Управление ценами, продуктами, пользователями и документами</p>
        </motion.div>

        <Tabs defaultValue="pricing" className="space-y-6">
          <TabsList className="bg-secondary flex-wrap h-auto gap-1 p-1.5">
            {/* Продукты и цены */}
            <div className="flex items-center gap-0.5">
              <span className="text-[10px] text-muted-foreground px-1.5 hidden sm:inline"><DollarSign className="w-3 h-3 inline -mt-0.5" /> Продукты</span>
              <TabsTrigger value="pricing" className="text-xs">Цены</TabsTrigger>
              <TabsTrigger value="colors" className="text-xs">Цвета</TabsTrigger>
              <TabsTrigger value="icons" className="text-xs">Иконки</TabsTrigger>
            </div>

            <div className="w-px h-5 bg-border mx-1 hidden sm:block" />

            {/* Пользователи */}
            <div className="flex items-center gap-0.5">
              <span className="text-[10px] text-muted-foreground px-1.5 hidden sm:inline"><Users className="w-3 h-3 inline -mt-0.5" /> Люди</span>
              <TabsTrigger value="users" className="text-xs">Пользователи</TabsTrigger>
              <TabsTrigger value="calculations" className="text-xs">Расчёты</TabsTrigger>
            </div>

            <div className="w-px h-5 bg-border mx-1 hidden sm:block" />

            {/* Настройки и документы */}
            <div className="flex items-center gap-0.5">
              <span className="text-[10px] text-muted-foreground px-1.5 hidden sm:inline"><FileText className="w-3 h-3 inline -mt-0.5" /> Настройки</span>
              <TabsTrigger value="company" className="text-xs">Контакты</TabsTrigger>
              <TabsTrigger value="template" className="text-xs">Шаблон печати</TabsTrigger>
            </div>
          </TabsList>

          <TabsContent value="pricing"><PricingTab allSettings={allSettings} loading={loading} /></TabsContent>
          <TabsContent value="colors"><ColorsTab /></TabsContent>
          <TabsContent value="icons"><ProductIconsTab /></TabsContent>
          <TabsContent value="users"><UsersTab /></TabsContent>
          <TabsContent value="calculations"><CalculationsTab /></TabsContent>
          <TabsContent value="company"><CompanySettingsTab /></TabsContent>
          <TabsContent value="template"><PrintTemplateTab /></TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
