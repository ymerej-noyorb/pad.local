import { useEffect, useRef } from "react";
import { Terminal as XTerm } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import "@xterm/xterm/css/xterm.css";

declare global {
  interface Window {
    terminalApi: {
      terminalSpawn: (id: string, shell: string, cols: number, rows: number) => Promise<void>;
      terminalWrite: (id: string, data: string) => Promise<void>;
      terminalResize: (id: string, cols: number, rows: number) => Promise<void>;
      onTerminalData: (callback: (id: string, data: string) => void) => () => void;
    };
  }
}

const TERMINAL_FONT_FAMILY = "monospace";
const TERMINAL_FONT_SIZE = 14;
const RESIZE_DEBOUNCE_MS = 50;

export default function TerminalPage(): React.JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const params = new URLSearchParams(window.location.search);
    const id = params.get("id") ?? "";
    const shell = params.get("shell") ?? "";

    const xterm = new XTerm({
      fontFamily: TERMINAL_FONT_FAMILY,
      fontSize: TERMINAL_FONT_SIZE,
      cursorBlink: true
    });

    const fitAddon = new FitAddon();
    xterm.loadAddon(fitAddon);
    xterm.open(container);
    fitAddon.fit();

    window.terminalApi.terminalSpawn(id, shell, xterm.cols, xterm.rows).catch(() => undefined);

    xterm.onData((data) => {
      window.terminalApi.terminalWrite(id, data).catch(() => undefined);
    });

    const removeDataListener = window.terminalApi.onTerminalData((dataId, data) => {
      if (dataId === id) xterm.write(data);
    });

    let resizeTimer: ReturnType<typeof setTimeout> | null = null;
    const observer = new ResizeObserver(() => {
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        fitAddon.fit();
        window.terminalApi.terminalResize(id, xterm.cols, xterm.rows).catch(() => undefined);
      }, RESIZE_DEBOUNCE_MS);
    });
    observer.observe(container);

    return () => {
      observer.disconnect();
      if (resizeTimer) clearTimeout(resizeTimer);
      removeDataListener();
      xterm.dispose();
    };
  }, []);

  return <div ref={containerRef} style={{ width: "100%", height: "100%" }} />;
}
