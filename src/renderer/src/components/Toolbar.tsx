import type { ExcalidrawImperativeAPI } from '@excalidraw/excalidraw/types'

interface Props {
  excalidrawAPI: ExcalidrawImperativeAPI
}

function addNode(excalidrawAPI: ExcalidrawImperativeAPI, link: '!editor' | '!terminal'): void {
  const appState = excalidrawAPI.getAppState()
  const { scrollX, scrollY, zoom } = appState

  const width = 800
  const height = 500

  // Convert viewport center to scene coordinates, then offset so the node is centered
  const sceneX = (window.innerWidth / 2 - scrollX) / zoom.value - width / 2
  const sceneY = (window.innerHeight / 2 - scrollY) / zoom.value - height / 2

  const element = {
    id: crypto.randomUUID(),
    type: 'embeddable' as const,
    x: sceneX,
    y: sceneY,
    width,
    height,
    angle: 0,
    strokeColor: '#6c7086',
    backgroundColor: 'transparent',
    fillStyle: 'solid' as const,
    strokeWidth: 2,
    strokeStyle: 'solid' as const,
    roughness: 0,
    opacity: 100,
    groupIds: [] as string[],
    frameId: null,
    roundness: null,
    seed: Math.floor(Math.random() * 2 ** 31),
    version: 1,
    versionNonce: Math.floor(Math.random() * 2 ** 31),
    isDeleted: false as const,
    boundElements: null,
    updated: Date.now(),
    link,
    locked: false,
    scale: [1, 1] as [number, number],
    customData: { link },
    index: null,
  }

  excalidrawAPI.updateScene({
    elements: [...excalidrawAPI.getSceneElements(), element],
  })
}

const buttonStyle: React.CSSProperties = {
  background: '#45475a',
  color: '#cdd6f4',
  border: 'none',
  borderRadius: 6,
  padding: '5px 14px',
  fontSize: 13,
  fontWeight: 500,
  cursor: 'pointer',
  lineHeight: '22px',
}

export default function Toolbar({ excalidrawAPI }: Props): React.JSX.Element {
  return (
    <div
      style={{
        position: 'fixed',
        top: 12,
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        gap: 8,
        zIndex: 10,
        background: '#313244',
        padding: '5px 10px',
        borderRadius: 8,
        boxShadow: '0 2px 10px rgba(0,0,0,0.5)',
      }}
    >
      <button style={buttonStyle} onClick={() => addNode(excalidrawAPI, '!editor')}>
        Add Editor
      </button>
      <button style={buttonStyle} onClick={() => addNode(excalidrawAPI, '!terminal')}>
        Add Terminal
      </button>
    </div>
  )
}
