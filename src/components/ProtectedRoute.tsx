import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { usePermissions, ModuleKey } from "@/hooks/usePermissions";
import { motion } from "framer-motion";
import { Clock, ShieldX } from "lucide-react";
import { Button } from "@/components/ui/button";

const ROUTE_MODULE_MAP: Record<string, ModuleKey> = {
  "/": "calculator",
  "/box": "box_calculator",
  "/history": "history",
  "/docs": "docs",
  "/clients": "clients",
  "/crm": "sales_leads",
  "/production": "production",
  "/warehouse": "warehouse",
  "/pricelist": "docs",
};

const PARTNER_PENDING_ROLES = new Set(["dealer", "agent", "designer", "partner"]);

export function ProtectedRoute() {
  const { user, loading, isApproved, isAdmin, isPartner, signOut, pendingRole } = useAuth();
  const { hasAccess, loading: permLoading } = usePermissions();
  const location = useLocation();

  // Effective partner: explicit role OR approved partner-type pending role
  const isPartnerEffective =
    isPartner || (isApproved && !!pendingRole && PARTNER_PENDING_ROLES.has(pendingRole));

  if (loading || permLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Загрузка...</div>
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;

  // Partners → partner portal (single redirect block; no duplicates)
  if (isPartnerEffective && !location.pathname.startsWith("/partner")) {
    return <Navigate to="/partner" replace />;
  }

  // Non-staff pending role users awaiting approval → waiting page
  if (!isAdmin && !isPartnerEffective && pendingRole && pendingRole !== "staff" && !isApproved) {
    return <Navigate to="/partner/waiting" replace />;
  }

  if (!isApproved && !isAdmin && !isPartnerEffective) {
    return <PendingApprovalScreen onSignOut={signOut} />;
  }

  // Module access (skip for partners on partner routes)
  if (!isPartnerEffective) {
    const moduleKey = ROUTE_MODULE_MAP[location.pathname];
    if (moduleKey && !hasAccess(moduleKey)) {
      return <NoAccessScreen />;
    }
  }

  return <Outlet />;
}

export function PartnerRoute() {
  const { user, loading, isPartner, isApproved, isAdmin, signOut, pendingRole } = useAuth();

  const isPartnerEffective =
    isPartner || (isApproved && !!pendingRole && PARTNER_PENDING_ROLES.has(pendingRole));

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Загрузка...</div>
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;
  if (!isPartnerEffective && !isAdmin) return <Navigate to="/" replace />;
  if (!isApproved && !isAdmin) return <PendingApprovalScreen onSignOut={signOut} />;
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

function NoAccessScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md text-center"
      >
        <div className="glass-panel p-8 space-y-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-secondary flex items-center justify-center">
            <ShieldX className="w-8 h-8 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-semibold">Доступ ограничен</h2>
          <p className="text-muted-foreground text-sm">
            У вас нет доступа к этому разделу. Обратитесь к администратору для получения прав.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
