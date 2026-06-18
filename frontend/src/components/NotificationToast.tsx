import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CalendarCheck,
  CheckCircle,
  XCircle,
  Ban,
  CreditCard,
  Info,
  X,
  ExternalLink,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ToastNotification } from '@/context/SocketContext';

interface NotificationToastProps {
  toast: ToastNotification;
  onDismiss: (id: string) => void;
}

const toastConfig: Record<string, { icon: any; bg: string; border: string; text: string }> = {
  leave_request: {
    icon: CalendarCheck,
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-700',
  },
  leave_approved: {
    icon: CheckCircle,
    bg: 'bg-green-50',
    border: 'border-green-200',
    text: 'text-green-700',
  },
  leave_rejected: {
    icon: XCircle,
    bg: 'bg-red-50',
    border: 'border-red-200',
    text: 'text-red-700',
  },
  leave_cancelled: {
    icon: Ban,
    bg: 'bg-gray-50',
    border: 'border-gray-200',
    text: 'text-gray-700',
  },
  balance_adjusted: {
    icon: CreditCard,
    bg: 'bg-purple-50',
    border: 'border-purple-200',
    text: 'text-purple-700',
  },
  info: {
    icon: Info,
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    text: 'text-amber-700',
  },
};

export default function NotificationToast({ toast, onDismiss }: NotificationToastProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    // Trigger entrance animation
    const enterTimer = requestAnimationFrame(() => setIsVisible(true));
    return () => cancelAnimationFrame(enterTimer);
  }, []);

  const handleDismiss = () => {
    setIsLeaving(true);
    setTimeout(() => onDismiss(toast.id), 200);
  };

  // Auto-dismiss progress bar
  const [progress, setProgress] = useState(100);
  useEffect(() => {
    const duration = 6000; // 6 seconds
    const interval = 50; // Update every 50ms
    const step = (interval / duration) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev <= 0) {
          clearInterval(timer);
          handleDismiss();
          return 0;
        }
        return prev - step;
      });
    }, interval);

    return () => clearInterval(timer);
  }, []);

  const config = toastConfig[toast.type] || toastConfig.info;
  const Icon = config.icon;

  const content = (
    <div className="flex items-start gap-3">
      <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0', config.bg)}>
        <Icon className={cn('w-4 h-4', config.text)} />
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn('text-sm font-semibold', config.text)}>{toast.title}</p>
        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{toast.message}</p>
      </div>
      <button
        onClick={handleDismiss}
        className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-all flex-shrink-0"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-xl border shadow-lg transition-all duration-200',
        config.border,
        isVisible && !isLeaving ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0',
        isLeaving && '-translate-x-full opacity-0'
      )}
      style={{ pointerEvents: 'auto' }}
    >
      {/* Progress bar */}
      <div
        className="absolute bottom-0 left-0 h-0.5 bg-current opacity-20 transition-none"
        style={{ width: `${progress}%` }}
      />

      {toast.link ? (
        <Link
          to={toast.link}
          onClick={handleDismiss}
          className="block p-3.5 bg-white hover:bg-gray-50 transition-colors group"
        >
          {content}
          <div className="flex items-center gap-1 mt-1.5 ml-[45px]">
            <span className="text-[10px] font-medium text-[#5B5FEF]">View Details</span>
            <ExternalLink className="w-3 h-3 text-[#5B5FEF]" />
          </div>
        </Link>
      ) : (
        <div className="p-3.5 bg-white">{content}</div>
      )}
    </div>
  );
}

/** Renders a stack of active notification toasts */
export function ToastContainer({
  toasts,
  onDismiss,
}: {
  toasts: ToastNotification[];
  onDismiss: (id: string) => void;
}) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 w-[360px] max-w-[calc(100vw-32px)] pointer-events-none">
      {toasts.map((toast) => (
        <NotificationToast key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

/** Small connection status indicator dot */
export function ConnectionIndicator({ status }: { status: string }) {
  const config: Record<string, { color: string; label: string }> = {
    connected: { color: 'bg-green-500', label: 'Connected' },
    connecting: { color: 'bg-yellow-500', label: 'Connecting...' },
    reconnecting: { color: 'bg-yellow-500 animate-pulse', label: 'Reconnecting...' },
    disconnected: { color: 'bg-red-500', label: 'Disconnected' },
  };

  const current = config[status] || config.disconnected;

  return (
    <div className="flex items-center gap-1.5" title={current.label}>
      <span className={cn('w-2 h-2 rounded-full', current.color)} />
      {status === 'reconnecting' && (
        <span className="text-[10px] text-yellow-600 font-medium">Reconnecting...</span>
      )}
      {status === 'disconnected' && (
        <span className="text-[10px] text-red-500 font-medium">Offline</span>
      )}
    </div>
  );
}
