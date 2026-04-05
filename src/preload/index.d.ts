import { ElectronAPI } from "@electron-toolkit/preload";

declare global {
  interface Window {
    electron: ElectronAPI;
    api: {
      saveScene: (json: string) => Promise<void>;
      loadScene: () => Promise<string | null>;
    };
  }
}
