import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Clock } from "lucide-react";

export default function PartnerWaitingPage() {
  const { signOut, pendingRole } = useAuth();

  const roleLabels: Record<string, string> = {
    dealer: "Дилер",
    agent: "Агент",
    designer: "Дизайнер",
  };

  const roleLabel = pendingRole ? roleLabels[pendingRole] || pendingRole : "";

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md text-center"
      >
        <div className="glass-panel p-8 space-y-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-secondary flex items-center justify-center">
            <Clock className="w-8 h-8 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-semibold">Ожидание подтверждения</h2>
          {roleLabel && (
            <p className="text-sm text-primary font-medium">Роль: {roleLabel}</p>
          )}
          <p className="text-muted-foreground text-sm">
            Ваш аккаунт зарегистрирован и ожидает одобрения администратором.
            После подтверждения вы получите доступ к личному кабинету партнёра.
          </p>
          <Button variant="outline" onClick={signOut} className="mt-4">
            Выйти
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
