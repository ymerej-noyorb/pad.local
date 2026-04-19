import { useEffect, useRef } from "react";
import { Terminal as XTerm } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import "@xterm/xterm/css/xterm.css";

const TERMINAL_FONT_FAMILY = "monospace";
const TERMINAL_FONT_SIZE = 14;
const TERMINAL_BORDER_RADIUS = 4;
const RESIZE_DEBOUNCE_MS = 50;

interface TerminalProps {
  id: string;
  shell: string;
  scrollLocked: boolean;
}

export default function Terminal({ id, shell, scrollLocked }: TerminalProps): React.JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const xterm = new XTerm({
      fontFamily: TERMINAL_FONT_FAMILY,
      fontSize: TERMINAL_FONT_SIZE,
      cursorBlink: true
    });

    const fitAddon = new FitAddon();
    xterm.loadAddon(fitAddon);
    xterm.open(container);
    fitAddon.fit();

    window.api.terminalSpawn(id, shell, xterm.cols, xterm.rows).catch(() => undefined);

    xterm.onData((data) => {
      window.api.terminalWrite(id, data).catch(() => undefined);
    });

    const removeDataListener = window.api.onTerminalData((dataId, data) => {
      if (dataId === id) xterm.write(data);
    });

    let resizeTimer: ReturnType<typeof setTimeout> | null = null;
    const observer = new ResizeObserver(() => {
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        fitAddon.fit();
        window.api.terminalResize(id, xterm.cols, xterm.rows).catch(() => undefined);
      }, RESIZE_DEBOUNCE_MS);
    });
    observer.observe(container);

    return () => {
      observer.disconnect();
      if (resizeTimer) clearTimeout(resizeTimer);
      removeDataListener();
      xterm.dispose();
      // PTY session is intentionally kept alive — its lifecycle is tied to the
      // Excalidraw element, not the React component. killAllTerminals() on app
      // close cleans up remaining sessions.
    };
  }, [id, shell]);

  const containerStyle: React.CSSProperties = {
    width: "100%",
    height: "100%",
    borderRadius: TERMINAL_BORDER_RADIUS,
    overflow: "hidden",
    pointerEvents: scrollLocked ? "none" : "auto"
  };

  return <div ref={containerRef} style={containerStyle} />;
}
