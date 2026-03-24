import logoMark from '@/assets/logo-mark.svg';
import logoFullAr from '@/assets/logo-mark-ar.svg';
import { useLanguage } from '@/i18n/LanguageContext';

export function Logo({ size = 'default' }: { size?: 'small' | 'default' | 'large' }) {
  const { lang } = useLanguage();
  const imgSize = size === 'small' ? 24 : size === 'large' ? 40 : 28;
  const textSize = size === 'small' ? 'text-sm' : size === 'large' ? 'text-xl' : 'text-lg';
  const arHeight = size === 'small' ? 42 : size === 'large' ? 71 : 50;

  if (lang === 'ar') {
    return (
      <div className="flex items-center">
        <img src={logoFullAr} alt="تخيّل" style={{ height: arHeight }} className="w-auto" />
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
  if (lang === 'ar') {
    return <img src={logoFullAr} alt="تخيّل" style={{ height: size * 1.275 }} className="w-auto" />;
  }
  return <img src={logoMark} alt="Takhayal" width={size} height={size} />;
}
