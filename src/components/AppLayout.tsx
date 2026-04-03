import { useAuth } from "@/hooks/useAuth";
import { Link, useLocation } from "react-router-dom";
import {
  Calculator, Settings, LogOut, History,
  Sun, Moon, BookOpen, Menu,
  Factory, Warehouse, ChevronDown, Home, FileSpreadsheet,
  Users, Target, Info, FilePlus, ClipboardList
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/useTheme";
import { useCompanySettings } from "@/hooks/useCompanySettings";
import { usePermissions } from "@/hooks/usePermissions";
import { useState } from "react";

import type { ModuleKey } from "@/hooks/usePermissions";

interface NavItem {
  path: string;
  label: string;
  icon: typeof Calculator;
  module?: ModuleKey;
  adminOnly?: boolean;
  adminOrModule?: boolean;
}

interface NavGroup {
  key: string;
  label: string;
  icon: typeof Calculator;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    key: "calculators",
    label: "Калькуляторы",
    icon: Calculator,
    items: [
      { path: "/calculator", label: "Расчёт изделия", icon: Calculator, module: "calculator" },
      { path: "/history", label: "История", icon: History, module: "history" },
    ],
  },
  {
    key: "crm",
    label: "CRM",
    icon: Target,
    items: [
      { path: "/crm", label: "CRM", icon: Target, module: "clients", adminOrModule: true },
    ],
  },
  {
    key: "production",
    label: "Производство",
    icon: Factory,
    items: [
      { path: "/production", label: "Производство", icon: Factory, module: "calculator" },
    ],
  },
  {
    key: "warehouse",
    label: "Склад",
    icon: Warehouse,
    items: [
      { path: "/warehouse", label: "Склад", icon: Warehouse, module: "calculator" },
    ],
  },
  {
    key: "info",
    label: "Информация",
    icon: Info,
    items: [
      { path: "/docs", label: "Инструкция", icon: BookOpen, module: "docs" },
      { path: "/pricelist", label: "Прайс-лист", icon: FileSpreadsheet },
    ],
  },
];

const PARTNER_NAV_GROUPS: NavGroup[] = [
  {
    key: "requests",
    label: "Запросы",
    icon: ClipboardList,
    items: [
      { path: "/partner/requests", label: "Мои запросы", icon: ClipboardList },
      { path: "/partner/requests/new", label: "Новый запрос", icon: FilePlus },
    ],
  },
  {
    key: "info",
    label: "Информация",
    icon: Info,
    items: [
      { path: "/partner/pricelist", label: "Прайс-лист", icon: FileSpreadsheet },
    ],
  },
];

const STANDALONE_ITEMS: NavItem[] = [
  { path: "/admin", label: "Администрирование", icon: Settings, adminOnly: true },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, profile, signOut, isAdmin, isPartner } = useAuth();
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const { getSetting } = useCompanySettings();
  const { hasAccess } = usePermissions();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    for (const group of NAV_GROUPS) {
      if (group.items.some((item) => item.path === location.pathname)) {
        initial[group.key] = true;
      }
    }
    return initial;
  });

  const logoLightUrl = getSetting("logo_light_url");
  const logoDarkUrl = getSetting("logo_dark_url");
  const logoFallback = getSetting("print_logo_url");
  const logoUrl = theme === "dark"
    ? (logoDarkUrl || logoFallback)
    : (logoLightUrl || logoFallback);

  const canSeeItem = (item: NavItem) => {
    if (item.adminOnly) return isAdmin;
    if (item.adminOrModule) return isAdmin || (item.module && hasAccess(item.module));
    return item.module ? hasAccess(item.module) : true;
  };

  const toggleGroup = (key: string) => {
    setExpandedGroups((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const activeNavGroups = isPartner ? PARTNER_NAV_GROUPS : NAV_GROUPS;
  const homeRoute = isPartner ? "/partner" : "/";

  const visibleGroups = activeNavGroups.map((group) => ({
    ...group,
    items: group.items.filter(canSeeItem),
  })).filter((group) => group.items.length > 0);

  const visibleStandalone = STANDALONE_ITEMS.filter(canSeeItem);

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="flex h-screen overflow-hidden">
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-60 bg-sidebar flex flex-col border-r border-sidebar-border shrink-0 transition-transform lg:translate-x-0 ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}>
        {/* Logo */}
        <div className="px-5 py-5 border-b border-sidebar-border">
          <Link to={homeRoute} className="block" onClick={() => setMobileOpen(false)}>
            {logoUrl ? (
              <img src={logoUrl} alt="Logo" className="h-8 max-w-[140px] object-contain" />
            ) : (
              <div>
                <span className="text-[10px] tracking-[0.3em] text-sidebar-muted uppercase block mb-0.5">MES</span>
                <span className="text-lg font-light tracking-wide text-sidebar-accent-foreground">COZY ART</span>
              </div>
            )}
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-3 overflow-y-auto space-y-1">
          {/* Home */}
          <Link
            to={homeRoute}
            onClick={() => setMobileOpen(false)}
            className={`flex items-center gap-3 px-3 py-2.5 text-sm transition-all ${
              isActive(homeRoute)
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground hover:text-sidebar-accent-foreground hover:bg-sidebar-accent/50"
            }`}
          >
            <Home className={`w-4 h-4 ${isActive(homeRoute) ? "text-sidebar-accent-foreground" : "text-sidebar-muted"}`} />
            <span className="font-light tracking-wide">Главная</span>
          </Link>

          {visibleGroups.map((group) => {
            const isExpanded = expandedGroups[group.key] ?? false;
            const hasActiveChild = group.items.some((item) => item.path === location.pathname);
            const isSingleItem = group.items.length === 1;

            if (isSingleItem) {
              const item = group.items[0];
              const active = isActive(item.path);
              return (
                <Link key={group.key} to={item.path} onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 text-sm transition-all ${active ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground hover:text-sidebar-accent-foreground hover:bg-sidebar-accent/50"}`}
                >
                  <group.icon className={`w-4 h-4 ${active ? "text-sidebar-accent-foreground" : "text-sidebar-muted"}`} />
                  <span className="font-light tracking-wide">{group.label}</span>
                </Link>
              );
            }

            return (
              <div key={group.key}>
                <button onClick={() => toggleGroup(group.key)}
                  className={`flex items-center gap-3 px-3 py-2.5 text-sm transition-all w-full ${hasActiveChild && !isExpanded ? "text-sidebar-accent-foreground" : "text-sidebar-foreground hover:text-sidebar-accent-foreground hover:bg-sidebar-accent/50"}`}
                >
                  <group.icon className={`w-4 h-4 ${hasActiveChild ? "text-sidebar-accent-foreground" : "text-sidebar-muted"}`} />
                  <span className="font-light tracking-wide flex-1 text-left">{group.label}</span>
                  <ChevronDown className={`w-3.5 h-3.5 text-sidebar-muted transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                </button>
                {isExpanded && (
                  <div className="ml-4 pl-3 border-l border-sidebar-border space-y-0.5 mt-0.5 mb-1">
                    {group.items.map((item) => {
                      const active = isActive(item.path);
                      return (
                        <Link key={item.path} to={item.path} onClick={() => setMobileOpen(false)}
                          className={`flex items-center gap-3 px-3 py-2 text-sm transition-all ${active ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground hover:text-sidebar-accent-foreground hover:bg-sidebar-accent/50"}`}
                        >
                          <item.icon className={`w-3.5 h-3.5 ${active ? "text-sidebar-accent-foreground" : "text-sidebar-muted"}`} />
                          <span className="font-light tracking-wide">{item.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

          {visibleStandalone.length > 0 && (
            <div className="pt-2 mt-2 border-t border-sidebar-border space-y-0.5">
              {visibleStandalone.map((item) => {
                const active = isActive(item.path);
                return (
                  <Link key={item.path} to={item.path} onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 text-sm transition-all ${active ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground hover:text-sidebar-accent-foreground hover:bg-sidebar-accent/50"}`}
                  >
                    <item.icon className={`w-4 h-4 ${active ? "text-sidebar-accent-foreground" : "text-sidebar-muted"}`} />
                    <span className="font-light tracking-wide">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          )}
        </nav>

        {/* Theme + User */}
        <div className="p-4 border-t border-sidebar-border space-y-3">
          <button onClick={toggleTheme}
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
            <button onClick={signOut} className="p-2 text-sidebar-muted hover:text-sidebar-accent-foreground transition-colors" title="Выйти">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="lg:hidden flex items-center h-12 px-4 border-b border-border bg-card">
          <button onClick={() => setMobileOpen(true)} className="p-2 -ml-2">
            <Menu className="w-5 h-5 text-muted-foreground" />
          </button>
          <span className="ml-3 text-sm font-light tracking-wide">MES COZY ART</span>
        </header>

        <main className="flex-1 overflow-y-auto bg-background">
          <div className="p-6 lg:p-10">{children}</div>
        </main>
      </div>
    </div>
  );
}
