import { Skeleton } from '@/components/ui/skeleton';

export function PageSkeleton() {
  return (
    <div className="flex-1 p-6 animate-pulse" style={{ paddingTop: 'calc(3.5rem + var(--banner-h, 0px))' }}>
      <Skeleton className="h-8 w-48 mb-4" />
      <Skeleton className="h-4 w-72 mb-8" />
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="aspect-square rounded-2xl" />
        ))}
      </div>
    </div>
  );
}

export function StudioSkeleton() {
  return (
    <div className="flex-1 flex" style={{ paddingTop: 'calc(3.5rem + var(--banner-h, 0px))' }}>
      <div className="flex-1 p-6 space-y-4">
        <Skeleton className="h-10 w-full max-w-2xl mx-auto rounded-xl" />
        <Skeleton className="aspect-video w-full max-w-2xl mx-auto rounded-2xl" />
      </div>
    </div>
  );
}

export function AdminSkeleton() {
  return (
    <div className="flex-1 flex">
      <div className="w-56 border-r border-border p-4 space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-full rounded-lg" />
        ))}
      </div>
      <div className="flex-1 p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    </div>
  );
}
