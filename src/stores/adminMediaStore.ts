import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface MediaAsset {
  id: string;
  name: string;
  type: 'Banner' | 'Tool Cover' | 'Template' | 'Brand' | 'Background' | 'Community' | 'Other';
  size: string;        // e.g. "420 KB"
  sizeBytes: number;
  dateAdded: string;    // ISO date
  usage: string;        // where it's used: "Home", "Tools", "Templates", etc.
  url: string;          // data URL or external URL
  mimeType: string;
  tags: string[];
  alt: string;
  width?: number;
  height?: number;
}

interface AdminMediaState {
  assets: MediaAsset[];
  addAsset: (asset: MediaAsset) => void;
  addAssets: (assets: MediaAsset[]) => void;
  removeAsset: (id: string) => void;
  updateAsset: (id: string, updates: Partial<MediaAsset>) => void;
  getAssetsByType: (type: MediaAsset['type']) => MediaAsset[];
  getAssetById: (id: string) => MediaAsset | undefined;
}

function generateId() {
  return 'media-' + Date.now() + '-' + Math.random().toString(36).substring(2, 8);
}

const defaultAssets: MediaAsset[] = [
  { id: 'media-1', name: 'ramadan-banner.jpg', type: 'Banner', size: '420 KB', sizeBytes: 430080, dateAdded: '2026-03-01', usage: 'Home', url: 'https://picsum.photos/seed/ramadan-banner/800/400', mimeType: 'image/jpeg', tags: ['banner', 'ramadan', 'seasonal'], alt: 'Ramadan Banner' },
  { id: 'media-2', name: 'generate-tool-cover.jpg', type: 'Tool Cover', size: '380 KB', sizeBytes: 389120, dateAdded: '2026-02-15', usage: 'Tools', url: 'https://picsum.photos/seed/gen-cover/800/600', mimeType: 'image/jpeg', tags: ['tool', 'cover', 'generate'], alt: 'Generate Tool Cover' },
  { id: 'media-3', name: 'upscale-tool-cover.jpg', type: 'Tool Cover', size: '350 KB', sizeBytes: 358400, dateAdded: '2026-02-15', usage: 'Tools', url: 'https://picsum.photos/seed/upscale-cover/800/600', mimeType: 'image/jpeg', tags: ['tool', 'cover', 'upscale'], alt: 'Upscale Tool Cover' },
  { id: 'media-4', name: 'template-perfume.jpg', type: 'Template', size: '290 KB', sizeBytes: 296960, dateAdded: '2026-01-20', usage: 'Templates', url: 'https://picsum.photos/seed/tpl-perfume/400/400', mimeType: 'image/jpeg', tags: ['template', 'perfume', 'product'], alt: 'Perfume Template' },
  { id: 'media-5', name: 'template-fashion.jpg', type: 'Template', size: '310 KB', sizeBytes: 317440, dateAdded: '2026-01-20', usage: 'Templates', url: 'https://picsum.photos/seed/tpl-fashion/400/400', mimeType: 'image/jpeg', tags: ['template', 'fashion'], alt: 'Fashion Template' },
  { id: 'media-6', name: 'logo-full.svg', type: 'Brand', size: '12 KB', sizeBytes: 12288, dateAdded: '2025-10-01', usage: 'Global', url: '', mimeType: 'image/svg+xml', tags: ['brand', 'logo'], alt: 'Takhayal Logo' },
  { id: 'media-7', name: 'hero-bg.jpg', type: 'Background', size: '680 KB', sizeBytes: 696320, dateAdded: '2025-11-15', usage: 'Landing', url: 'https://picsum.photos/seed/hero-bg/1920/1080', mimeType: 'image/jpeg', tags: ['hero', 'background', 'landing'], alt: 'Hero Background' },
  { id: 'media-8', name: 'community-featured-1.jpg', type: 'Community', size: '450 KB', sizeBytes: 460800, dateAdded: '2026-03-20', usage: 'Community', url: 'https://picsum.photos/seed/community1/600/600', mimeType: 'image/jpeg', tags: ['community', 'featured'], alt: 'Community Featured' },
];

export const useAdminMediaStore = create<AdminMediaState>()(
  persist(
    (set, get) => ({
      assets: defaultAssets,

      addAsset: (asset) =>
        set((state) => ({ assets: [asset, ...state.assets] })),

      addAssets: (newAssets) =>
        set((state) => ({ assets: [...newAssets, ...state.assets] })),

      removeAsset: (id) =>
        set((state) => ({ assets: state.assets.filter((a) => a.id !== id) })),

      updateAsset: (id, updates) =>
        set((state) => ({
          assets: state.assets.map((a) => (a.id === id ? { ...a, ...updates } : a)),
        })),

      getAssetsByType: (type) => get().assets.filter((a) => a.type === type),

      getAssetById: (id) => get().assets.find((a) => a.id === id),
    }),
    { name: 'takhayal-admin-media' }
  )
);

export { generateId as generateMediaId };
