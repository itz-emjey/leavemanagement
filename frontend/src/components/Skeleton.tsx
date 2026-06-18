import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-md bg-gray-200/80',
        className
      )}
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="card space-y-3">
      <div className="flex items-center gap-3">
        <Skeleton className="w-10 h-10 rounded-lg" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
      <Skeleton className="h-8 w-full" />
      <div className="flex justify-between">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-3 w-16" />
      </div>
    </div>
  );
}

export function SkeletonTable({ rows = 5, cols = 5, className }: { rows?: number; cols?: number; className?: string }) {
  return (
    <div className={cn('space-y-3', className)}>
      {/* Header */}
      <div className="flex gap-4 py-3">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-4 flex-1" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <div key={rowIdx} className="flex gap-4 py-3 border-t border-[#E8ECF1]">
          {Array.from({ length: cols }).map((_, colIdx) => (
            <Skeleton key={colIdx} className="h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function SkeletonKPICards() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="card">
          <div className="flex items-center gap-3">
            <Skeleton className="w-11 h-11 rounded-xl" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-5 w-3/4" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonDashboard() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="space-y-2 flex-1">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
      </div>
      <SkeletonKPICards />
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <div className="card">
            <Skeleton className="h-[400px] w-full" />
          </div>
        </div>
        <div className="space-y-6">
          <div className="card">
            <Skeleton className="h-[200px] w-full" />
          </div>
          <div className="card">
            <Skeleton className="h-[200px] w-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function SkeletonList({ count = 3, className }: { count?: number; className?: string }) {
  return (
    <div className={cn('space-y-3', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3">
          <Skeleton className="w-8 h-8 rounded-lg" />
          <div className="space-y-1.5 flex-1">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-3 w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Skeleton for the Analytics page — charts, stats cards, and tables */
export function SkeletonAnalytics() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="space-y-2 flex-1">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-4 w-72" />
        </div>
      </div>
      {/* KPI grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="card">
            <Skeleton className="h-10 w-10 rounded-lg mb-3" />
            <Skeleton className="h-6 w-20 mb-1" />
            <Skeleton className="h-3 w-24" />
          </div>
        ))}
      </div>
      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="card">
          <Skeleton className="h-5 w-36 mb-4" />
          <Skeleton className="h-[300px] w-full" />
        </div>
        <div className="card">
          <Skeleton className="h-5 w-36 mb-4" />
          <Skeleton className="h-[300px] w-full" />
        </div>
      </div>
      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <div className="p-4 border-b border-[#E8ECF1]">
          <Skeleton className="h-5 w-40" />
        </div>
        <div className="p-4">
          <SkeletonTable rows={4} cols={5} />
        </div>
      </div>
    </div>
  );
}

/** Skeleton for the Reports page — summary cards and chart cards */
export function SkeletonReports() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="space-y-2 flex-1">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-4 w-48" />
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="card text-center p-4">
            <Skeleton className="h-8 w-16 mx-auto mb-2" />
            <Skeleton className="h-3 w-20 mx-auto" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="card"><Skeleton className="h-[300px] w-full" /></div>
        <div className="card"><Skeleton className="h-[300px] w-full" /></div>
      </div>
    </div>
  );
}

/** Skeleton for the Apply Leave page — form panel and balance cards */
export function SkeletonLeaveForm() {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      <div className="xl:col-span-1 space-y-6">
        <div className="card space-y-4">
          <Skeleton className="h-5 w-32" />
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="p-3 rounded-lg border border-[#E8ECF1]">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Skeleton className="w-8 h-8 rounded-lg" />
                  <div>
                    <Skeleton className="h-4 w-20 mb-1" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
                <Skeleton className="h-6 w-8" />
              </div>
              <Skeleton className="h-1.5 w-full rounded-full mb-1" />
              <Skeleton className="h-3 w-24" />
            </div>
          ))}
        </div>
        <div className="card space-y-4">
          <Skeleton className="h-5 w-40" />
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
      <div className="xl:col-span-2">
        <div className="card">
          <Skeleton className="h-5 w-32 mb-4" />
          <Skeleton className="h-[500px] w-full" />
        </div>
      </div>
    </div>
  );
}

/** Skeleton for permission matrix / grid pages */
export function SkeletonGrid({ cards = 6 }: { cards?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {Array.from({ length: cards }).map((_, i) => (
        <div key={i} className="card">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <Skeleton className="w-10 h-10 rounded-lg" />
              <div>
                <Skeleton className="h-4 w-24 mb-1" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Skeleton className="h-14 rounded-lg" />
            <Skeleton className="h-14 rounded-lg" />
            <Skeleton className="h-14 rounded-lg" />
            <Skeleton className="h-14 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Skeleton for detail/modals content */
export function SkeletonDetails() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Skeleton className="w-14 h-14 rounded-full" />
        <div>
          <Skeleton className="h-5 w-40 mb-1" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-16 rounded-lg" />
        ))}
      </div>
    </div>
  );
}

/** Full-page loading wrapper with skeleton */
export function SkeletonPage({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {children}
    </div>
  );
}

/** Skeleton for System Config page */
export function SkeletonConfig() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="card">
            <Skeleton className="h-5 w-40 mb-4" />
            {Array.from({ length: 3 }).map((_, j) => (
              <Skeleton key={j} className="h-16 w-full mb-3" />
            ))}
          </div>
        ))}
      </div>
      <div className="space-y-4">
        <div className="card">
          <Skeleton className="h-5 w-32 mb-4" />
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full mb-2" />
          ))}
        </div>
      </div>
    </div>
  );
}
