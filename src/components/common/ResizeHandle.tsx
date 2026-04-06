"use client";

import { useCallback, useEffect, useRef } from "react";

interface ResizeHandleProps {
  onResize: (delta: number) => void;
}

export default function ResizeHandle({ onResize }: ResizeHandleProps) {
  const isDragging = useRef(false);
  const startX = useRef(0);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging.current) return;
      const delta = e.clientX - startX.current;
      startX.current = e.clientX;
      onResize(delta);
    },
    [onResize],
  );

  const handleMouseUp = useCallback(() => {
    isDragging.current = false;
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
  }, []);

  useEffect(() => {
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    isDragging.current = true;
    startX.current = e.clientX;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  };

  return (
    <div
      role="separator"
      aria-orientation="vertical"
      className="group flex w-1.5 shrink-0 cursor-col-resize items-center justify-center hover:bg-foreground/20 active:bg-foreground/30"
      onMouseDown={handleMouseDown}
    >
      <div className="h-8 w-0.5 rounded-full bg-foreground/10 transition-colors group-hover:bg-foreground/30 group-active:bg-foreground/40" />
    </div>
  );
}
