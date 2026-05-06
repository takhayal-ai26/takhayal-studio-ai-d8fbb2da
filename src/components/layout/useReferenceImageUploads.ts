import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { imageSizeError, isOversizedImage } from '@/lib/ux';
import { toast } from 'sonner';

export type ReferenceImageUpload = {
  preview: string;
  url: string | null;
};

export type ReferenceUploadValidationResult = 'ok' | 'unsupported_type' | 'oversized' | 'too_many';

type ReferenceUploadValidationOptions = {
  currentCount: number;
  maxImages: number;
};

type UseReferenceImageUploadsOptions = {
  userId?: string;
  language: string;
  maxImages: number;
  supportsImageInput: boolean;
  initialImageUrl: string | null;
};

export function validateReferenceImageUpload(
  file: File,
  options: ReferenceUploadValidationOptions,
): ReferenceUploadValidationResult {
  if (!file.type.startsWith('image/')) return 'unsupported_type';
  if (isOversizedImage(file)) return 'oversized';
  if (options.currentCount >= options.maxImages) return 'too_many';
  return 'ok';
}

export function useReferenceImageUploads({
  userId,
  language,
  maxImages,
  supportsImageInput,
  initialImageUrl,
}: UseReferenceImageUploadsOptions) {
  const [uploadedImages, setUploadedImages] = useState<ReferenceImageUpload[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!initialImageUrl) return;
    if (uploadedImages.some(img => img.url === initialImageUrl)) return;
    setUploadedImages([{ preview: initialImageUrl, url: initialImageUrl }]);
  }, [initialImageUrl, uploadedImages]);

  useEffect(() => {
    if (!supportsImageInput && uploadedImages.length > 0) {
      setUploadedImages([]);
    }
  }, [supportsImageInput, uploadedImages.length]);

  const handleFileUpload = useCallback(async (file: File) => {
    const validation = validateReferenceImageUpload(file, {
      currentCount: uploadedImages.length,
      maxImages,
    });

    if (validation === 'unsupported_type' || validation === 'too_many') return;
    if (validation === 'oversized') {
      toast.error(imageSizeError(language === 'ar'));
      return;
    }

    const preview = URL.createObjectURL(file);
    const newEntry = { preview, url: null };
    setUploadedImages(prev => [...prev, newEntry]);

    if (!userId) {
      setUploadedImages(prev => prev.map(img => img.preview === preview ? { ...img, url: preview } : img));
      return;
    }

    setIsUploading(true);

    try {
      const ext = file.name.split('.').pop() || 'png';
      const path = `${userId}/input-${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('tool-files')
        .upload(path, file, { contentType: file.type, upsert: true });
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from('tool-files').getPublicUrl(path);
      setUploadedImages(prev => prev.map(img => img.preview === preview ? { ...img, url: urlData.publicUrl } : img));
    } catch (err) {
      console.error('Upload failed:', err);
      setUploadedImages(prev => prev.filter(img => img.preview !== preview));
    } finally {
      setIsUploading(false);
    }
  }, [userId, uploadedImages.length, maxImages, language]);

  const removeImage = useCallback((index: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, []);

  const clearAllImages = useCallback(() => {
    setUploadedImages([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files || []).slice(0, Math.max(0, maxImages - uploadedImages.length));
    files.forEach(file => handleFileUpload(file));
  }, [handleFileUpload, maxImages, uploadedImages.length]);

  return {
    uploadedImages,
    isUploading,
    pendingUploads: uploadedImages.some(img => !img.url),
    fileInputRef,
    handleFileUpload,
    removeImage,
    clearAllImages,
    handleDrop,
  };
}
