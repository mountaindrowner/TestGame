export {};

declare global {
  // Injected by Vite `define` (see vite.config.ts) — the live build stamp.
  const __BUILD_ID__: string;

  interface Window {
    // Screenshot / verification hooks (set by GameScene).
    __GAME_READY?: boolean;
    __poseScene?: (opts?: { pose?: string; anim?: string; progress?: number }) => void;
    __gotoRoom?: (id: string) => void; // dev: jump to a room by id (verification/editor)
  }
}
