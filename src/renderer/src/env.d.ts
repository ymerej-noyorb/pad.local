/// <reference types="vite/client" />

declare global {
  namespace JSX {
    interface IntrinsicElements {
      webview: React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        src?: string;
        ref?: React.Ref<Electron.WebviewTag>;
      };
    }
  }
}
