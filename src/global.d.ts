export {};

declare global {
  interface Window {
    // Screenshot / verification hooks (set by GameScene).
    __GAME_READY?: boolean;
    __poseScene?: (opts?: { pose?: string }) => void;
    __gotoRoom?: (id: string) => void; // dev: jump to a room by id (verification/editor)
  }
}
