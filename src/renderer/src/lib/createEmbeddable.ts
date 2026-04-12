import { colors } from "../theme";
import type { EmbeddableType } from "../types/embeddable";
import type { SceneElement } from "../types/scene";


const NODE_WIDTH = 800;
const NODE_HEIGHT = 500;
const NODE_STROKE_WIDTH = 2;
const NODE_OPACITY = 100;
const RANDOM_INT_MAX = 2 ** 31;
const OVERLAP_OFFSET = 40;
const MAX_OVERLAP_ATTEMPTS = 10;

function findNonOverlappingPosition(
  baseX: number,
  baseY: number,
  existingElements: readonly SceneElement[]
): { x: number; y: number } {
  let x = baseX;
  let y = baseY;

  for (let attempt = 0; attempt < MAX_OVERLAP_ATTEMPTS; attempt++) {
    const hasOverlap = existingElements.some(
      (element) =>
        !element.isDeleted &&
        x < element.x + element.width &&
        x + NODE_WIDTH > element.x &&
        y < element.y + element.height &&
        y + NODE_HEIGHT > element.y
    );

    if (!hasOverlap) return { x, y };
    x += OVERLAP_OFFSET;
    y += OVERLAP_OFFSET;
  }

  return { x, y };
}

export function createEmbeddableElement(
  type: EmbeddableType,
  scrollX: number,
  scrollY: number,
  zoom: number,
  existingElements: readonly SceneElement[]
) {
  const baseX = (window.innerWidth / 2 - scrollX) / zoom - NODE_WIDTH / 2;
  const baseY = (window.innerHeight / 2 - scrollY) / zoom - NODE_HEIGHT / 2;
  const { x, y } = findNonOverlappingPosition(baseX, baseY, existingElements);

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
    link: type,
    locked: false,
    scale: [1, 1] as [number, number],
    customData: { type },
    index: null,
  };
}
