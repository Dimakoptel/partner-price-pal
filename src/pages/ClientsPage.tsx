import AppLayout from "@/components/AppLayout";
import { motion } from "framer-motion";
import { Users, UserPlus, Search, BarChart3 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const PLANNED_FEATURES = [
  { icon: UserPlus, title: "База клиентов", desc: "Карточки клиентов с контактами, историей заказов и заметками" },
  { icon: Search, title: "Поиск и фильтры", desc: "Быстрый поиск по имени, телефону, статусу заказа" },
  { icon: BarChart3, title: "Аналитика", desc: "Статистика по клиентам, повторные заказы, средний чек" },
];

export default function ClientsPage() {
  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 rounded-xl bg-primary/10">
              <Users className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Клиенты</h1>
              <p className="text-sm text-muted-foreground">CRM — управление клиентской базой</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mt-8"
        >
          <div className="rounded-xl border border-dashed border-border bg-secondary/30 p-8 text-center mb-8">
            <Users className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-2">Раздел в разработке</h2>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              CRM-модуль для работы с клиентами находится в стадии разработки. 
              Здесь будет полноценная система управления клиентской базой.
            </p>
          </div>

          <h3 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wider">Планируемый функционал</h3>
          <div className="grid gap-3">
            {PLANNED_FEATURES.map((f, i) => (
              <motion.div key={f.title} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 + i * 0.1 }}>
                <Card className="bg-secondary/50 border-border/50">
                  <CardContent className="flex items-start gap-3 p-4">
                    <f.icon className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                    <div>
                      <p className="font-medium text-sm">{f.title}</p>
                      <p className="text-xs text-muted-foreground">{f.desc}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </AppLayout>
  );
}
