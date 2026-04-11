import { BrowserWindow, shell, session } from "electron";
import { join } from "path";
import { is } from "@electron-toolkit/utils";
import icon from "../../resources/icon.png?asset";
import { VSCODE_PORT } from "./constants";

const WINDOW_WIDTH = 900;
const WINDOW_HEIGHT = 670;
const VSCODE_URL_PATTERN = `http://localhost:${VSCODE_PORT}/*`;

// VS Code serve-web uses the request's Accept-Language header to decide whether
// to inject an external locale NLS script (e.g. vscode-unpkg.net/nls/.../fr/).
// That external script returns a partial translation that fails VS Code's NLS
// count check, causing a hard crash. Forcing en-US makes VS Code serve only its
// built-in local NLS file, which always matches the expected count.
function forceEnglishLocale(): void {
  session.defaultSession.webRequest.onBeforeSendHeaders(
    { urls: [VSCODE_URL_PATTERN] },
    (details, callback) => {
      const requestHeaders = { ...details.requestHeaders };
      requestHeaders["Accept-Language"] = "en-US,en;q=0.9";
      callback({ requestHeaders });
    }
  );
}

// VS Code serve-web sends X-Frame-Options: SAMEORIGIN and a frame-ancestors CSP
// directive that both prevent cross-origin embedding. We strip them so the
// webview in our renderer can display VS Code.
function allowVSCodeEmbedding(): void {
  session.defaultSession.webRequest.onHeadersReceived(
    { urls: [VSCODE_URL_PATTERN] },
    (details, callback) => {
      const responseHeaders = { ...details.responseHeaders };
      delete responseHeaders["x-frame-options"];
      delete responseHeaders["X-Frame-Options"];
      delete responseHeaders["content-security-policy"];
      delete responseHeaders["Content-Security-Policy"];
      callback({ responseHeaders });
    }
  );
}

export function createWindow(): void {
  forceEnglishLocale();
  allowVSCodeEmbedding();

  const mainWindow = new BrowserWindow({
    width: WINDOW_WIDTH,
    height: WINDOW_HEIGHT,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === "linux" ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, "../preload/index.js"),
      sandbox: false,
      webviewTag: true,
    }
  });

  mainWindow.on("ready-to-show", () => {
    mainWindow.maximize();
    mainWindow.show();
  });

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url);
    return { action: "deny" };
  });

  if (is.dev && process.env["ELECTRON_RENDERER_URL"]) {
    mainWindow.loadURL(process.env["ELECTRON_RENDERER_URL"]);
  } else {
    mainWindow.loadFile(join(__dirname, "../renderer/index.html"));
  }

}
