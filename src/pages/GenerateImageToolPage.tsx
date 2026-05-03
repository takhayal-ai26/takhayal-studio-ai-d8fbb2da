import { useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { GenerateImageCanvasPage } from './Canvas';

export default function GenerateImageToolPage() {
  const { setActivePage } = useApp();

  useEffect(() => {
    setActivePage('canvas');
  }, [setActivePage]);

  return <GenerateImageCanvasPage />;
}
