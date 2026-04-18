import { ElectronAPI } from "@electron-toolkit/preload";
import type { EditorType, EditorInfo, ShellInfo } from "../shared/types";

declare global {
  interface Window {
    electron: ElectronAPI;
    api: {
      saveScene: (json: string) => Promise<void>;
      loadScene: () => Promise<string | null>;

      detectEditors: () => Promise<EditorInfo[]>;
      startEditor: (type: EditorType) => Promise<void>;
      checkEditorReady: (type: EditorType) => Promise<boolean>;
      onEditorReady: (callback: (type: EditorType) => void) => () => void;
      checkEditorError: (type: EditorType) => Promise<boolean>;
      onEditorError: (callback: (type: EditorType) => void) => () => void;
      getEditorPort: (type: EditorType) => Promise<number>;
      loadEditorUrl: (type: EditorType) => Promise<string | null>;
      saveEditorUrl: (type: EditorType, url: string) => Promise<void>;

      detectShells: () => Promise<ShellInfo[]>;

      terminalSpawn: (id: string, shell: string, cols: number, rows: number) => Promise<void>;
      terminalWrite: (id: string, data: string) => Promise<void>;
      terminalResize: (id: string, cols: number, rows: number) => Promise<void>;
      onTerminalData: (callback: (id: string, data: string) => void) => () => void;
    };
  }
}
