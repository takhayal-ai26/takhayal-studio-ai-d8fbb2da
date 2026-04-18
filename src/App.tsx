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
      <Routes key={lang}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Suspense fallback={<PageSkeleton />}><PortalHome /></Suspense>} />
          <Route path="/home" element={<Navigate to="/" replace />} />
          <Route path="/studio" element={<Suspense fallback={<StudioSkeleton />}><Canvas /></Suspense>} />
          <Route path="/image" element={<Suspense fallback={<PageSkeleton />}><ToolsDirectory /></Suspense>} />
          <Route path="/video" element={<Suspense fallback={<StudioSkeleton />}><Video /></Suspense>} />
          <Route path="/generate/result" element={<Suspense fallback={<PageSkeleton />}><GenerateResult /></Suspense>} />
          <Route path="/pricing" element={<Suspense fallback={<PageSkeleton />}><Pricing /></Suspense>} />
          <Route path="/tools" element={<Suspense fallback={<PageSkeleton />}><ToolsDirectory /></Suspense>} />
          <Route path="/create" element={<Suspense fallback={<PageSkeleton />}><CreateHub /></Suspense>} />
          <Route path="/gallery" element={<Suspense fallback={<PageSkeleton />}><Gallery /></Suspense>} />
          <Route path="/tools/:toolId" element={<Suspense fallback={<PageSkeleton />}><ToolPageRouter /></Suspense>} />
          <Route path="/community" element={<Suspense fallback={<PageSkeleton />}><Community /></Suspense>} />
          <Route path="/templates" element={<Suspense fallback={<PageSkeleton />}><Templates /></Suspense>} />
          <Route path="/templates/:id" element={<Suspense fallback={<PageSkeleton />}><TemplateDetail /></Suspense>} />
          <Route path="/about" element={<Suspense fallback={<PageSkeleton />}><About /></Suspense>} />
          <Route path="/models" element={<Suspense fallback={<PageSkeleton />}><ModelsDirectory /></Suspense>} />
          <Route path="/models/:slug" element={<Suspense fallback={<PageSkeleton />}><ModelDetail /></Suspense>} />
          <Route path="/contact" element={<Suspense fallback={<PageSkeleton />}><Contact /></Suspense>} />
          <Route path="/terms" element={<Suspense fallback={<PageSkeleton />}><LegalPage /></Suspense>} />
          <Route path="/privacy" element={<Suspense fallback={<PageSkeleton />}><LegalPage /></Suspense>} />
          <Route path="/checkout" element={<ProtectedRoute><Suspense fallback={<PageSkeleton />}><Checkout /></Suspense></ProtectedRoute>} />
          <Route path="/checkout/success" element={<ProtectedRoute><Suspense fallback={<PageSkeleton />}><CheckoutSuccess /></Suspense></ProtectedRoute>} />
        </Route>

        <Route path="/share/:publicId" element={<Suspense fallback={<PageSkeleton />}><SharePage /></Suspense>} />
        <Route path="/auth/callback" element={<Suspense fallback={<PageSkeleton />}><AuthCallback /></Suspense>} />
        <Route path="/auth/reset" element={<Suspense fallback={<PageSkeleton />}><ResetPassword /></Suspense>} />

        <Route path="/admin/login" element={<Suspense fallback={<AdminSkeleton />}><AdminLogin /></Suspense>} />

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

        <Route path="*" element={<Suspense fallback={<PageSkeleton />}><NotFound /></Suspense>} />
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
