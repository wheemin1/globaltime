import { useState, useCallback, useRef, useEffect } from "react";

interface UseDragSelectionProps {
  onSelectionChange: (selectedIndices: number[], isSelecting: boolean) => void;
}

export function useDragSelection({ onSelectionChange }: UseDragSelectionProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isSelecting, setIsSelecting] = useState(false);
  const startIndexRef = useRef<number | null>(null);
  const currentIndicesRef = useRef<Set<number>>(new Set());

  const handleMouseDown = useCallback((index: number, currentlySelected: boolean) => {
    setIsDragging(true);
    const selecting = !currentlySelected;
    setIsSelecting(selecting);
    startIndexRef.current = index;
    currentIndicesRef.current = new Set([index]);
    onSelectionChange([index], selecting);
  }, [onSelectionChange]);

  const handleMouseEnter = useCallback((index: number) => {
    if (!isDragging || startIndexRef.current === null) return;

    const start = startIndexRef.current;
    const end = index;
    const min = Math.min(start, end);
    const max = Math.max(start, end);
    
    const newIndices: number[] = [];
    for (let i = min; i <= max; i++) {
      newIndices.push(i);
    }
    
    currentIndicesRef.current = new Set(newIndices);
    onSelectionChange(newIndices, isSelecting);
  }, [isDragging, isSelecting, onSelectionChange]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsSelecting(false);
    startIndexRef.current = null;
    currentIndicesRef.current.clear();
  }, []);

  // Add document listeners
  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mouseup", handleMouseUp);
      document.addEventListener("mouseleave", handleMouseUp);
      
      return () => {
        document.removeEventListener("mouseup", handleMouseUp);
        document.removeEventListener("mouseleave", handleMouseUp);
      };
    }
  }, [isDragging, handleMouseUp]);

  return {
    isDragging,
    isSelecting,
    handleMouseDown,
    handleMouseEnter,
    handleMouseUp,
  };
}
