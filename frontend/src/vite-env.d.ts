/// <reference types="vite/client" />

interface Window {
  API_URL?: string;
}

// Type declarations for vite-plugin-pwa virtual modules
// This module is provided at build time by vite-plugin-pwa
declare module 'virtual:pwa-register/react' {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export type RegisterSWOptions = Record<string, any>;

  export function useRegisterSW(options?: RegisterSWOptions): {
    needRefresh: [boolean, React.Dispatch<React.SetStateAction<boolean>>];
    offlineReady: [boolean, React.Dispatch<React.SetStateAction<boolean>>];
    updateServiceWorker: (reloadPage?: boolean) => Promise<void>;
  };
}
