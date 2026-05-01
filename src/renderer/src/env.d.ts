/// <reference types="vite/client" />

declare const __APP_VERSION__: string;

declare global {
  namespace JSX {
    interface IntrinsicElements {
      webview: React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        src?: string;
        partition?: string;
        preload?: string;
        ref?: React.Ref<Electron.WebviewTag>;
      };
    }
  }
}
