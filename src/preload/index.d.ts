import { ElectronAPI } from "@electron-toolkit/preload";
import type { EditorType, EditorInfo, ShellInfo, WorkspacesState, DataFile } from "../shared/types";

declare global {
  interface Window {
    electron: ElectronAPI;
    api: {
      listWorkspaces: () => Promise<WorkspacesState>;
      createWorkspace: (name: string) => Promise<WorkspacesState>;
      renameWorkspace: (id: string, name: string) => Promise<WorkspacesState>;
      deleteWorkspace: (id: string) => Promise<WorkspacesState>;
      switchWorkspace: (id: string) => Promise<WorkspacesState>;

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

      browserSetTouchEmulation: (webContentsId: number, enabled: boolean) => Promise<void>;
      getCursorPosition: () => Promise<{ x: number; y: number }>;

      terminalPreloadPath: string;

      terminalSpawn: (id: string, shell: string, cols: number, rows: number) => Promise<void>;
      terminalWrite: (id: string, data: string) => Promise<void>;
      terminalResize: (id: string, cols: number, rows: number) => Promise<void>;
      onTerminalData: (callback: (id: string, data: string) => void) => () => void;

      versions: { electron: string; node: string; chrome: string };
      openExternal: (url: string) => void;

      getStoragePath: () => Promise<string>;
      listDataFiles: () => Promise<DataFile[]>;
      readDataFile: (name: string) => Promise<string>;
      deleteDataFile: (name: string) => Promise<void>;
      openStorageFolder: () => Promise<void>;
      exportData: () => Promise<{ success: boolean }>;
      importData: () => Promise<{ success: boolean; filesImported?: number }>;
    };
  }
}
