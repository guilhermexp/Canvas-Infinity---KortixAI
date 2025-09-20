import { useState, useRef, useCallback } from 'react';

export const useInfiniteCanvas = () => {
  const [viewState, setViewState] = useState({
    scale: 1,
    x: 0,
    y: 0,
  });
  const isPanning = useRef(false);
  const lastMousePos = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();

    // Pan with scroll, or zoom with Ctrl/Cmd + scroll
    if (e.ctrlKey || e.metaKey) {
      const { deltaY } = e;
      const zoomFactor = 0.05;
      const newScale = Math.max(0.1, Math.min(2, viewState.scale - deltaY * zoomFactor * viewState.scale));
  
      if (containerRef.current) {
          const rect = containerRef.current.getBoundingClientRect();
          const mouseX = e.clientX - rect.left;
          const mouseY = e.clientY - rect.top;
          
          const newX = viewState.x - (mouseX - viewState.x) * (newScale / viewState.scale - 1);
          const newY = viewState.y - (mouseY - viewState.y) * (newScale / viewState.scale - 1);
          
          setViewState({ scale: newScale, x: newX, y: newY });
      }
    } else {
      const { deltaX, deltaY } = e;
      setViewState(prev => ({
        ...prev,
        x: prev.x - deltaX,
        y: prev.y - deltaY,
      }));
    }
  }, [viewState]);

  const handleCanvasMouseDown = useCallback((e: React.MouseEvent, isSpacePanning: boolean) => {
    // Pan with middle mouse button OR spacebar + left click
    const canPan = e.button === 1 || (e.button === 0 && isSpacePanning);

    if (!canPan || (e.target as HTMLElement).closest('.draggable-node')) return;

    e.preventDefault();
    isPanning.current = true;
    lastMousePos.current = { x: e.clientX, y: e.clientY };
    if (containerRef.current) {
      containerRef.current.style.cursor = 'grabbing';
    }
  }, []);

  const handleCanvasMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isPanning.current) return;
    const dx = e.clientX - lastMousePos.current.x;
    const dy = e.clientY - lastMousePos.current.y;
    lastMousePos.current = { x: e.clientX, y: e.clientY };
    setViewState(prev => ({
      ...prev,
      x: prev.x + dx,
      y: prev.y + dy,
    }));
  }, []);

  const handleCanvasMouseUp = useCallback(() => {
    if (!isPanning.current) return;
    isPanning.current = false;
    // The cursor style is now managed by App.tsx state for spacebar panning
    if (containerRef.current) {
      containerRef.current.style.cursor = ''; // Revert to CSS default
    }
  }, []);

  const zoomIn = useCallback(() => {
    setViewState(prev => ({ ...prev, scale: Math.min(2, prev.scale * 1.2) }));
  }, []);

  const zoomOut = useCallback(() => {
    setViewState(prev => ({ ...prev, scale: Math.max(0.1, prev.scale / 1.2) }));
  }, []);

  return {
    viewState,
    containerRef,
    handleWheel,
    handleCanvasMouseDown,
    handleCanvasMouseMove,
    handleCanvasMouseUp,
    zoomIn,
    zoomOut,
    setViewState,
  };
};