import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppProvider } from "@/context/AppContext";
import { AuthProvider } from "@/context/AuthContext";
import { LanguageProvider, useLanguage } from "@/i18n/LanguageContext";
import { ThemeProvider } from "@/context/ThemeProvider";
import { AppThemeProvider } from "@/context/AppThemeContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import PortalHome from "./pages/PortalHome";
import Canvas from "./pages/Canvas";
import GenerateResult from "./pages/GenerateResult";
import Pricing from "./pages/Pricing";
import ToolPageRouter from "./pages/ToolPageRouter";
import ToolsDirectory from "./pages/ToolsDirectory";
import CreateHub from "./pages/CreateHub";
import Gallery from "./pages/Gallery";
import Community from "./pages/Community";
import Templates from "./pages/Templates";
import TemplateDetail from "./pages/TemplateDetail";
import NotFound from "./pages/NotFound";
import LegalPage from "./pages/LegalPage";
import About from "./pages/About";
import Contact from "./pages/Contact";
import AuthCallback from "./pages/AuthCallback";
import ResetPassword from "./pages/ResetPassword";
import Checkout from "./pages/Checkout";
import CheckoutSuccess from "./pages/CheckoutSuccess";
import SharePage from "./pages/SharePage";
import ModelDetail from "./pages/ModelDetail";

import { AdminProtectedRoute } from "./components/AdminProtectedRoute";
import AdminLogin from "./pages/admin/AdminLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminLayout from "./components/admin/AdminLayout";
import AdminUsersMerged from "./pages/admin/AdminUsersMerged";
import AdminStudioConfig from "./pages/admin/AdminStudioConfig";
import AdminCommerce from "./pages/admin/AdminCommerce";
import AdminContentMerged from "./pages/admin/AdminContentMerged";
import AdminAnalytics from "./pages/admin/AdminAnalytics";
import AdminSettingsMerged from "./pages/admin/AdminSettingsMerged";
import AdminCommunity from "./pages/admin/AdminCommunity";

const queryClient = new QueryClient();

const RoutedApp = () => {
  const { lang } = useLanguage();

  return (
    <AppThemeProvider key={lang}>
      <Routes key={lang}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<PortalHome />} />
          <Route path="/home" element={<Navigate to="/" replace />} />
          <Route path="/studio" element={<Canvas />} />
          <Route path="/generate/result" element={<GenerateResult />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/tools" element={<ToolsDirectory />} />
          <Route path="/create" element={<CreateHub />} />
          <Route path="/gallery" element={<Gallery />} />
          <Route path="/tools/:toolId" element={<ToolPageRouter />} />
          <Route path="/community" element={<Community />} />
          <Route path="/templates" element={<Templates />} />
          <Route path="/templates/:id" element={<TemplateDetail />} />
          <Route path="/about" element={<About />} />
          <Route path="/models/:slug" element={<ModelDetail />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/terms" element={<LegalPage />} />
          <Route path="/privacy" element={<LegalPage />} />
          <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
          <Route path="/checkout/success" element={<ProtectedRoute><CheckoutSuccess /></ProtectedRoute>} />
        </Route>

        <Route path="/share/:publicId" element={<SharePage />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/auth/reset" element={<ResetPassword />} />

        <Route path="/admin/login" element={<AdminLogin />} />

        <Route path="/admin" element={<AdminProtectedRoute><AdminLayout /></AdminProtectedRoute>}>
          <Route index element={<AdminDashboard />} />
          <Route path="users" element={<AdminUsersMerged />} />
          <Route path="pricing" element={<AdminCommerce />} />
          <Route path="models" element={<AdminStudioConfig />} />
          <Route path="tools" element={<AdminStudioConfig />} />
          <Route path="templates" element={<AdminContentMerged />} />
          <Route path="community" element={<AdminCommunity />} />
          <Route path="content" element={<AdminContentMerged />} />
          <Route path="analytics" element={<AdminAnalytics />} />
          <Route path="settings" element={<AdminSettingsMerged />} />
        </Route>

        <Route path="/admin/studio" element={<Navigate to="/admin/models" replace />} />
        <Route path="/admin/commerce" element={<Navigate to="/admin/pricing" replace />} />
        <Route path="/admin/billing" element={<Navigate to="/admin/users" replace />} />
        <Route path="/admin/media" element={<Navigate to="/admin/content" replace />} />
        <Route path="/admin/community" element={<Navigate to="/admin/content" replace />} />
        <Route path="/admin/notifications" element={<Navigate to="/admin/settings" replace />} />
        <Route path="/admin/translations" element={<Navigate to="/admin/settings" replace />} />
        <Route path="/admin/roles" element={<Navigate to="/admin/settings" replace />} />
        <Route path="/admin/support" element={<Navigate to="/admin/settings" replace />} />
        <Route path="/admin/integrations" element={<Navigate to="/admin/settings" replace />} />

        <Route path="/users" element={<Navigate to="/admin/users" replace />} />
        <Route path="/billing" element={<Navigate to="/admin/users" replace />} />
        <Route path="/pricing-economics" element={<Navigate to="/admin/pricing" replace />} />
        <Route path="/models" element={<Navigate to="/admin/models" replace />} />
        <Route path="/content" element={<Navigate to="/admin/content" replace />} />
        <Route path="/media" element={<Navigate to="/admin/content" replace />} />
        <Route path="/analytics" element={<Navigate to="/admin/analytics" replace />} />
        <Route path="/support" element={<Navigate to="/admin/settings" replace />} />
        <Route path="/notifications" element={<Navigate to="/admin/settings" replace />} />
        <Route path="/integrations" element={<Navigate to="/admin/settings" replace />} />
        <Route path="/roles" element={<Navigate to="/admin/settings" replace />} />
        <Route path="/settings" element={<Navigate to="/admin/settings" replace />} />
        <Route path="/translations" element={<Navigate to="/admin/settings" replace />} />
        <Route path="/dashboard/admin" element={<Navigate to="/admin" replace />} />
        <Route path="/admin-panel" element={<Navigate to="/admin" replace />} />
        <Route path="/internal/*" element={<Navigate to="/admin" replace />} />
        <Route path="/translations" element={<Navigate to="/admin/settings" replace />} />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </AppThemeProvider>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <LanguageProvider>
        <ThemeProvider>
          <BrowserRouter>
            <AuthProvider>
              <AppProvider>
                <Toaster />
                <RoutedApp />
              </AppProvider>
            </AuthProvider>
          </BrowserRouter>
        </ThemeProvider>
      </LanguageProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
