import { useAdminMediaStore, MediaAsset } from '@/stores/adminMediaStore';

/**
 * Frontend hook to consume media assets from admin store.
 * Provides filtered/typed access for use across the app.
 * 
 * IMPORTANT: All components should use this hook to get image URLs
 * instead of importing from @/assets directly. This ensures that
 * admin media library changes reflect everywhere in the app.
 */
export function useMedia() {
  const { assets, getAssetsByType, getAssetById } = useAdminMediaStore();

  const banners = assets.filter(a => a.type === 'Banner');
  const toolCovers = assets.filter(a => a.type === 'Tool Cover');
  const templateImages = assets.filter(a => a.type === 'Template');
  const brandAssets = assets.filter(a => a.type === 'Brand');
  const backgrounds = assets.filter(a => a.type === 'Background');
  const communityImages = assets.filter(a => a.type === 'Community');

  const getByName = (name: string): MediaAsset | undefined =>
    assets.find(a => a.name === name);

  const getUrlByName = (name: string): string =>
    assets.find(a => a.name === name)?.url || '';

  const getById = (id: string): string =>
    assets.find(a => a.id === id)?.url || '';

  return {
    assets,
    banners,
    toolCovers,
    templateImages,
    brandAssets,
    backgrounds,
    communityImages,
    getAssetsByType,
    getAssetById,
    getByName,
    getUrlByName,
    getById,
  };
}
