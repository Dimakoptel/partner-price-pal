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

export default function AdminPage() {
  const { allSettings, loading } = usePricing();

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <h1 className="text-2xl font-bold mb-1">Панель администратора</h1>
          <p className="text-muted-foreground text-sm mb-6">Управление ценами, цветами, контактами и расчётами</p>
        </motion.div>

        <Tabs defaultValue="pricing" className="space-y-6">
          <TabsList className="bg-secondary flex-wrap">
            <TabsTrigger value="pricing">Цены</TabsTrigger>
            <TabsTrigger value="colors">Цвета</TabsTrigger>
            <TabsTrigger value="icons">Иконки</TabsTrigger>
            <TabsTrigger value="company">Контакты</TabsTrigger>
            <TabsTrigger value="users">Пользователи</TabsTrigger>
            <TabsTrigger value="calculations">Расчёты</TabsTrigger>
            <TabsTrigger value="template">Шаблон печати</TabsTrigger>
          </TabsList>

          <TabsContent value="pricing"><PricingTab allSettings={allSettings} loading={loading} /></TabsContent>
          <TabsContent value="colors"><ColorsTab /></TabsContent>
          <TabsContent value="icons"><ProductIconsTab /></TabsContent>
          <TabsContent value="company"><CompanySettingsTab /></TabsContent>
          <TabsContent value="users"><UsersTab /></TabsContent>
          <TabsContent value="calculations"><CalculationsTab /></TabsContent>
          <TabsContent value="template"><PrintTemplateTab /></TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
