import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { motion } from "framer-motion";
import { Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ProtectedRoute() {
  const { user, loading, isApproved, isAdmin, signOut } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Загрузка...</div>
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;

  if (!isApproved && !isAdmin) {
    return <PendingApprovalScreen onSignOut={signOut} />;
  }

  return <Outlet />;
}

export function AdminRoute() {
  const { user, loading, isAdmin } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Загрузка...</div>
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;
  if (!isAdmin) return <Navigate to="/" replace />;
  return <Outlet />;
}

function PendingApprovalScreen({ onSignOut }: { onSignOut: () => void }) {
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
          <p className="text-muted-foreground text-sm">
            Ваш аккаунт зарегистрирован и ожидает одобрения администратором.
            Вы получите доступ к калькулятору после подтверждения.
          </p>
          <Button variant="outline" onClick={onSignOut} className="mt-4">
            Выйти
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
