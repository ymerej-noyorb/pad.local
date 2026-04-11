import { ElectronAPI } from "@electron-toolkit/preload";

declare global {
  interface Window {
    electron: ElectronAPI;
    api: {
      saveScene: (json: string) => Promise<void>;
      loadScene: () => Promise<string | null>;
      checkEditorReady: () => Promise<boolean>;
      onEditorReady: (callback: () => void) => void;
      checkEditorError: () => Promise<boolean>;
      onEditorError: (callback: () => void) => void;
      loadEditorUrl: () => Promise<string | null>;
      saveEditorUrl: (url: string) => Promise<void>;
    };
  }
}
