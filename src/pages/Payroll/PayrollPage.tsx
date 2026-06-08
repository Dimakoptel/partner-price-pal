import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Clock, Wallet, Wrench, Calculator } from "lucide-react";
import AppLayout from "@/components/AppLayout";
import EmployeesTab from "./EmployeesTab";
import TimesheetsTab from "./TimesheetsTab";
import PayrollReportTab from "./PayrollReportTab";
import OperationsTab from "./OperationsTab";
import CostCalcTab from "./CostCalcTab";

export default function PayrollPage() {
  return (
    <AppLayout>
      <div className="container mx-auto p-3 md:p-6 space-y-4 md:space-y-6">
        <div className="print:hidden">
          <h1 className="text-2xl md:text-3xl font-bold">Расчёт зарплаты</h1>
          <p className="text-muted-foreground text-sm">Учёт времени, ЗП сотрудников и себестоимость изделий</p>
        </div>

        <Tabs defaultValue="cost" className="space-y-4">
          <TabsList className="print:hidden flex w-full overflow-x-auto justify-start">
            <TabsTrigger value="cost"><Calculator className="mr-1 h-4 w-4" />Себестоимость</TabsTrigger>
            <TabsTrigger value="report"><Wallet className="mr-1 h-4 w-4" />Расчёт ЗП</TabsTrigger>
            <TabsTrigger value="timesheets"><Clock className="mr-1 h-4 w-4" />Табель</TabsTrigger>
            <TabsTrigger value="employees"><Users className="mr-1 h-4 w-4" />Сотрудники</TabsTrigger>
            <TabsTrigger value="operations"><Wrench className="mr-1 h-4 w-4" />Операции</TabsTrigger>
          </TabsList>
          <TabsContent value="cost"><CostCalcTab /></TabsContent>
          <TabsContent value="report"><PayrollReportTab /></TabsContent>
          <TabsContent value="timesheets"><TimesheetsTab /></TabsContent>
          <TabsContent value="employees"><EmployeesTab /></TabsContent>
          <TabsContent value="operations"><OperationsTab /></TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}

