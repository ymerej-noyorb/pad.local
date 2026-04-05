/**
 * Returns an onScrollChange handler that sets pointer-events: none on all
 * embeddables while the canvas is panning, then restores them 350ms after
 * the last scroll event.
 */
export function createScrollLock(setLocked: (locked: boolean) => void): () => void {
  let timer: ReturnType<typeof setTimeout>
  return () => {
    setLocked(true)
    clearTimeout(timer)
    timer = setTimeout(() => setLocked(false), 350)
  }
}
