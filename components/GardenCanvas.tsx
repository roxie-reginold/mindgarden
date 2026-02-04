import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Stage, Layer, Image as KonvaImage, Text, Rect } from 'react-konva';
import Konva from 'konva';
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import { ThoughtCard } from '../types';
import { KonvaPlantSprite } from './KonvaPlantSprite';
import { useKonvaCamera } from '../hooks/useKonvaCamera';
import {
  useIslandLayout,
  ISLAND_WIDTH,
  ISLAND_HEIGHT,
  getIslandOrigin,
  getWorldSize,
  SVG_CROP,
} from '../hooks/useIslandLayout';

interface GardenCanvasProps {
  thoughts: ThoughtCard[];
  islandCount: number;
  onPlantClick: (thought: ThoughtCard) => void;
  onNewThoughtClick: () => void;
}

// Load and cache the island background image
const islandImageCache: { img: HTMLImageElement | null; loading: boolean } = {
  img: null,
  loading: false,
};

function useIslandImage(): HTMLImageElement | null {
  const [img, setImg] = useState<HTMLImageElement | null>(islandImageCache.img);

  useEffect(() => {
    if (islandImageCache.img) {
      setImg(islandImageCache.img);
      return;
    }
    if (islandImageCache.loading) return;

    islandImageCache.loading = true;
    const image = new window.Image();
    image.onload = () => {
      islandImageCache.img = image;
      islandImageCache.loading = false;
      setImg(image);
    };
    image.onerror = () => {
      islandImageCache.loading = false;
      console.warn('Failed to load island background');
    };
    image.src = './island.svg';
  }, []);

  return img;
}

// Responsive stage dimensions
function useStageSize(containerRef: React.RefObject<HTMLDivElement | null>) {
  const [size, setSize] = useState({ width: window.innerWidth, height: window.innerHeight - 64 });

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setSize({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, [containerRef]);

  return size;
}

export const GardenCanvas: React.FC<GardenCanvasProps> = ({
  thoughts,
  islandCount,
  onPlantClick,
  onNewThoughtClick,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageSize = useStageSize(containerRef);
  const islandImage = useIslandImage();

  const bgLayerRef = useRef<Konva.Layer>(null);
  const { islands, worldWidth, worldHeight } = useIslandLayout(thoughts, islandCount);

  // Apply mix-blend-mode: multiply to the background layer canvas
  // so white areas in the SVG blend seamlessly with the page gradient
  useEffect(() => {
    if (bgLayerRef.current) {
      const canvas = bgLayerRef.current.getCanvas()._canvas as HTMLCanvasElement;
      canvas.style.mixBlendMode = 'multiply';
    }
  }, []);

  // Initialize camera to center the first island in the viewport
  const {
    camera,
    setCamera,
    stageRef,
    handleWheel,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    animateZoomOut,
  } = useKonvaCamera();

  // Center camera on initial load
  const initializedRef = useRef(false);
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    // Fit all islands in view, or just center the first one
    const fitScale = Math.min(
      stageSize.width / (worldWidth + 100),
      stageSize.height / (worldHeight + 100),
      1 // don't zoom in past 1:1
    );
    const scale = Math.max(fitScale, 0.15);

    const offsetX = (stageSize.width - worldWidth * scale) / 2;
    const offsetY = (stageSize.height - worldHeight * scale) / 2;

    setCamera({ scale, x: offsetX, y: offsetY });
  }, [stageSize, worldWidth, worldHeight, setCamera]);

  // Auto-expand animation: when islandCount increases, smoothly zoom out to show new island
  const prevIslandCountRef = useRef(islandCount);
  useEffect(() => {
    if (islandCount <= prevIslandCountRef.current) {
      prevIslandCountRef.current = islandCount;
      return;
    }
    prevIslandCountRef.current = islandCount;

    // Calculate new scale to fit all islands in the grid
    const newWorld = getWorldSize(islandCount);
    const fitScale = Math.min(
      stageSize.width / (newWorld.width + 100),
      stageSize.height / (newWorld.height + 100),
      1
    );
    const targetScale = Math.max(fitScale, 0.15);

    const targetX = (stageSize.width - newWorld.width * targetScale) / 2;
    const targetY = (stageSize.height - newWorld.height * targetScale) / 2;

    animateZoomOut(targetScale, targetX, targetY, 600);
  }, [islandCount, stageSize, worldHeight, animateZoomOut]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[calc(100vh-4rem)] bg-gradient-to-b from-[#FDFCF8] to-[#F5F5F4] overflow-hidden"
    >
      <Stage
        ref={stageRef}
        width={stageSize.width}
        height={stageSize.height}
        scaleX={camera.scale}
        scaleY={camera.scale}
        x={camera.x}
        y={camera.y}
        onWheel={handleWheel}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        {/* Background layer: island images (mix-blend-mode applied via ref) */}
        <Layer ref={bgLayerRef} listening={false}>
          {islands.map((island) =>
            islandImage ? (
              <KonvaImage
                key={`island-bg-${island.index}`}
                image={islandImage}
                x={island.x}
                y={island.y}
                width={island.width}
                height={island.height}
                crop={SVG_CROP}
              />
            ) : null
          )}

          {/* Empty state text */}
          {thoughts.length === 0 && (
            <Text
              x={ISLAND_WIDTH * 0.25}
              y={ISLAND_HEIGHT * 0.45}
              text="The soil is listening..."
              fontSize={18}
              fontFamily="'Playfair Display', serif"
              fontStyle="italic"
              fill="#78716c"
              opacity={0.6}
              align="center"
            />
          )}
        </Layer>

        {/* Plant layer */}
        <Layer>
          {thoughts.map((thought) => (
            <KonvaPlantSprite
              key={thought.id}
              thought={thought}
              onClick={onPlantClick}
            />
          ))}
        </Layer>
      </Stage>

      {/* "Sow a New Seed" button (HTML overlay, outside Konva) */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-30">
        <motion.button
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.95 }}
          onClick={onNewThoughtClick}
          className="bg-stone-800 text-white px-8 py-4 rounded-full shadow-xl hover:shadow-2xl hover:bg-stone-700 transition-all flex items-center gap-3 group"
        >
          <Plus
            size={20}
            className="text-teal-300 group-hover:rotate-90 transition-transform duration-300"
          />
          <span className="font-serif font-medium tracking-wide">Sow a New Seed</span>
        </motion.button>
      </div>
    </div>
  );
};
