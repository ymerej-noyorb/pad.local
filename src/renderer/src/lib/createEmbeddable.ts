import { colors } from "../theme";

export type EmbeddableLink = "!editor" | "!terminal";

const NODE_WIDTH = 800;
const NODE_HEIGHT = 500;
const NODE_STROKE_WIDTH = 2;
const NODE_OPACITY = 100;
const RANDOM_INT_MAX = 2 ** 31;

export function createEmbeddableElement(link: EmbeddableLink, scrollX: number, scrollY: number, zoom: number) {
  const x = (window.innerWidth / 2 - scrollX) / zoom - NODE_WIDTH / 2;
  const y = (window.innerHeight / 2 - scrollY) / zoom - NODE_HEIGHT / 2;

  return {
    id: crypto.randomUUID(),
    type: "embeddable" as const,
    x,
    y,
    width: NODE_WIDTH,
    height: NODE_HEIGHT,
    angle: 0,
    strokeColor: colors.overlay0,
    backgroundColor: "transparent",
    fillStyle: "solid" as const,
    strokeWidth: NODE_STROKE_WIDTH,
    strokeStyle: "solid" as const,
    roughness: 0,
    opacity: NODE_OPACITY,
    groupIds: [],
    frameId: null,
    roundness: null,
    seed: Math.floor(Math.random() * RANDOM_INT_MAX),
    version: 1,
    versionNonce: Math.floor(Math.random() * RANDOM_INT_MAX),
    isDeleted: false as const,
    boundElements: null,
    updated: Date.now(),
    link,
    locked: false,
    scale: [1, 1] as [number, number],
    customData: { link },
    index: null,
  };
}
