export const FULLSCREEN_Z_INDEX = 9999;

export const FULLSCREEN_INJECT_SCRIPT = `document.addEventListener('keydown', function(e) {
  if (e.key === 'F11') {
    e.preventDefault();
    e.stopImmediatePropagation();
    if (document.fullscreenElement) { document.exitFullscreen(); }
    else { document.documentElement.requestFullscreen(); }
  }
}, true);`;

export function registerFullscreenListeners(
  webview: Electron.WebviewTag,
  setIsFullscreen: (value: boolean) => void
): () => void {
  const handleEnter = (): void => setIsFullscreen(true);
  const handleLeave = (): void => setIsFullscreen(false);
  webview.addEventListener("enter-html-full-screen", handleEnter);
  webview.addEventListener("leave-html-full-screen", handleLeave);
  return () => {
    webview.removeEventListener("enter-html-full-screen", handleEnter);
    webview.removeEventListener("leave-html-full-screen", handleLeave);
  };
}
