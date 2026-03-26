import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppProvider } from "@/context/AppContext";
import { LanguageProvider } from "@/i18n/LanguageContext";
import { AppLayout } from "@/components/layout/AppLayout";
import Home from "./pages/Home";
import PortalHome from "./pages/PortalHome";
import Canvas from "./pages/Canvas";
import Pricing from "./pages/Pricing";
import ToolPage from "./pages/ToolPage";
import ToolsDirectory from "./pages/ToolsDirectory";
import Community from "./pages/Community";
import Templates from "./pages/Templates";
import NotFound from "./pages/NotFound";

// Admin
import AdminLayout from "./components/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminBilling from "./pages/admin/AdminBilling";
import AdminTools from "./pages/admin/AdminTools";
import AdminModels from "./pages/admin/AdminModels";
import AdminTemplates from "./pages/admin/AdminTemplates";
import AdminContent from "./pages/admin/AdminContent";
import AdminCommunity from "./pages/admin/AdminCommunity";
import AdminMedia from "./pages/admin/AdminMedia";
import AdminAnalytics from "./pages/admin/AdminAnalytics";
import AdminSupport from "./pages/admin/AdminSupport";
import AdminNotifications from "./pages/admin/AdminNotifications";
import AdminIntegrations from "./pages/admin/AdminIntegrations";
import AdminRoles from "./pages/admin/AdminRoles";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminTranslations from "./pages/admin/AdminTranslations";
import AdminPricing from "./pages/admin/AdminPricing";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <LanguageProvider>
        <AppProvider>
          <Toaster />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Home />} />

              {/* Portal pages share persistent navbar */}
              <Route element={<AppLayout />}>
                <Route path="/home" element={<PortalHome />} />
                <Route path="/studio" element={<Canvas />} />
                <Route path="/pricing" element={<Pricing />} />
                <Route path="/tools" element={<ToolsDirectory />} />
                <Route path="/tools/:toolId" element={<ToolPage />} />
                <Route path="/community" element={<Community />} />
                <Route path="/templates" element={<Templates />} />
              </Route>

              {/* Admin Panel */}
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<AdminDashboard />} />
                <Route path="users" element={<AdminUsers />} />
                <Route path="billing" element={<AdminBilling />} />
                <Route path="pricing" element={<AdminPricing />} />
                <Route path="tools" element={<AdminTools />} />
                <Route path="models" element={<AdminModels />} />
                <Route path="templates" element={<AdminTemplates />} />
                <Route path="content" element={<AdminContent />} />
                <Route path="community" element={<AdminCommunity />} />
                <Route path="media" element={<AdminMedia />} />
                <Route path="analytics" element={<AdminAnalytics />} />
                <Route path="support" element={<AdminSupport />} />
                <Route path="notifications" element={<AdminNotifications />} />
                <Route path="integrations" element={<AdminIntegrations />} />
                <Route path="roles" element={<AdminRoles />} />
                <Route path="settings" element={<AdminSettings />} />
                <Route path="translations" element={<AdminTranslations />} />
              </Route>

              <Route path="/users" element={<Navigate to="/admin/users" replace />} />
              <Route path="/billing" element={<Navigate to="/admin/billing" replace />} />
              <Route path="/pricing-economics" element={<Navigate to="/admin/pricing" replace />} />
              <Route path="/models" element={<Navigate to="/admin/models" replace />} />
              <Route path="/content" element={<Navigate to="/admin/content" replace />} />
              <Route path="/media" element={<Navigate to="/admin/media" replace />} />
              <Route path="/analytics" element={<Navigate to="/admin/analytics" replace />} />
              <Route path="/support" element={<Navigate to="/admin/support" replace />} />
              <Route path="/notifications" element={<Navigate to="/admin/notifications" replace />} />
              <Route path="/integrations" element={<Navigate to="/admin/integrations" replace />} />
              <Route path="/roles" element={<Navigate to="/admin/roles" replace />} />
              <Route path="/settings" element={<Navigate to="/admin/settings" replace />} />
              <Route path="/translations" element={<Navigate to="/admin/translations" replace />} />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </AppProvider>
      </LanguageProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
