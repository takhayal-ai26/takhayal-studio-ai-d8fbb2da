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
import { Suspense, lazy } from "react";
import { PageSkeleton, StudioSkeleton, AdminSkeleton } from "@/components/PageSkeleton";

// Lazy-loaded pages
const PortalHome = lazy(() => import("./pages/PortalHome"));
const Canvas = lazy(() => import("./pages/Canvas"));
const Video = lazy(() => import("./pages/Video"));
const GenerateResult = lazy(() => import("./pages/GenerateResult"));
const Pricing = lazy(() => import("./pages/Pricing"));
const ToolPageRouter = lazy(() => import("./pages/ToolPageRouter"));
const ToolsDirectory = lazy(() => import("./pages/ToolsDirectory"));
const CreateHub = lazy(() => import("./pages/CreateHub"));
const Gallery = lazy(() => import("./pages/Gallery"));
const Community = lazy(() => import("./pages/Community"));
const Templates = lazy(() => import("./pages/Templates"));
const TemplateDetail = lazy(() => import("./pages/TemplateDetail"));
const NotFound = lazy(() => import("./pages/NotFound"));
const LegalPage = lazy(() => import("./pages/LegalPage"));
const About = lazy(() => import("./pages/About"));
const Contact = lazy(() => import("./pages/Contact"));
const AuthCallback = lazy(() => import("./pages/AuthCallback"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Checkout = lazy(() => import("./pages/Checkout"));
const CheckoutSuccess = lazy(() => import("./pages/CheckoutSuccess"));
const SharePage = lazy(() => import("./pages/SharePage"));
const ModelDetail = lazy(() => import("./pages/ModelDetail"));
const ModelsDirectory = lazy(() => import("./pages/ModelsDirectory"));

// Admin — fully code-split
const AdminProtectedRoute = lazy(() => import("./components/AdminProtectedRoute").then(m => ({ default: m.AdminProtectedRoute })));
const AdminLogin = lazy(() => import("./pages/admin/AdminLogin"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminLayout = lazy(() => import("./components/admin/AdminLayout"));
const AdminUsersMerged = lazy(() => import("./pages/admin/AdminUsersMerged"));
const AdminStudioConfig = lazy(() => import("./pages/admin/AdminStudioConfig"));
const AdminCommerce = lazy(() => import("./pages/admin/AdminCommerce"));
const AdminContentMerged = lazy(() => import("./pages/admin/AdminContentMerged"));
const AdminAnalytics = lazy(() => import("./pages/admin/AdminAnalytics"));
const AdminSettingsMerged = lazy(() => import("./pages/admin/AdminSettingsMerged"));
const AdminCommunity = lazy(() => import("./pages/admin/AdminCommunity"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 5 * 60_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const RoutedApp = () => {
  const { lang } = useLanguage();

  return (
    <AppThemeProvider>
      <Suspense fallback={<PageSkeleton />}>
        <Routes key={lang}>
          <Route element={<AppLayout />}>
            <Route path="/" element={<PortalHome />} />
            <Route path="/home" element={<Navigate to="/" replace />} />
            <Route path="/studio" element={<Suspense fallback={<StudioSkeleton />}><Canvas /></Suspense>} />
            <Route path="/image" element={<ToolsDirectory />} />
            <Route path="/video" element={<Suspense fallback={<StudioSkeleton />}><Video /></Suspense>} />
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
            <Route path="/models" element={<ModelsDirectory />} />
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

          <Route path="/admin" element={<Suspense fallback={<AdminSkeleton />}><AdminProtectedRoute><AdminLayout /></AdminProtectedRoute></Suspense>}>
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
      </Suspense>
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
