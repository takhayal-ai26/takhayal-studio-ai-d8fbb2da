import logoMark from '@/assets/logo-mark.svg';

export function Logo({ size = 'default' }: { size?: 'small' | 'default' | 'large' }) {
  const imgSize = size === 'small' ? 24 : size === 'large' ? 40 : 28;
  const textSize = size === 'small' ? 'text-sm' : size === 'large' ? 'text-xl' : 'text-lg';

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
  return <img src={logoMark} alt="Takhayal" width={size} height={size} />;
}
