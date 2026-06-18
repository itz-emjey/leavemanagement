import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface PageTransitionProps {
  children: React.ReactNode;
  loading?: boolean;
  skeleton?: React.ReactNode;
  className?: string;
}

/**
 * Wraps page content with a loading skeleton and fade-in transition.
 * 
 * Usage:
 * ```tsx
 * <PageTransition loading={loading} skeleton={<SkeletonAnalytics />}>
 *   <ActualPageContent />
 * </PageTransition>
 * ```
 */
export default function PageTransition({
  children,
  loading,
  skeleton,
  className,
}: PageTransitionProps) {
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    if (!loading) {
      // Small delay to ensure smooth transition
      const timer = setTimeout(() => setShowContent(true), 50);
      return () => clearTimeout(timer);
    } else {
      setShowContent(false);
    }
  }, [loading]);

  if (loading && skeleton) {
    return (
      <div className="animate-in fade-in duration-300">
        {skeleton}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#E8ECF1] border-t-[#5B5FEF]" />
          <p className="text-sm text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        showContent && 'animate-in fade-in duration-300 slide-in-from-bottom-1',
        className
      )}
    >
      {children}
    </div>
  );
}

/** A simple loading spinner component */
export function LoadingSpinner({ text }: { text?: string }) {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="w-8 h-8 text-[#5B5FEF] animate-spin" />
        {text && <p className="text-sm text-gray-400">{text}</p>}
      </div>
    </div>
  );
}
