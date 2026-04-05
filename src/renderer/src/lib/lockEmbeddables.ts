const SCROLL_UNLOCK_DELAY_MS = 350;

export function createScrollLock(setLocked: (locked: boolean) => void): () => void {
  let timer: ReturnType<typeof setTimeout>;
  return () => {
    setLocked(true);
    clearTimeout(timer);
    timer = setTimeout(() => setLocked(false), SCROLL_UNLOCK_DELAY_MS);
  };
}
