import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { CartProvider } from "@/hooks/useCart";
import { ProtectedRoute, AdminRoute, PartnerRoute } from "@/components/ProtectedRoute";
import AuthPage from "./pages/AuthPage";
import Index from "./pages/Index";
import CalculatorPage from "./pages/CalculatorPage";

import HistoryPage from "./pages/HistoryPage";
import AdminPage from "./pages/AdminPage";
import NotFound from "./pages/NotFound";
import AdminChecklistPage from "./pages/AdminChecklistPage";
import DocsPage from "./pages/DocsPage";
import ClientsPage from "./pages/ClientsPage";
import ProductionPage from "./pages/ProductionPage";
import WarehousePage from "./pages/WarehousePage";
import PriceListPage from "./pages/PriceListPage";
import AdminLaunchChecklistPage from "./pages/AdminLaunchChecklistPage";

// Partner pages
import PartnerDashboardPage from "./pages/partner/PartnerDashboardPage";
import PartnerRequestsPage from "./pages/partner/PartnerRequestsPage";
import PartnerNewRequestPage from "./pages/partner/PartnerNewRequestPage";
import PartnerRequestDetailPage from "./pages/partner/PartnerRequestDetailPage";
import PartnerPriceListPage from "./pages/partner/PartnerPriceListPage";
import PartnerWaitingPage from "./pages/partner/PartnerWaitingPage";

const queryClient = new QueryClient();

function AuthRedirect() {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-pulse text-muted-foreground">Загрузка...</div></div>;
  if (user) return <Navigate to="/" replace />;
  return <AuthPage />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <CartProvider>
          <Routes>
            <Route path="/auth" element={<AuthRedirect />} />
            <Route element={<ProtectedRoute />}>
              <Route path="/" element={<Index />} />
              <Route path="/calculator" element={<CalculatorPage />} />
              <Route path="/history" element={<HistoryPage />} />
              <Route path="/docs" element={<DocsPage />} />
              <Route path="/production" element={<ProductionPage />} />
              <Route path="/warehouse" element={<WarehousePage />} />
              <Route path="/crm" element={<ClientsPage />} />
              {/* Legacy route redirect */}
              <Route path="/sales" element={<Navigate to="/crm" replace />} />
              <Route path="/pricelist" element={<PriceListPage />} />
            </Route>
            {/* Partner routes */}
            <Route element={<PartnerRoute />}>
              <Route path="/partner" element={<PartnerDashboardPage />} />
              <Route path="/partner/requests" element={<PartnerRequestsPage />} />
              <Route path="/partner/requests/new" element={<PartnerNewRequestPage />} />
              <Route path="/partner/requests/:id" element={<PartnerRequestDetailPage />} />
              <Route path="/partner/pricelist" element={<PartnerPriceListPage />} />
            </Route>
            <Route element={<AdminRoute />}>
              <Route path="/admin" element={<AdminPage />} />
              <Route path="/admin/checklist" element={<AdminChecklistPage />} />
              <Route path="/admin/launch-checklist" element={<AdminLaunchChecklistPage />} />
              {/* Legacy route redirect */}
              <Route path="/admin/integrations" element={<Navigate to="/admin" replace />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
          </CartProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
