import { useLanguage } from '@/i18n/LanguageContext';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Trash2 } from 'lucide-react';

interface Props {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DeleteConfirmDialog({ open, onConfirm, onCancel }: Props) {
  const { lang } = useLanguage();
  const isAr = lang === 'ar';

  return (
    <AlertDialog open={open} onOpenChange={(v) => !v && onCancel()}>
      <AlertDialogContent dir={isAr ? 'rtl' : 'ltr'} className="max-w-sm">
        <AlertDialogHeader>
          <div className="mx-auto w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mb-2">
            <Trash2 size={20} className="text-destructive" />
          </div>
          <AlertDialogTitle className="text-center">
            {isAr ? 'حذف الصورة' : 'Delete Image'}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-center">
            {isAr
              ? 'هل أنت متأكد من حذف هذه الصورة؟ لا يمكن التراجع عن هذا الإجراء.'
              : 'Are you sure you want to delete this image? This action cannot be undone.'}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className={isAr ? 'flex-row-reverse gap-2' : 'gap-2'}>
          <AlertDialogCancel onClick={onCancel}>
            {isAr ? 'إلغاء' : 'Cancel'}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isAr ? 'حذف' : 'Delete'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
