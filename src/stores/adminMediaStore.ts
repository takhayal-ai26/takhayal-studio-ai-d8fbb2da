import { create } from 'zustand';
import { persist } from 'zustand/middleware';


export interface MediaAsset {
  id: string;
  name: string;
  type: 'Banner' | 'Tool Cover' | 'Template' | 'Brand' | 'Background' | 'Community' | 'Other';
  size: string;
  sizeBytes: number;
  dateAdded: string;
  usage: string;
  url: string;
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
  // Brand assets
  { id: 'media-logo-full', name: 'logo-full.svg', type: 'Brand', size: '12 KB', sizeBytes: 12288, dateAdded: '2025-10-01', usage: 'Global', url: '/assets/logo-full.svg', mimeType: 'image/svg+xml', tags: ['brand', 'logo', 'full'], alt: 'Takhayal Full Logo' },
  { id: 'media-logo-mark', name: 'logo-mark.svg', type: 'Brand', size: '4 KB', sizeBytes: 4096, dateAdded: '2025-10-01', usage: 'Global', url: '/assets/logo-mark.svg', mimeType: 'image/svg+xml', tags: ['brand', 'logo', 'mark'], alt: 'Takhayal Logo Mark' },
  { id: 'media-logo-mark-ar', name: 'logo-mark-ar.svg', type: 'Brand', size: '4 KB', sizeBytes: 4096, dateAdded: '2025-10-01', usage: 'Global', url: '/assets/logo-mark-ar.svg', mimeType: 'image/svg+xml', tags: ['brand', 'logo', 'arabic'], alt: 'Takhayal Arabic Logo Mark' },

  // Background / Landing
  { id: 'media-auth-visual', name: 'auth-visual.jpg', type: 'Background', size: '280 KB', sizeBytes: 286720, dateAdded: '2025-11-15', usage: 'Auth', url: '/assets/auth-visual.jpg', mimeType: 'image/jpeg', tags: ['auth', 'background', 'visual'], alt: 'Auth Visual Background' },
  { id: 'media-before-after', name: 'before-after.jpg', type: 'Banner', size: '320 KB', sizeBytes: 327680, dateAdded: '2025-12-01', usage: 'Landing', url: '/assets/landing/before-after.jpg', mimeType: 'image/jpeg', tags: ['landing', 'before-after', 'showcase'], alt: 'Before & After Comparison' },

  // Category images
  { id: 'media-cat-fashion', name: 'category-fashion.jpg', type: 'Template', size: '250 KB', sizeBytes: 256000, dateAdded: '2025-12-10', usage: 'Landing', url: '/assets/landing/category-fashion.jpg', mimeType: 'image/jpeg', tags: ['category', 'fashion', 'landing'], alt: 'Fashion Category' },
  { id: 'media-cat-food', name: 'category-food.jpg', type: 'Template', size: '240 KB', sizeBytes: 245760, dateAdded: '2025-12-10', usage: 'Landing', url: '/assets/landing/category-food.jpg', mimeType: 'image/jpeg', tags: ['category', 'food', 'landing'], alt: 'Food Category' },
  { id: 'media-cat-logos', name: 'category-logos.jpg', type: 'Template', size: '200 KB', sizeBytes: 204800, dateAdded: '2025-12-10', usage: 'Landing', url: '/assets/landing/category-logos.jpg', mimeType: 'image/jpeg', tags: ['category', 'logos', 'landing'], alt: 'Logos Category' },
  { id: 'media-cat-posters', name: 'category-posters.jpg', type: 'Template', size: '260 KB', sizeBytes: 266240, dateAdded: '2025-12-10', usage: 'Landing', url: '/assets/landing/category-posters.jpg', mimeType: 'image/jpeg', tags: ['category', 'posters', 'landing'], alt: 'Posters Category' },
  { id: 'media-cat-product', name: 'category-product.jpg', type: 'Template', size: '230 KB', sizeBytes: 235520, dateAdded: '2025-12-10', usage: 'Landing', url: '/assets/landing/category-product.jpg', mimeType: 'image/jpeg', tags: ['category', 'product', 'landing'], alt: 'Product Category' },
  { id: 'media-cat-social', name: 'category-social.jpg', type: 'Template', size: '220 KB', sizeBytes: 225280, dateAdded: '2025-12-10', usage: 'Landing', url: '/assets/landing/category-social.jpg', mimeType: 'image/jpeg', tags: ['category', 'social', 'landing'], alt: 'Social Media Category' },

  // Tool images (thumbnails)
  { id: 'media-tool-enhance', name: 'enhance.jpg', type: 'Tool Cover', size: '180 KB', sizeBytes: 184320, dateAdded: '2026-01-05', usage: 'Tools', url: '/assets/tools/enhance.jpg', mimeType: 'image/jpeg', tags: ['tool', 'enhance', 'thumbnail'], alt: 'Enhance Tool' },
  { id: 'media-tool-generate', name: 'generate.jpg', type: 'Tool Cover', size: '190 KB', sizeBytes: 194560, dateAdded: '2026-01-05', usage: 'Tools', url: '/assets/tools/generate.jpg', mimeType: 'image/jpeg', tags: ['tool', 'generate', 'thumbnail'], alt: 'Generate Tool' },
  { id: 'media-tool-logo', name: 'logo.jpg', type: 'Tool Cover', size: '170 KB', sizeBytes: 174080, dateAdded: '2026-01-05', usage: 'Tools', url: '/assets/tools/logo.jpg', mimeType: 'image/jpeg', tags: ['tool', 'logo', 'thumbnail'], alt: 'Logo Tool' },
  { id: 'media-tool-removebg', name: 'remove-bg.jpg', type: 'Tool Cover', size: '160 KB', sizeBytes: 163840, dateAdded: '2026-01-05', usage: 'Tools', url: '/assets/tools/remove-bg.jpg', mimeType: 'image/jpeg', tags: ['tool', 'remove-bg', 'thumbnail'], alt: 'Remove Background Tool' },
  { id: 'media-tool-upscale', name: 'upscale.jpg', type: 'Tool Cover', size: '175 KB', sizeBytes: 179200, dateAdded: '2026-01-05', usage: 'Tools', url: '/assets/tools/upscale.jpg', mimeType: 'image/jpeg', tags: ['tool', 'upscale', 'thumbnail'], alt: 'Upscale Tool' },

  // Tool cover images
  { id: 'media-tool-enhance-cover', name: 'tool-enhance.jpg', type: 'Tool Cover', size: '350 KB', sizeBytes: 358400, dateAdded: '2026-02-15', usage: 'Tools', url: '/assets/tools/tool-enhance.jpg', mimeType: 'image/jpeg', tags: ['tool', 'cover', 'enhance'], alt: 'Enhance Tool Cover' },
  { id: 'media-tool-generate-cover', name: 'tool-generate.jpg', type: 'Tool Cover', size: '380 KB', sizeBytes: 389120, dateAdded: '2026-02-15', usage: 'Tools', url: '/assets/tools/tool-generate.jpg', mimeType: 'image/jpeg', tags: ['tool', 'cover', 'generate'], alt: 'Generate Tool Cover' },
  { id: 'media-tool-logo-cover', name: 'tool-logo.jpg', type: 'Tool Cover', size: '340 KB', sizeBytes: 348160, dateAdded: '2026-02-15', usage: 'Tools', url: '/assets/tools/tool-logo.jpg', mimeType: 'image/jpeg', tags: ['tool', 'cover', 'logo'], alt: 'Logo Tool Cover' },
  { id: 'media-tool-removebg-cover', name: 'tool-removebg.jpg', type: 'Tool Cover', size: '330 KB', sizeBytes: 337920, dateAdded: '2026-02-15', usage: 'Tools', url: '/assets/tools/tool-removebg.jpg', mimeType: 'image/jpeg', tags: ['tool', 'cover', 'remove-bg'], alt: 'Remove BG Tool Cover' },
  { id: 'media-tool-upscale-cover', name: 'tool-upscale.jpg', type: 'Tool Cover', size: '350 KB', sizeBytes: 358400, dateAdded: '2026-02-15', usage: 'Tools', url: '/assets/tools/tool-upscale.jpg', mimeType: 'image/jpeg', tags: ['tool', 'cover', 'upscale'], alt: 'Upscale Tool Cover' },
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
    {
      name: 'takhayal-admin-media',
      // Merge persisted state with defaults to ensure new assets always appear
      merge: (persisted, current) => {
        const persistedState = persisted as Partial<AdminMediaState> | undefined;
        const persistedAssets = Array.isArray(persistedState?.assets) ? persistedState.assets : [];

        // Keep any user-added assets + always use latest defaults
        const defaultIds = new Set(defaultAssets.map(a => a.id));
        const userAssets = persistedAssets.filter(
          (a): a is MediaAsset => !!a && typeof a.id === 'string' && !defaultIds.has(a.id)
        );

        return {
          ...current,
          assets: [...userAssets, ...defaultAssets],
        };
      },
    }
  )
);

export { generateId as generateMediaId };
