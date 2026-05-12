import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Clock, Wallet } from "lucide-react";
import AppLayout from "@/components/AppLayout";
import EmployeesTab from "./EmployeesTab";
import TimesheetsTab from "./TimesheetsTab";
import PayrollReportTab from "./PayrollReportTab";

export default function PayrollPage() {
  return (
    <AppLayout>
      <div className="container mx-auto p-4 md:p-6 space-y-6">
        <div className="print:hidden">
          <h1 className="text-2xl md:text-3xl font-bold">Расчёт зарплаты</h1>
          <p className="text-muted-foreground">Учёт времени и почасовой расчёт оплаты сотрудников производства</p>
        </div>

        <Tabs defaultValue="report" className="space-y-4">
          <TabsList className="print:hidden">
            <TabsTrigger value="report"><Wallet className="mr-1 h-4 w-4" />Расчёт ЗП</TabsTrigger>
            <TabsTrigger value="timesheets"><Clock className="mr-1 h-4 w-4" />Табель</TabsTrigger>
            <TabsTrigger value="employees"><Users className="mr-1 h-4 w-4" />Сотрудники</TabsTrigger>
          </TabsList>
          <TabsContent value="report"><PayrollReportTab /></TabsContent>
          <TabsContent value="timesheets"><TimesheetsTab /></TabsContent>
          <TabsContent value="employees"><EmployeesTab /></TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
