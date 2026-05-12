import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppProvider } from "@/context/AppContext";
import { AuthProvider } from "@/context/AuthContext";
import { LanguageProvider } from "@/i18n/LanguageContext";
import { ThemeProvider } from "@/context/ThemeProvider";
import { AppThemeProvider } from "@/context/AppThemeContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Suspense, lazy, useEffect } from "react";
import { PageSkeleton, StudioSkeleton, AdminSkeleton } from "@/components/PageSkeleton";
import { useLanguage } from "@/i18n/LanguageContext";
import { localizePath } from "@/lib/localized-routes";

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
const SeoLandingPage = lazy(() => import("./pages/SeoLandingPage"));

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
const AdminBilling = lazy(() => import("./pages/admin/AdminBilling"));
const AdminSupport = lazy(() => import("./pages/admin/AdminSupport"));

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

function LanguageUrlSync() {
  const location = useLocation();
  const { lang, setLang } = useLanguage();

  useEffect(() => {
    const urlLang = location.pathname === '/en' || location.pathname.startsWith('/en/')
      ? 'en'
      : location.pathname === '/ar' || location.pathname.startsWith('/ar/')
        ? 'ar'
        : null;
    if (urlLang) {
      try {
        localStorage.setItem('takhayal-lang', urlLang);
      } catch {
        // Ignore blocked storage; URL remains the source of truth.
      }
    }
    if (urlLang && urlLang !== lang) setLang(urlLang);
  }, [lang, location.pathname, setLang]);

  return null;
}

function VercelInsights() {
  const location = useLocation();

  return (
    <>
      <Analytics />
      <SpeedInsights route={location.pathname} />
    </>
  );
}

const RoutedApp = () => {
  const { lang } = useLanguage();
  const toLocalized = (path: string) => <Navigate to={`${localizePath(path, lang)}${location.search}`} replace />;

  return (
    <AppThemeProvider>
      <LanguageUrlSync />
      <Suspense fallback={<PageSkeleton />}>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={toLocalized('/')} />
            <Route path="/en" element={<PortalHome />} />
            <Route path="/ar" element={<PortalHome />} />
            <Route path="/home" element={toLocalized('/')} />
            <Route path="/en/home" element={<Navigate to="/en" replace />} />
            <Route path="/ar/home" element={<Navigate to="/ar" replace />} />
            <Route path="/studio" element={toLocalized('/studio')} />
            <Route path="/en/studio" element={<Suspense fallback={<StudioSkeleton />}><Canvas /></Suspense>} />
            <Route path="/ar/studio" element={<Suspense fallback={<StudioSkeleton />}><Canvas /></Suspense>} />
            <Route path="/image" element={toLocalized('/image')} />
            <Route path="/en/image" element={<ToolsDirectory />} />
            <Route path="/ar/image" element={<ToolsDirectory />} />
            <Route path="/video" element={toLocalized('/video')} />
            <Route path="/video/:toolId" element={toLocalized(location.pathname)} />
            <Route path="/en/video" element={<ToolsDirectory mediaType="video" />} />
            <Route path="/ar/video" element={<ToolsDirectory mediaType="video" />} />
            <Route path="/en/video/:toolId" element={<Suspense fallback={<StudioSkeleton />}><Video /></Suspense>} />
            <Route path="/ar/video/:toolId" element={<Suspense fallback={<StudioSkeleton />}><Video /></Suspense>} />
            <Route path="/generate/result" element={toLocalized('/generate/result')} />
            <Route path="/en/generate/result" element={<GenerateResult />} />
            <Route path="/ar/generate/result" element={<GenerateResult />} />
            <Route path="/pricing" element={toLocalized('/pricing')} />
            <Route path="/en/pricing" element={<Pricing />} />
            <Route path="/ar/pricing" element={<Pricing />} />
            <Route path="/tools" element={toLocalized('/tools')} />
            <Route path="/en/tools" element={<ToolsDirectory />} />
            <Route path="/ar/tools" element={<ToolsDirectory />} />
            <Route path="/create" element={toLocalized('/create')} />
            <Route path="/en/create" element={<CreateHub />} />
            <Route path="/ar/create" element={<CreateHub />} />
            <Route path="/gallery" element={toLocalized('/gallery')} />
            <Route path="/en/gallery" element={<Gallery />} />
            <Route path="/ar/gallery" element={<Gallery />} />
            <Route path="/tools/:toolId" element={toLocalized(location.pathname)} />
            <Route path="/en/tools/:toolId" element={<ToolPageRouter />} />
            <Route path="/ar/tools/:toolId" element={<ToolPageRouter />} />
            <Route path="/community" element={toLocalized('/community')} />
            <Route path="/en/community" element={<Community />} />
            <Route path="/ar/community" element={<Community />} />
            <Route path="/templates" element={toLocalized('/templates')} />
            <Route path="/en/templates" element={<Templates />} />
            <Route path="/ar/templates" element={<Templates />} />
            <Route path="/templates/:templateKey" element={toLocalized(location.pathname)} />
            <Route path="/en/templates/:templateKey" element={<TemplateDetail />} />
            <Route path="/ar/templates/:templateKey" element={<TemplateDetail />} />
            <Route path="/about" element={toLocalized('/about')} />
            <Route path="/en/about" element={<About />} />
            <Route path="/ar/about" element={<About />} />
            <Route path="/models" element={toLocalized('/models')} />
            <Route path="/en/models" element={<ModelsDirectory />} />
            <Route path="/ar/models" element={<ModelsDirectory />} />
            <Route path="/models/:slug" element={toLocalized(location.pathname)} />
            <Route path="/en/models/:slug" element={<ModelDetail />} />
            <Route path="/ar/models/:slug" element={<ModelDetail />} />
            <Route path="/ai-tools-for-arabic-brands" element={toLocalized('/ai-tools-for-arabic-brands')} />
            <Route path="/en/ai-tools-for-arabic-brands" element={<SeoLandingPage />} />
            <Route path="/ar/ai-tools-for-arabic-brands" element={<SeoLandingPage />} />
            <Route path="/ai-image-tools-kuwait" element={toLocalized('/ai-image-tools-kuwait')} />
            <Route path="/en/ai-image-tools-kuwait" element={<SeoLandingPage />} />
            <Route path="/ar/ai-image-tools-kuwait" element={<SeoLandingPage />} />
            <Route path="/arabic-ai-design-tool" element={toLocalized('/arabic-ai-design-tool')} />
            <Route path="/en/arabic-ai-design-tool" element={<SeoLandingPage />} />
            <Route path="/ar/arabic-ai-design-tool" element={<SeoLandingPage />} />
            <Route path="/canva-ai-alternative-gcc" element={toLocalized('/canva-ai-alternative-gcc')} />
            <Route path="/en/canva-ai-alternative-gcc" element={<SeoLandingPage />} />
            <Route path="/ar/canva-ai-alternative-gcc" element={<SeoLandingPage />} />
            <Route path="/canva-ai-alternative" element={toLocalized('/canva-ai-alternative')} />
            <Route path="/en/canva-ai-alternative" element={<SeoLandingPage />} />
            <Route path="/ar/canva-ai-alternative" element={<SeoLandingPage />} />
            <Route path="/midjourney-alternative-arabic-brands" element={toLocalized('/midjourney-alternative-arabic-brands')} />
            <Route path="/en/midjourney-alternative-arabic-brands" element={<SeoLandingPage />} />
            <Route path="/ar/midjourney-alternative-arabic-brands" element={<SeoLandingPage />} />
            <Route path="/contact" element={toLocalized('/contact')} />
            <Route path="/en/contact" element={<Contact />} />
            <Route path="/ar/contact" element={<Contact />} />
            <Route path="/terms" element={toLocalized('/terms')} />
            <Route path="/en/terms" element={<LegalPage />} />
            <Route path="/ar/terms" element={<LegalPage />} />
            <Route path="/privacy" element={toLocalized('/privacy')} />
            <Route path="/en/privacy" element={<LegalPage />} />
            <Route path="/ar/privacy" element={<LegalPage />} />
            <Route path="/refund" element={toLocalized('/refund')} />
            <Route path="/en/refund" element={<LegalPage />} />
            <Route path="/ar/refund" element={<LegalPage />} />
            <Route path="/checkout" element={toLocalized('/checkout')} />
            <Route path="/en/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
            <Route path="/ar/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
            <Route path="/checkout/success" element={toLocalized('/checkout/success')} />
            <Route path="/en/checkout/success" element={<ProtectedRoute><CheckoutSuccess /></ProtectedRoute>} />
            <Route path="/ar/checkout/success" element={<ProtectedRoute><CheckoutSuccess /></ProtectedRoute>} />
          </Route>

        <Route path="/share/:publicId" element={<Suspense fallback={<PageSkeleton />}><SharePage /></Suspense>} />
        <Route path="/auth/callback" element={<Suspense fallback={<PageSkeleton />}><AuthCallback /></Suspense>} />
        <Route path="/auth/reset" element={<Suspense fallback={<PageSkeleton />}><ResetPassword /></Suspense>} />

        <Route path="/admin/login" element={<Suspense fallback={<AdminSkeleton />}><AdminLogin /></Suspense>} />

        <Route path="/admin" element={<Suspense fallback={<AdminSkeleton />}><AdminProtectedRoute><AdminLayout /></AdminProtectedRoute></Suspense>}>
          <Route index element={<AdminDashboard />} />
          <Route path="users" element={<AdminUsersMerged />} />
          <Route path="pricing" element={<AdminCommerce />} />
          <Route path="billing" element={<AdminBilling />} />
          <Route path="models" element={<AdminStudioConfig />} />
          <Route path="tools" element={<AdminStudioConfig />} />
          <Route path="templates" element={<AdminContentMerged />} />
          <Route path="community" element={<AdminCommunity />} />
          <Route path="content" element={<AdminContentMerged />} />
          <Route path="analytics" element={<AdminAnalytics />} />
          <Route path="support" element={<AdminSupport />} />
          <Route path="settings" element={<AdminSettingsMerged />} />
        </Route>

        <Route path="/admin/studio" element={<Navigate to="/admin/models" replace />} />
        <Route path="/admin/commerce" element={<Navigate to="/admin/pricing" replace />} />
        <Route path="/admin/media" element={<Navigate to="/admin/content" replace />} />
        <Route path="/admin/notifications" element={<Navigate to="/admin/settings" replace />} />
        <Route path="/admin/translations" element={<Navigate to="/admin/settings" replace />} />
        <Route path="/admin/roles" element={<Navigate to="/admin/settings" replace />} />
        <Route path="/admin/integrations" element={<Navigate to="/admin/settings" replace />} />

          <Route path="/dashboard/admin" element={<Navigate to="/admin" replace />} />
          <Route path="/admin-panel" element={<Navigate to="/admin" replace />} />
          <Route path="/legal/privacy" element={<Navigate to="/privacy" replace />} />
          <Route path="/legal/terms" element={<Navigate to="/terms" replace />} />
          <Route path="/legal/refund" element={<Navigate to="/refund" replace />} />

        <Route path="*" element={<Suspense fallback={<PageSkeleton />}><NotFound /></Suspense>} />
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
                <SonnerToaster position="top-center" richColors />
                <VercelInsights />
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
