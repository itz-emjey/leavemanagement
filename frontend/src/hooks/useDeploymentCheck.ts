import { useEffect, useState, useCallback } from 'react';
import api from '@/lib/axios';

const STORAGE_KEY = 'deployment_info';
const POLL_INTERVAL = 30000;

interface DeploymentInfo {
  commitHash: string;
  commitMessage: string;
  deployedAt: string;
  nodeEnv?: string;
}

export function useDeploymentCheck() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [newVersion, setNewVersion] = useState<DeploymentInfo | null>(null);

  const dismiss = useCallback(() => {
    setUpdateAvailable(false);
    setNewVersion(null);
  }, []);

  useEffect(() => {
    let mounted = true;
    let timer: ReturnType<typeof setInterval>;

    const check = async () => {
      try {
        const res = await api.get('/deployment');
        const current: DeploymentInfo = res.data;
        const stored = localStorage.getItem(STORAGE_KEY);

        if (!stored) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
          return;
        }

        const prev: DeploymentInfo = JSON.parse(stored);
        if (prev.commitHash !== current.commitHash) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
          if (mounted) {
            setNewVersion(current);
            setUpdateAvailable(true);
          }
        }
      } catch {
        // server not reachable — skip silently
      }
    };

    check();
    timer = setInterval(check, POLL_INTERVAL);

    return () => {
      mounted = false;
      clearInterval(timer);
    };
  }, []);

  return { updateAvailable, newVersion, dismiss };
}
