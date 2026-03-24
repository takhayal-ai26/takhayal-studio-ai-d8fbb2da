import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppProvider } from "@/context/AppContext";
import { LanguageProvider } from "@/i18n/LanguageContext";
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
              <Route path="/home" element={<PortalHome />} />
              <Route path="/studio" element={<Canvas />} />
              <Route path="/pricing" element={<Pricing />} />
              <Route path="/tools" element={<ToolsDirectory />} />
              <Route path="/tools/:toolId" element={<ToolPage />} />
              <Route path="/community" element={<Community />} />
              <Route path="/templates" element={<Templates />} />

              {/* Admin Panel */}
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<AdminDashboard />} />
                <Route path="users" element={<AdminUsers />} />
                <Route path="billing" element={<AdminBilling />} />
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

              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </AppProvider>
      </LanguageProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
