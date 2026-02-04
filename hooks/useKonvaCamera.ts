import { useState, useCallback, useRef } from 'react';
import Konva from 'konva';

export interface GardenCamera {
  scale: number;
  x: number;
  y: number;
}

const MIN_SCALE = 0.15;
const MAX_SCALE = 2.0;
const ZOOM_SENSITIVITY = 1.08;

export function useKonvaCamera(initialCamera?: Partial<GardenCamera>) {
  const [camera, setCamera] = useState<GardenCamera>({
    scale: initialCamera?.scale ?? 1,
    x: initialCamera?.x ?? 0,
    y: initialCamera?.y ?? 0,
  });

  const stageRef = useRef<Konva.Stage | null>(null);
  const animRef = useRef<Konva.Tween | null>(null);

  // Wheel zoom anchored to cursor position
  const handleWheel = useCallback((e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();

    const stage = e.target.getStage();
    if (!stage) return;

    const oldScale = stage.scaleX();
    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    const direction = e.evt.deltaY < 0 ? 1 : -1;
    const newScale = Math.min(
      MAX_SCALE,
      Math.max(MIN_SCALE, direction > 0 ? oldScale * ZOOM_SENSITIVITY : oldScale / ZOOM_SENSITIVITY)
    );

    // Anchor zoom to cursor
    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };

    const newPos = {
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    };

    setCamera({ scale: newScale, x: newPos.x, y: newPos.y });
  }, []);

  // Pointer-based pan (no drag on plants — this is stage-level only)
  const isPanning = useRef(false);
  const panStart = useRef({ x: 0, y: 0 });

  const handlePointerDown = useCallback((e: Konva.KonvaEventObject<PointerEvent>) => {
    // Only pan when clicking on the stage background, not on shapes
    if (e.target !== e.target.getStage()) return;
    isPanning.current = true;
    const stage = e.target.getStage()!;
    panStart.current = { x: e.evt.clientX - stage.x(), y: e.evt.clientY - stage.y() };
  }, []);

  const handlePointerMove = useCallback((e: Konva.KonvaEventObject<PointerEvent>) => {
    if (!isPanning.current) return;
    e.evt.preventDefault();
    setCamera(prev => ({
      ...prev,
      x: e.evt.clientX - panStart.current.x,
      y: e.evt.clientY - panStart.current.y,
    }));
  }, []);

  const handlePointerUp = useCallback(() => {
    isPanning.current = false;
  }, []);

  // Animated zoom-out for auto-expand
  // Uses Konva.Tween on the stage for smooth animation
  const animateZoomOut = useCallback((targetScale: number, targetX: number, targetY: number, duration = 600) => {
    const stage = stageRef.current;
    if (!stage) {
      // Fallback: just set state directly
      setCamera({ scale: targetScale, x: targetX, y: targetY });
      return;
    }

    // Cancel any running animation
    if (animRef.current) {
      animRef.current.destroy();
      animRef.current = null;
    }

    const tween = new Konva.Tween({
      node: stage,
      duration: duration / 1000,
      scaleX: targetScale,
      scaleY: targetScale,
      x: targetX,
      y: targetY,
      easing: Konva.Easings.EaseInOut,
      onFinish: () => {
        // Sync React state with final Konva values
        setCamera({ scale: targetScale, x: targetX, y: targetY });
        animRef.current = null;
      },
    });

    animRef.current = tween;
    tween.play();
  }, []);

  return {
    camera,
    setCamera,
    stageRef,
    handleWheel,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    animateZoomOut,
  };
}
