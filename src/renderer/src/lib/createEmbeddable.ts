import { colors } from "../theme";

export type EmbeddableLink = "!editor" | "!terminal";

export type EmbeddableElement = {
  id: string;
  type: "embeddable";
  x: number;
  y: number;
  width: number;
  height: number;
  angle: number;
  strokeColor: string;
  backgroundColor: string;
  fillStyle: "solid";
  strokeWidth: number;
  strokeStyle: "solid";
  roughness: number;
  opacity: number;
  groupIds: string[];
  frameId: null;
  roundness: null;
  seed: number;
  version: number;
  versionNonce: number;
  isDeleted: false;
  boundElements: null;
  updated: number;
  link: EmbeddableLink;
  locked: boolean;
  scale: [number, number];
  customData: { link: EmbeddableLink };
  index: null;
};

const DEFAULT_NODE_WIDTH = 800;
const DEFAULT_NODE_HEIGHT = 500;
const NODE_STROKE_WIDTH = 2;
const CASCADE_STEP = 30;
const SAME_ORIGIN_THRESHOLD = 2;

type Viewport = { scrollX: number; scrollY: number; zoom: { value: number } };
type Box = { x: number; y: number; width: number; height: number; isDeleted: boolean };

function sameOrigin(candidateX: number, candidateY: number, existingX: number, existingY: number): boolean {
  return Math.abs(candidateX - existingX) < SAME_ORIGIN_THRESHOLD && Math.abs(candidateY - existingY) < SAME_ORIGIN_THRESHOLD;
}

function findFreePosition(
  x: number,
  y: number,
  existing: readonly Box[],
): { x: number; y: number } {
  const active = existing.filter((element) => !element.isDeleted);
  let offset = 0;
  while (active.some((element) => sameOrigin(x + offset, y + offset, element.x, element.y))) {
    offset += CASCADE_STEP;
  }
  return { x: x + offset, y: y + offset };
}

export function createEmbeddableElement(
  link: EmbeddableLink,
  viewport: Viewport,
  existing: readonly Box[] = [],
  size = { width: DEFAULT_NODE_WIDTH, height: DEFAULT_NODE_HEIGHT }
): EmbeddableElement {
  const { scrollX, scrollY, zoom } = viewport;
  const { width, height } = size;

  const centerX = (window.innerWidth / 2 - scrollX) / zoom.value - width / 2;
  const centerY = (window.innerHeight / 2 - scrollY) / zoom.value - height / 2;
  const { x, y } = findFreePosition(centerX, centerY, existing);

  return {
    id: crypto.randomUUID(),
    type: "embeddable",
    x,
    y,
    width,
    height,
    angle: 0,
    strokeColor: colors.overlay0,
    backgroundColor: "transparent",
    fillStyle: "solid",
    strokeWidth: NODE_STROKE_WIDTH,
    strokeStyle: "solid",
    roughness: 0,
    opacity: 100,
    groupIds: [],
    frameId: null,
    roundness: null,
    seed: Math.floor(Math.random() * 2 ** 31),
    version: 1,
    versionNonce: Math.floor(Math.random() * 2 ** 31),
    isDeleted: false,
    boundElements: null,
    updated: Date.now(),
    link,
    locked: false,
    scale: [1, 1],
    customData: { link },
    index: null
  };
}
