import { useEffect, useMemo, useState } from 'react'
import { Excalidraw } from '@excalidraw/excalidraw'
import type { ExcalidrawImperativeAPI } from '@excalidraw/excalidraw/types'
import '@excalidraw/excalidraw/index.css'

import Toolbar from './components/Toolbar'
import { createScrollLock } from './lib/lockEmbeddables'

type SavedScene = {
  elements: Parameters<ExcalidrawImperativeAPI['updateScene']>[0]['elements']
  appState: { scrollX: number; scrollY: number }
}

let saveTimer: ReturnType<typeof setTimeout>

export default function App(): React.JSX.Element {
  const [excalidrawAPI, setExcalidrawAPI] = useState<ExcalidrawImperativeAPI | null>(null)
  const [initialData, setInitialData] = useState<SavedScene | null>(null)
  const [ready, setReady] = useState(false)
  const [scrollLocked, setScrollLocked] = useState(false)

  // Load saved scene before first render
  useEffect(() => {
    window.api.loadScene().then((json: string | null) => {
      if (json) {
        try {
          setInitialData(JSON.parse(json))
        } catch {
          /* corrupt file — start fresh */
        }
      }
      setReady(true)
    })
  }, [])

  const handleScrollChange = useMemo(() => createScrollLock(setScrollLocked), [])

  const handleChange: React.ComponentProps<typeof Excalidraw>['onChange'] = (elements, appState) => {
    clearTimeout(saveTimer)
    saveTimer = setTimeout(() => {
      window.api.saveScene(
        JSON.stringify({
          elements,
          appState: { scrollX: appState.scrollX, scrollY: appState.scrollY },
        }),
      )
    }, 500)
  }

  const renderEmbeddable: React.ComponentProps<typeof Excalidraw>['renderEmbeddable'] = (
    element,
  ) => {
    const style: React.CSSProperties = {
      width: '100%',
      height: '100%',
      pointerEvents: scrollLocked ? 'none' : 'auto',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#1e1e2e',
      color: '#cdd6f4',
      fontSize: 14,
      fontFamily: 'monospace',
      borderRadius: 4,
      userSelect: 'none',
    }

    if (element.link === '!editor') return <div style={style}>Editor — coming in Step 2</div>
    if (element.link === '!terminal') return <div style={style}>Terminal — coming in Step 3</div>
    return null
  }

  if (!ready) return <></>

  return (
    <div style={{ position: 'fixed', inset: 0 }}>
      <Excalidraw
        excalidrawAPI={setExcalidrawAPI}
        initialData={
          initialData
            ? {
                elements: initialData.elements,
                appState: { scrollX: initialData.appState.scrollX, scrollY: initialData.appState.scrollY, gridModeEnabled: true, gridSize: 20 },
              }
            : { appState: { gridModeEnabled: true, gridSize: 20 } }
        }
        theme="dark"
        renderEmbeddable={renderEmbeddable}
        validateEmbeddable={(link) => link === '!editor' || link === '!terminal'}
        onChange={handleChange}
        onScrollChange={handleScrollChange}
        UIOptions={{
          canvasActions: {
            changeViewBackgroundColor: false,
            clearCanvas: false,
            export: false,
            loadScene: false,
            saveAsImage: false,
            saveToActiveFile: false,
            toggleTheme: false,
          },
        }}
      />
      {excalidrawAPI && <Toolbar excalidrawAPI={excalidrawAPI} />}
    </div>
  )
}
