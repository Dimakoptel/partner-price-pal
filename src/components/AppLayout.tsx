import { useAuth } from "@/hooks/useAuth";
import { Link, useLocation } from "react-router-dom";
import { Calculator, Settings, LogOut, User, History, Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/useTheme";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, profile, signOut, isAdmin } = useAuth();
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-md sticky top-0 z-50">
        <div className="container flex items-center justify-between h-14 px-4">
          <Link to="/" className="flex items-center gap-3">
            <span className="text-xl font-bold text-gradient">COZY ART</span>
            <span className="text-xs text-muted-foreground hidden sm:inline">Калькулятор</span>
          </Link>

          <nav className="flex items-center gap-1">
            <Link to="/">
              <Button variant={location.pathname === "/" ? "secondary" : "ghost"} size="sm" className="gap-2">
                <Calculator className="w-4 h-4" />
                <span className="hidden sm:inline">Расчёт</span>
              </Button>
            </Link>

            <Link to="/history">
              <Button variant={location.pathname === "/history" ? "secondary" : "ghost"} size="sm" className="gap-2">
                <History className="w-4 h-4" />
                <span className="hidden sm:inline">История</span>
              </Button>
            </Link>

            {isAdmin && (
              <Link to="/admin">
                <Button variant={location.pathname === "/admin" ? "secondary" : "ghost"} size="sm" className="gap-2">
                  <Settings className="w-4 h-4" />
                  <span className="hidden sm:inline">Админ</span>
                </Button>
              </Link>
            )}

            <Button variant="ghost" size="sm" onClick={toggleTheme} className="ml-1">
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>

            <div className="flex items-center gap-2 ml-2 pl-2 border-l border-border/50">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <User className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{profile?.full_name || user?.email}</span>
              </div>
              <Button variant="ghost" size="sm" onClick={signOut} className="text-muted-foreground hover:text-destructive">
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </nav>
        </div>
      </header>

      <main className="flex-1 container px-4 py-6">
        {children}
      </main>
    </div>
  );
}
