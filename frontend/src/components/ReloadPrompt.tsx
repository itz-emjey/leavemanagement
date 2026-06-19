import { useRegisterSW } from 'virtual:pwa-register/react';
import { useEffect, useState } from 'react';
import { RefreshCw, X, Download, GitCommitHorizontal } from 'lucide-react';
import { useDeploymentCheck } from '@/hooks/useDeploymentCheck';

export default function ReloadPrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_swUrl: string | undefined, registration: ServiceWorkerRegistration | undefined) {
      console.log('[PWA] Service Worker registered:', _swUrl);
      if (registration) {
        setInterval(() => {
          registration.update();
        }, 60 * 60 * 1000);
      }
    },
    onRegisterError(error: unknown) {
      console.error('[PWA] Service Worker registration error:', error);
    },
  });

  const { updateAvailable: deployUpdate, newVersion, dismiss: dismissDeploy } = useDeploymentCheck();

  const [offline, setOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setOffline(false);
    const handleOffline = () => setOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const showUpdate = needRefresh || deployUpdate;

  const refreshApp = () => {
    if (needRefresh) {
      updateServiceWorker(true);
    } else {
      window.location.reload();
    }
  };

  const dismissAll = () => {
    setNeedRefresh(false);
    dismissDeploy();
  };

  return (
    <>
      {showUpdate && (
        <div className="fixed bottom-4 right-4 z-[9999] animate-in slide-in-from-bottom-4 fade-in duration-300">
          <div className="bg-white rounded-xl shadow-2xl border border-[#E8ECF1] p-4 max-w-sm flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#5B5FEF]/10 flex items-center justify-center flex-shrink-0">
              <Download className="w-5 h-5 text-[#5B5FEF]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900">
                {newVersion ? `Update: ${newVersion.commitHash}` : 'Update Available'}
              </p>
              {newVersion ? (
                <div className="mt-1 space-y-0.5">
                  <p className="text-xs text-gray-500 flex items-center gap-1">
                    <GitCommitHorizontal className="w-3 h-3" />
                    {newVersion.commitMessage}
                  </p>
                  <p className="text-xs text-gray-400">
                    Deployed {new Date(newVersion.deployedAt).toLocaleString()}
                  </p>
                </div>
              ) : (
                <p className="text-xs text-gray-500 mt-0.5">
                  A new version of LeaveMS is ready. Refresh to get the latest features and fixes.
                </p>
              )}
              <div className="flex items-center gap-2 mt-3">
                <button
                  onClick={refreshApp}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#5B5FEF] text-white text-xs font-medium rounded-lg hover:bg-[#4B4FDF] transition-all"
                >
                  <RefreshCw className="w-3 h-3" />
                  Refresh Now
                </button>
                <button
                  onClick={dismissAll}
                  className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-all"
                >
                  Later
                </button>
              </div>
            </div>
            <button
              onClick={dismissAll}
              className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all flex-shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {offline && (
        <div className="fixed top-0 left-0 right-0 z-[9999] bg-amber-500 text-white text-center py-1.5 text-xs font-medium">
          You are currently offline. Some features may be unavailable.
        </div>
      )}
    </>
  );
}
