import { useMemo } from 'react';
import { ThoughtCard, Position } from '../types';

// 12 predefined percentage slots per island (matches App.tsx ISLAND_SLOTS)
export const ISLAND_SLOTS: Position[] = [
  // Left Island (Large L-Shape)
  { x: 15, y: 55 },
  // { x: 35, y: 40 },
  // { x: 50, y: 45 },
  // { x: 25, y: 65 },
  // { x: 45, y: 60 },
  // { x: 20, y: 80 },
  // { x: 40, y: 75 },
  // Right Island (Kidney Shape)
  // { x: 75, y: 50 },
  // { x: 90, y: 60 },
  // { x: 65, y: 70 },
  // { x: 85, y: 75 },
  // { x: 75, y: 85 },
];

export const SLOTS_PER_ISLAND = ISLAND_SLOTS.length; // 12

// Island dimensions in world pixels (3:2 aspect ratio)
export const ISLAND_WIDTH = 900;
export const ISLAND_HEIGHT = 600;
export const ISLAND_GAP = 60; // gap between islands
export const ISLANDS_PER_ROW = 2; // max 2 islands per row, then wrap

// Crop region of the source SVG (1254x836) to trim whitespace around the island art.
// Content spans roughly x:50–1124, y:183–745. Add a small margin.
export const SVG_CROP = {
  x: 30,
  y: 160,
  width: 1115,
  height: 610,
};

export interface IslandRect {
  index: number;
  x: number; // world-space left edge
  y: number; // world-space top edge
  width: number;
  height: number;
}

export interface SlotInfo {
  islandIndex: number;
  slotIndex: number;
  globalIndex: number;
  worldX: number; // absolute pixel x in world space
  worldY: number; // absolute pixel y in world space
}

/**
 * Converts a ThoughtCard's percentage position to a global slot index.
 * Returns -1 if the position doesn't match any known slot.
 */
function positionToGlobalIndex(pos: Position): number {
  const islandIndex = Math.floor(pos.x / 100);
  const localX = pos.x % 100;
  const localY = pos.y;

  const slotIndex = ISLAND_SLOTS.findIndex(
    slot => Math.abs(slot.x - localX) < 1 && Math.abs(slot.y - localY) < 1
  );

  if (slotIndex === -1) return -1;
  return islandIndex * SLOTS_PER_ISLAND + slotIndex;
}

/**
 * Returns the world-pixel position of an island's top-left corner.
 */
export function getIslandOrigin(islandIndex: number): { x: number; y: number } {
  const col = islandIndex % ISLANDS_PER_ROW;
  const row = Math.floor(islandIndex / ISLANDS_PER_ROW);
  return {
    x: col * (ISLAND_WIDTH + ISLAND_GAP),
    y: row * (ISLAND_HEIGHT + ISLAND_GAP),
  };
}

// The full SVG source dimensions (before crop).
const SVG_FULL_W = 1254;
const SVG_FULL_H = 836;

/**
 * Converts a ThoughtCard's percentage position to absolute world-pixel coordinates.
 * Slot percentages are relative to the full SVG. Since we crop the SVG when rendering,
 * we remap: source pixel → offset within crop → fraction of crop → island pixel.
 */
export function thoughtToWorldPosition(thought: ThoughtCard): { x: number; y: number } {
  const islandIndex = Math.floor(thought.position.x / 100);
  const localX = thought.position.x % 100; // % of full SVG width
  const localY = thought.position.y;        // % of full SVG height

  // Convert slot % to pixel in full SVG, then to fraction within crop region
  const srcPixelX = (localX / 100) * SVG_FULL_W;
  const srcPixelY = (localY / 100) * SVG_FULL_H;
  const cropFracX = (srcPixelX - SVG_CROP.x) / SVG_CROP.width;
  const cropFracY = (srcPixelY - SVG_CROP.y) / SVG_CROP.height;

  const origin = getIslandOrigin(islandIndex);
  return {
    x: origin.x + cropFracX * ISLAND_WIDTH,
    y: origin.y + cropFracY * ISLAND_HEIGHT,
  };
}

/**
 * Derives the set of occupied global slot indices from current thoughts.
 */
function getOccupiedIndices(thoughts: ThoughtCard[]): Set<number> {
  const occupied = new Set<number>();
  for (const t of thoughts) {
    const idx = positionToGlobalIndex(t.position);
    if (idx !== -1) occupied.add(idx);
  }
  return occupied;
}

/**
 * Returns the next available slot, or null if all slots across `islandCount` islands are full.
 * This is used by App.tsx to detect fullness and trigger expansion.
 */
export function getNextAvailableSlot(
  thoughts: ThoughtCard[],
  islandCount: number
): SlotInfo | null {
  const occupied = getOccupiedIndices(thoughts);
  const totalSlots = islandCount * SLOTS_PER_ISLAND;

  for (let i = 0; i < totalSlots; i++) {
    if (!occupied.has(i)) {
      const islandIndex = Math.floor(i / SLOTS_PER_ISLAND);
      const slotIndex = i % SLOTS_PER_ISLAND;
      const slot = ISLAND_SLOTS[slotIndex];
      const origin = getIslandOrigin(islandIndex);

      const srcPxX = (slot.x / 100) * SVG_FULL_W;
      const srcPxY = (slot.y / 100) * SVG_FULL_H;
      return {
        islandIndex,
        slotIndex,
        globalIndex: i,
        worldX: origin.x + ((srcPxX - SVG_CROP.x) / SVG_CROP.width) * ISLAND_WIDTH,
        worldY: origin.y + ((srcPxY - SVG_CROP.y) / SVG_CROP.height) * ISLAND_HEIGHT,
      };
    }
  }

  return null; // All islands are full — trigger expansion
}

/**
 * Converts a SlotInfo back to the percentage-based Position stored on ThoughtCard.
 */
export function slotToPosition(slot: SlotInfo): Position {
  const localSlot = ISLAND_SLOTS[slot.slotIndex];
  return {
    x: slot.islandIndex * 100 + localSlot.x,
    y: localSlot.y,
  };
}

/**
 * Returns the total world size needed for all islands in a grid layout.
 */
export function getWorldSize(islandCount: number): { width: number; height: number } {
  if (islandCount <= 0) return { width: ISLAND_WIDTH, height: ISLAND_HEIGHT };
  const cols = Math.min(islandCount, ISLANDS_PER_ROW);
  const rows = Math.ceil(islandCount / ISLANDS_PER_ROW);
  return {
    width: cols * ISLAND_WIDTH + (cols - 1) * ISLAND_GAP,
    height: rows * ISLAND_HEIGHT + (rows - 1) * ISLAND_GAP,
  };
}

/**
 * React hook that computes island layout data from current thoughts and island count.
 */
export function useIslandLayout(thoughts: ThoughtCard[], islandCount: number) {
  const islands = useMemo<IslandRect[]>(() => {
    return Array.from({ length: islandCount }, (_, i) => {
      const origin = getIslandOrigin(i);
      return {
        index: i,
        x: origin.x,
        y: origin.y,
        width: ISLAND_WIDTH,
        height: ISLAND_HEIGHT,
      };
    });
  }, [islandCount]);

  const occupiedCount = useMemo(() => {
    return getOccupiedIndices(thoughts).size;
  }, [thoughts]);

  const totalSlots = islandCount * SLOTS_PER_ISLAND;
  const isFull = occupiedCount >= totalSlots;

  const { width: worldWidth, height: worldHeight } = getWorldSize(islandCount);

  return {
    islands,
    occupiedCount,
    totalSlots,
    isFull,
    worldWidth,
    worldHeight,
  };
}
