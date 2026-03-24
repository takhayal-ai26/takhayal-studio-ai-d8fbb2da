import logoMark from '@/assets/logo-mark.svg';
import logoMarkAr from '@/assets/logo-mark-ar.svg';
import { useLanguage } from '@/i18n/LanguageContext';

export function Logo({ size = 'default' }: { size?: 'small' | 'default' | 'large' }) {
  const { lang } = useLanguage();
  const imgSize = size === 'small' ? 24 : size === 'large' ? 40 : 28;
  const textSize = size === 'small' ? 'text-sm' : size === 'large' ? 'text-xl' : 'text-lg';
  const logo = lang === 'ar' ? logoMarkAr : logoMark;

  return (
    <div className="flex items-center gap-2.5">
      <img src={logo} alt="Takhayal" width={imgSize} height={imgSize} className="transition-opacity duration-200" />
      <span className={`${textSize} font-medium text-foreground`}>
        Takhayal<span className="text-primary">.ai</span>
      </span>
    </div>
  );
}

export function LogoMark({ size = 28 }: { size?: number }) {
  const { lang } = useLanguage();
  const logo = lang === 'ar' ? logoMarkAr : logoMark;
  return <img src={logo} alt="Takhayal" width={size} height={size} className="transition-opacity duration-200" />;
}
