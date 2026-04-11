import { useLanguage } from '@/i18n/LanguageContext';
import { useMedia } from '@/hooks/useMedia';
import { useAppTheme } from '@/context/AppThemeContext';
import logoArDark from '@/assets/logo-ar-dark.svg';
import logoArLight from '@/assets/logo-ar-light.svg';

export function Logo({ size = 'default' }: { size?: 'small' | 'default' | 'large' }) {
  const { lang } = useLanguage();
  const { mode } = useAppTheme();
  const { getUrlByName } = useMedia();
  const logoMark = getUrlByName('logo-mark.svg');

  const imgSize = size === 'small' ? 24 : size === 'large' ? 40 : 26;
  const textSize = size === 'small' ? 'text-sm' : size === 'large' ? 'text-xl' : 'text-[17px]';
  const arHeight = size === 'small' ? 45 : size === 'large' ? 70 : 48;

  if (lang === 'ar') {
    const logoSrc = mode === 'dark' ? logoArDark : logoArLight;
    return (
      <div className="flex items-center">
        <img src={logoSrc} alt="تخيّل" style={{ height: arHeight }} className="w-auto" />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2.5">
      <img src={logoMark} alt="Takhayal" width={imgSize} height={imgSize} />
      <span className={`${textSize} font-medium text-foreground`}>
        Takhayal<span className="text-primary">.ai</span>
      </span>
    </div>
  );
}

export function LogoMark({ size = 28 }: { size?: number }) {
  const { lang } = useLanguage();
  const { mode } = useAppTheme();
  const { getUrlByName } = useMedia();
  const logoMark = getUrlByName('logo-mark.svg');

  if (lang === 'ar') {
    const h = size * 1.15;
    const logoSrc = mode === 'dark' ? logoArDark : logoArLight;
    return <img src={logoSrc} alt="تخيّل" style={{ height: h }} className="w-auto" />;
  }

  return <img src={logoMark} alt="Takhayal" width={size} height={size} />;
}
