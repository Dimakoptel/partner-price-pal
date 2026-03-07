import { useAuth } from "@/hooks/useAuth";
import { Link, useLocation } from "react-router-dom";
import {
  Calculator, Settings, LogOut, User, History,
  Sun, Moon, Package, BookOpen, Users, Menu, X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/useTheme";
import { useCompanySettings } from "@/hooks/useCompanySettings";
import { usePermissions } from "@/hooks/usePermissions";
import { useState } from "react";

const NAV_ITEMS = [
  { path: "/", label: "Расчёт", icon: Calculator, module: "calculator" },
  { path: "/history", label: "История", icon: History, module: "history" },
  { path: "/box", label: "Ящик", icon: Package, module: "box_calculator" },
  { path: "/docs", label: "Инструкция", icon: BookOpen, module: "docs" },
  { path: "/clients", label: "Клиенты", icon: Users, module: "clients", adminOrModule: true },
  { path: "/admin", label: "Администрирование", icon: Settings, adminOnly: true },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, profile, signOut, isAdmin } = useAuth();
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const { getSetting } = useCompanySettings();
  const { hasAccess } = usePermissions();
  const [mobileOpen, setMobileOpen] = useState(false);

  const logoUrl = getSetting("print_logo_url");

  const visibleNav = NAV_ITEMS.filter((item) => {
    if (item.adminOnly) return isAdmin;
    if (item.adminOrModule) return isAdmin || hasAccess(item.module);
    return hasAccess(item.module);
  });

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-56 bg-sidebar flex flex-col border-r border-sidebar-border shrink-0 transition-transform lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo */}
        <div className="px-6 py-6 border-b border-sidebar-border">
          <Link to="/" className="block" onClick={() => setMobileOpen(false)}>
            {logoUrl ? (
              <img src={logoUrl} alt="Logo" className="h-8 max-w-[140px] object-contain brightness-0 invert" />
            ) : (
              <div>
                <span className="text-[10px] tracking-[0.3em] text-sidebar-muted uppercase block mb-1">MES</span>
                <span className="text-lg font-light tracking-wide text-sidebar-accent-foreground">COZY ART</span>
              </div>
            )}
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-6 px-3 space-y-0.5 overflow-y-auto">
          {visibleNav.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 text-sm transition-all ${
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground hover:text-sidebar-accent-foreground hover:bg-sidebar-accent/50"
                }`}
              >
                <item.icon className={`w-4 h-4 ${isActive ? "text-sidebar-accent-foreground" : "text-sidebar-muted"}`} />
                <span className="font-light tracking-wide">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Theme + User */}
        <div className="p-4 border-t border-sidebar-border space-y-3">
          <button
            onClick={toggleTheme}
            className="flex items-center gap-3 px-3 py-2 text-sm text-sidebar-foreground hover:text-sidebar-accent-foreground transition-colors w-full"
          >
            {theme === "dark" ? <Sun className="w-4 h-4 text-sidebar-muted" /> : <Moon className="w-4 h-4 text-sidebar-muted" />}
            <span className="font-light tracking-wide">{theme === "dark" ? "Светлая тема" : "Тёмная тема"}</span>
          </button>

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-sidebar-accent flex items-center justify-center text-xs font-medium text-sidebar-accent-foreground">
              {(profile?.full_name || user?.email || "U").slice(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium text-sidebar-accent-foreground truncate">
                {profile?.full_name || user?.email}
              </div>
              <div className="text-[10px] text-sidebar-muted tracking-wider uppercase">
                {isAdmin ? "Админ" : "Пользователь"}
              </div>
            </div>
            <button
              onClick={signOut}
              className="p-2 text-sidebar-muted hover:text-sidebar-accent-foreground transition-colors"
              title="Выйти"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile header */}
        <header className="lg:hidden flex items-center h-12 px-4 border-b border-border bg-card">
          <button onClick={() => setMobileOpen(true)} className="p-2 -ml-2">
            <Menu className="w-5 h-5 text-muted-foreground" />
          </button>
          <span className="ml-3 text-sm font-light tracking-wide">MES COZY ART</span>
        </header>

        <main className="flex-1 overflow-y-auto bg-background">
          <div className="p-6 lg:p-10">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
