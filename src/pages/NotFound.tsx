import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { useLanguage } from '@/i18n/LanguageContext';
import { PageSeo } from '@/components/seo/PageSeo';
import { localizePath } from '@/lib/localized-routes';

const NotFound = () => {
  const location = useLocation();
  const { lang, t } = useLanguage();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted">
      <PageSeo
        title="404 | Takhayal.ai"
        description={t.notFound.message}
        pageType="WebPage"
        noIndex
      />
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold">{t.notFound.title}</h1>
        <p className="mb-4 text-xl text-muted-foreground">{t.notFound.message}</p>
        <Link to={localizePath('/', lang)} className="text-primary underline hover:text-primary/90">{t.notFound.returnHome}</Link>
      </div>
    </div>
  );
};

export default NotFound;
