import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppProvider } from "@/context/AppContext";
import { AuthProvider } from "@/context/AuthContext";
import { LanguageProvider } from "@/i18n/LanguageContext";
import { ThemeProvider } from "@/context/ThemeProvider";
import { AppThemeProvider } from "@/context/AppThemeContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Home from "./pages/Home";
import PortalHome from "./pages/PortalHome";
import Canvas from "./pages/Canvas";
import Pricing from "./pages/Pricing";
import ToolPage from "./pages/ToolPage";
import ToolsDirectory from "./pages/ToolsDirectory";
import Community from "./pages/Community";
import Templates from "./pages/Templates";
import NotFound from "./pages/NotFound";
import LegalPage from "./pages/LegalPage";
import About from "./pages/About";
import AuthCallback from "./pages/AuthCallback";
import ResetPassword from "./pages/ResetPassword";
import Checkout from "./pages/Checkout";
import CheckoutSuccess from "./pages/CheckoutSuccess";

// Admin
import { AdminProtectedRoute } from "./components/AdminProtectedRoute";
import AdminLogin from "./pages/admin/AdminLogin";
import AdminLayout from "./components/admin/AdminLayout";
import AdminUsersMerged from "./pages/admin/AdminUsersMerged";
import AdminStudioConfig from "./pages/admin/AdminStudioConfig";
import AdminCommerce from "./pages/admin/AdminCommerce";
import AdminContentMerged from "./pages/admin/AdminContentMerged";
import AdminAnalytics from "./pages/admin/AdminAnalytics";
import AdminSupport from "./pages/admin/AdminSupport";
import AdminIntegrations from "./pages/admin/AdminIntegrations";
import AdminSettingsMerged from "./pages/admin/AdminSettingsMerged";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <LanguageProvider>
        <ThemeProvider>
        <BrowserRouter>
        <AuthProvider>
        <AppProvider>
          <Toaster />
            <AppThemeProvider>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/about" element={<About />} />
              <Route path="/terms" element={<LegalPage />} />
              <Route path="/privacy" element={<LegalPage />} />
              <Route path="/auth/callback" element={<AuthCallback />} />
              <Route path="/auth/reset" element={<ResetPassword />} />
              <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
              <Route path="/checkout/success" element={<ProtectedRoute><CheckoutSuccess /></ProtectedRoute>} />

              {/* Portal pages share persistent navbar */}
              <Route element={<AppLayout />}>
                <Route path="/home" element={<PortalHome />} />
                <Route path="/studio" element={<ProtectedRoute><Canvas /></ProtectedRoute>} />
                <Route path="/pricing" element={<Pricing />} />
                <Route path="/tools" element={<ProtectedRoute><ToolsDirectory /></ProtectedRoute>} />
                <Route path="/tools/:toolId" element={<ProtectedRoute><ToolPage /></ProtectedRoute>} />
                <Route path="/community" element={<Community />} />
                <Route path="/templates" element={<Templates />} />
              </Route>

              {/* Admin Panel */}
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<AdminDashboard />} />
                <Route path="users" element={<AdminUsersMerged />} />
                <Route path="studio" element={<AdminStudioConfig />} />
                <Route path="commerce" element={<AdminCommerce />} />
                <Route path="content" element={<AdminContentMerged />} />
                <Route path="analytics" element={<AdminAnalytics />} />
                <Route path="support" element={<AdminSupport />} />
                <Route path="integrations" element={<AdminIntegrations />} />
                <Route path="settings" element={<AdminSettingsMerged />} />
              </Route>

              {/* Legacy redirects */}
              <Route path="/admin/billing" element={<Navigate to="/admin/users" replace />} />
              <Route path="/admin/pricing" element={<Navigate to="/admin/commerce" replace />} />
              <Route path="/admin/tools" element={<Navigate to="/admin/studio" replace />} />
              <Route path="/admin/models" element={<Navigate to="/admin/studio" replace />} />
              <Route path="/admin/templates" element={<Navigate to="/admin/content" replace />} />
              <Route path="/admin/media" element={<Navigate to="/admin/content" replace />} />
              <Route path="/admin/community" element={<Navigate to="/admin/content" replace />} />
              <Route path="/admin/notifications" element={<Navigate to="/admin/settings" replace />} />
              <Route path="/admin/translations" element={<Navigate to="/admin/settings" replace />} />
              <Route path="/admin/roles" element={<Navigate to="/admin/settings" replace />} />

              {/* Old top-level redirects */}
              <Route path="/users" element={<Navigate to="/admin/users" replace />} />
              <Route path="/billing" element={<Navigate to="/admin/users" replace />} />
              <Route path="/pricing-economics" element={<Navigate to="/admin/commerce" replace />} />
              <Route path="/models" element={<Navigate to="/admin/studio" replace />} />
              <Route path="/content" element={<Navigate to="/admin/content" replace />} />
              <Route path="/media" element={<Navigate to="/admin/content" replace />} />
              <Route path="/analytics" element={<Navigate to="/admin/analytics" replace />} />
              <Route path="/support" element={<Navigate to="/admin/support" replace />} />
              <Route path="/notifications" element={<Navigate to="/admin/settings" replace />} />
              <Route path="/integrations" element={<Navigate to="/admin/integrations" replace />} />
              <Route path="/roles" element={<Navigate to="/admin/settings" replace />} />
              <Route path="/settings" element={<Navigate to="/admin/settings" replace />} />
              <Route path="/translations" element={<Navigate to="/admin/settings" replace />} />

              <Route path="*" element={<NotFound />} />
            </Routes>
            </AppThemeProvider>
        </AppProvider>
        </AuthProvider>
        </BrowserRouter>
        </ThemeProvider>
      </LanguageProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
