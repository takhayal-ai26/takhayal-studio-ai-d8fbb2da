import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Suspense, lazy } from "react";
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

// Admin
import { AdminProtectedRoute } from "./components/AdminProtectedRoute";

const PortalHome = lazy(() => import("./pages/PortalHome"));
const Canvas = lazy(() => import("./pages/Canvas"));
const Pricing = lazy(() => import("./pages/Pricing"));
const ToolPage = lazy(() => import("./pages/ToolPage"));
const ToolsDirectory = lazy(() => import("./pages/ToolsDirectory"));
const Community = lazy(() => import("./pages/Community"));
const Templates = lazy(() => import("./pages/Templates"));
const NotFound = lazy(() => import("./pages/NotFound"));
const LegalPage = lazy(() => import("./pages/LegalPage"));
const About = lazy(() => import("./pages/About"));
const AuthCallback = lazy(() => import("./pages/AuthCallback"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Checkout = lazy(() => import("./pages/Checkout"));
const CheckoutSuccess = lazy(() => import("./pages/CheckoutSuccess"));

const AdminLogin = lazy(() => import("./pages/admin/AdminLogin"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminLayout = lazy(() => import("./components/admin/AdminLayout"));
const AdminUsersMerged = lazy(() => import("./pages/admin/AdminUsersMerged"));
const AdminStudioConfig = lazy(() => import("./pages/admin/AdminStudioConfig"));
const AdminCommerce = lazy(() => import("./pages/admin/AdminCommerce"));
const AdminContentMerged = lazy(() => import("./pages/admin/AdminContentMerged"));
const AdminAnalytics = lazy(() => import("./pages/admin/AdminAnalytics"));
const AdminSettingsMerged = lazy(() => import("./pages/admin/AdminSettingsMerged"));

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
            <Suspense fallback={<div className="min-h-screen bg-background" />}>
            <Routes>
              {/* Portal pages share persistent navbar */}
              <Route element={<AppLayout />}>
                <Route path="/" element={<PortalHome />} />
                <Route path="/home" element={<Navigate to="/" replace />} />
                <Route path="/studio" element={<Canvas />} />
                <Route path="/pricing" element={<Pricing />} />
                <Route path="/tools" element={<ToolsDirectory />} />
                <Route path="/tools/:toolId" element={<ToolPage />} />
                <Route path="/community" element={<Community />} />
                <Route path="/templates" element={<Templates />} />
                <Route path="/about" element={<About />} />
                <Route path="/terms" element={<LegalPage />} />
                <Route path="/privacy" element={<LegalPage />} />
                <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
                <Route path="/checkout/success" element={<ProtectedRoute><CheckoutSuccess /></ProtectedRoute>} />
              </Route>

              <Route path="/auth/callback" element={<AuthCallback />} />
              <Route path="/auth/reset" element={<ResetPassword />} />

              {/* Admin Login */}
              <Route path="/admin/login" element={<AdminLogin />} />

              {/* Admin Panel */}
              <Route path="/admin" element={<AdminProtectedRoute><AdminLayout /></AdminProtectedRoute>}>
                <Route index element={<AdminDashboard />} />
                <Route path="users" element={<AdminUsersMerged />} />
                <Route path="pricing" element={<AdminCommerce />} />
                <Route path="models" element={<AdminStudioConfig />} />
                <Route path="tools" element={<AdminStudioConfig />} />
                <Route path="templates" element={<AdminContentMerged />} />
                <Route path="content" element={<AdminContentMerged />} />
                <Route path="analytics" element={<AdminAnalytics />} />
                <Route path="settings" element={<AdminSettingsMerged />} />
              </Route>

              {/* Legacy redirects → new clean paths */}
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

              {/* Old top-level redirects */}
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
            </Suspense>
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
