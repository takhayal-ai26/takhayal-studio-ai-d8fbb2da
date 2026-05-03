import type { ReactNode } from 'react';
import { Coins, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export const MAX_IMAGE_UPLOAD_BYTES = 10 * 1024 * 1024;
export const IMAGE_SIZE_ERROR = 'Image size must be less than 10 MB.';
export const IMAGE_SIZE_ERROR_AR = 'يجب أن يكون حجم الصورة أقل من 10 ميجابايت.';

export function isOversizedImage(file: File) {
  return file.size > MAX_IMAGE_UPLOAD_BYTES;
}

export function imageSizeError(isArabic = false) {
  return isArabic ? IMAGE_SIZE_ERROR_AR : IMAGE_SIZE_ERROR;
}

export function generationHandoffUrl(path: string, imageUrl: string, extras: Record<string, string | null | undefined> = {}) {
  const params = new URLSearchParams({ imageUrl });
  Object.entries(extras).forEach(([key, value]) => {
    if (value) params.set(key, value);
  });
  return `${path}?${params.toString()}`;
}

interface GenerateButtonProps {
  children: ReactNode;
  credits?: number | string;
  loading?: boolean;
  disabled?: boolean;
  className?: string;
  loadingLabel?: string;
  onClick?: () => void;
  type?: 'button' | 'submit';
}

export function GenerateButton({
  children,
  credits,
  loading = false,
  disabled = false,
  className,
  loadingLabel,
  onClick,
  type = 'button',
}: GenerateButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={cn(
        'w-full h-[52px] rounded-2xl text-[15px] font-bold transition-all duration-200 flex items-center justify-center gap-2.5',
        'active:scale-[0.98] disabled:active:scale-100',
        disabled || loading
          ? 'bg-foreground/[0.05] border border-border/10 text-muted-foreground cursor-not-allowed'
          : 'bg-primary text-primary-foreground hover:brightness-110 shadow-[0_10px_28px_-12px] shadow-primary/60',
        className
      )}
    >
      {loading ? (
        <>
          <Loader2 size={17} className="animate-spin" />
          {loadingLabel || children}
        </>
      ) : (
        <>
          <span>{children}</span>
          {credits !== undefined && (
            <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-0.5 text-[12px] font-semibold">
              <Coins size={12} />
              {credits}
            </span>
          )}
        </>
      )}
    </button>
  );
}
