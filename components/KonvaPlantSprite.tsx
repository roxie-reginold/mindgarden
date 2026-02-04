import React, { useEffect, useRef, useState } from 'react';
import { Image as KonvaImage, Group, Ellipse, Text, Rect } from 'react-konva';
import Konva from 'konva';
import { ThoughtCard } from '../types';
import { thoughtToWorldPosition } from '../hooks/useIslandLayout';

interface KonvaPlantSpriteProps {
  thought: ThoughtCard;
  onClick: (thought: ThoughtCard) => void;
}

// Image cache: URL -> HTMLImageElement
const imageCache = new Map<string, HTMLImageElement>();

function useLoadImage(src: string): HTMLImageElement | null {
  const [image, setImage] = useState<HTMLImageElement | null>(() => imageCache.get(src) ?? null);

  useEffect(() => {
    if (imageCache.has(src)) {
      setImage(imageCache.get(src)!);
      return;
    }

    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      imageCache.set(src, img);
      setImage(img);
    };
    img.onerror = () => {
      console.warn('Failed to load plant image:', src.slice(0, 60));
    };
    img.src = src;

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [src]);

  return image;
}

function getPlantSize(stage: string): number {
  switch (stage) {
    case 'seed': return 64;
    case 'sprout': return 96;
    case 'bloom': return 128;
    case 'fruit': return 160;
    default: return 96;
  }
}

export const KonvaPlantSprite: React.FC<KonvaPlantSpriteProps> = React.memo(({ thought, onClick }) => {
  const image = useLoadImage(thought.imageUrl);
  const groupRef = useRef<Konva.Group>(null);
  const [hovered, setHovered] = useState(false);

  const size = getPlantSize(thought.growthStage);
  const worldPos = thoughtToWorldPosition(thought);

  // Center horizontally, anchor near bottom (like the original -translate-y-[85%])
  const drawX = worldPos.x - size / 2;
  const drawY = worldPos.y - size * 0.85;

  // Entry animation + floating bob
  useEffect(() => {
    const group = groupRef.current;
    if (!group) return;

    // Start scaled to 0
    group.scaleX(0);
    group.scaleY(0);
    group.opacity(0);

    // Spring-like entry
    const entryTween = new Konva.Tween({
      node: group,
      duration: 0.5,
      scaleX: 1,
      scaleY: 1,
      opacity: 1,
      easing: Konva.Easings.ElasticEaseOut,
    });
    entryTween.play();

    // Floating bob animation (looping)
    const bobDelay = Math.random() * 2000;
    let bobAnim: Konva.Animation | null = null;
    const startY = group.y();

    const timerId = setTimeout(() => {
      bobAnim = new Konva.Animation((frame) => {
        if (!frame) return;
        const offset = Math.sin(frame.time / 1000) * 3;
        group.y(startY + offset);
      }, group.getLayer());
      bobAnim.start();
    }, bobDelay);

    return () => {
      clearTimeout(timerId);
      entryTween.destroy();
      if (bobAnim) bobAnim.stop();
    };
  }, []);

  if (!image) return null;

  return (
    <Group
      ref={groupRef}
      x={drawX}
      y={drawY}
      onClick={() => onClick(thought)}
      onTap={() => onClick(thought)}
      onMouseEnter={(e) => {
        const stage = e.target.getStage();
        if (stage) stage.container().style.cursor = 'pointer';
        setHovered(true);
      }}
      onMouseLeave={(e) => {
        const stage = e.target.getStage();
        if (stage) stage.container().style.cursor = 'default';
        setHovered(false);
      }}
    >
      {/* Grounding shadow */}
      <Ellipse
        x={size / 2}
        y={size * 0.92}
        radiusX={size * 0.25}
        radiusY={3}
        fill="rgba(28, 25, 23, 0.08)"
      />

      {/* Plant image */}
      <KonvaImage
        image={image}
        width={size}
        height={size}
        scaleX={hovered ? 1.1 : 1}
        scaleY={hovered ? 1.1 : 1}
        offsetX={hovered ? size * 0.05 : 0}
        offsetY={hovered ? size * 0.05 : 0}
      />

      {/* Hover label */}
      {hovered && (
        <Group x={size / 2} y={-12}>
          <Rect
            offsetX={getTextWidth(thought.meta.topic) / 2 + 10}
            offsetY={10}
            width={getTextWidth(thought.meta.topic) + 20}
            height={24}
            fill="white"
            cornerRadius={8}
            shadowColor="rgba(0,0,0,0.1)"
            shadowBlur={4}
            shadowOffsetY={2}
          />
          <Text
            text={thought.meta.topic}
            fontSize={12}
            fontFamily="'Playfair Display', serif"
            fill="#44403c"
            offsetX={getTextWidth(thought.meta.topic) / 2}
            offsetY={4}
          />
        </Group>
      )}
    </Group>
  );
});

KonvaPlantSprite.displayName = 'KonvaPlantSprite';

// Rough text width estimator for label centering
function getTextWidth(text: string): number {
  return text.length * 7;
}
