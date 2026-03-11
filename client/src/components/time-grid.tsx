import { useState, useRef, useCallback, useEffect, Fragment, useMemo } from "react";
import { useDragSelection } from "@/hooks/use-drag-selection";
import { convertSlotToLocalTime, formatTimeForDisplay } from "@/lib/time-slots";
import { format, parseISO, eachDayOfInterval } from "date-fns";
import type { RoomWithParticipants } from "@shared/schema";
import { useTranslation } from "react-i18next";

interface TimeGridProps {
  room: RoomWithParticipants;
  selectedSlots: number[];
  onSlotsChange: (slots: number[]) => void;
  viewingTimezone: string;
  isEditMode?: boolean;
  heatmapData?: number[];
  softHeatmapData?: number[];
  onSlotClick?: (slotIndex: number) => void;
  selectedParticipant?: number | null;
  use12h?: boolean;
}

export function TimeGrid({
  room,
  selectedSlots,
  onSlotsChange,
  viewingTimezone,
  isEditMode = false,
  heatmapData,
  softHeatmapData,
  onSlotClick,
  selectedParticipant,
  use12h = false,
}: TimeGridProps) {
  const gridRef = useRef<HTMLDivElement>(null);
  const touchStartPos = useRef<{ x: number; y: number; determined: boolean; isHorizontal: boolean } | null>(null);
  const { t } = useTranslation();
  const [isDragging, setIsDragging] = useState(false);
  const [dragValue, setDragValue] = useState<number>(0);
  const [dragMode, setDragMode] = useState<"available" | "if-needed">("available");

  // Calculate actual dates based on room's date range
  const actualDays = useMemo(() => {
    const startDate = parseISO(room.startDate);
    const endDate = parseISO(room.endDate);
    const dateRange = eachDayOfInterval({ start: startDate, end: endDate });
    
    return dateRange.map(date => ({
      date,
      label: format(date, 'EEE'), // Mon, Tue, Wed etc
      dateLabel: format(date, 'M/d'), // 7/22, 7/23 etc
      fullLabel: format(date, 'EEE M/d'), // Mon 7/22, Tue 7/23 etc
      tooltip: format(date, 'EEEE, MMMM d, yyyy'), // Monday, July 22, 2025
    }));
  }, [room.startDate, room.endDate]);

  const slotMinutes = room.slotMinutes ?? 60;
  const slotsPerHour = Math.round(60 / slotMinutes);
  const slotsInWindow = (room.timeEnd - room.timeStart) * slotsPerHour;
  const slotsPerDay = 24 * slotsPerHour;
  const slots = Array.from({ length: slotsInWindow }, (_, i) => i);

  const slotToTimeStr = (slotIdx: number): string => {
    const totalMin = room.timeStart * 60 + slotIdx * slotMinutes;
    const hours = Math.floor(totalMin / 60);
    const mins = totalMin % 60;
    if (use12h) {
      const period = hours >= 12 ? 'PM' : 'AM';
      const h12 = hours % 12 || 12;
      return mins === 0 ? `${h12}${period}` : `${h12}:${mins.toString().padStart(2, '0')}${period}`;
    }
    return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`;
  };

  const getSlotIndex = (dayIndex: number, slotIdx: number) => {
    return dayIndex * slotsPerDay + slotIdx;
  };

  const handleMouseDown = useCallback((slotIndex: number) => {
    if (!isEditMode) {
      onSlotClick?.(slotIndex);
      return;
    }

    setIsDragging(true);
    const target = dragMode === "available" ? 1 : 2;
    const current = selectedSlots[slotIndex] ?? 0;
    const newValue = current === target ? 0 : target;
    setDragValue(newValue);
    
    const newSlots = [...selectedSlots];
    newSlots[slotIndex] = newValue;
    onSlotsChange(newSlots);
  }, [isEditMode, selectedSlots, onSlotsChange, onSlotClick, dragMode]);

  const handleMouseEnter = useCallback((slotIndex: number) => {
    if (!isDragging || !isEditMode) return;
    
    const newSlots = [...selectedSlots];
    newSlots[slotIndex] = dragValue;
    onSlotsChange(newSlots);
  }, [isDragging, isEditMode, selectedSlots, dragValue, onSlotsChange]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent, slotIndex: number) => {
    if (!isEditMode) {
      onSlotClick?.(slotIndex);
      return;
    }
    touchStartPos.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
      determined: false,
      isHorizontal: false,
    };
    setIsDragging(true);
    const target = dragMode === "available" ? 1 : 2;
    const current = selectedSlots[slotIndex] ?? 0;
    const newValue = current === target ? 0 : target;
    setDragValue(newValue);
    const newSlots = [...selectedSlots];
    newSlots[slotIndex] = newValue;
    onSlotsChange(newSlots);
  }, [isEditMode, selectedSlots, onSlotsChange, onSlotClick, dragMode]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging || !isEditMode) return;
    const touch = e.touches[0];
    const pos = touchStartPos.current;
    if (pos && !pos.determined) {
      const dx = Math.abs(touch.clientX - pos.x);
      const dy = Math.abs(touch.clientY - pos.y);
      if (dx < 5 && dy < 5) return;
      pos.determined = true;
      pos.isHorizontal = dx >= dy;
    }
    if (pos && !pos.isHorizontal) return; // let vertical scroll pass through
    e.preventDefault();
    const element = document.elementFromPoint(touch.clientX, touch.clientY);
    if (element) {
      const slotAttr = element.getAttribute("data-slot");
      if (slotAttr !== null) {
        const idx = parseInt(slotAttr);
        const newSlots = [...selectedSlots];
        newSlots[idx] = dragValue;
        onSlotsChange(newSlots);
      }
    }
  }, [isDragging, isEditMode, selectedSlots, dragValue, onSlotsChange]);

  // Add event listeners for mouse up
  useEffect(() => {
    document.addEventListener("mouseup", handleMouseUp);
    return () => document.removeEventListener("mouseup", handleMouseUp);
  }, [handleMouseUp]);

  const getCellClass = (dayIndex: number, slotIdx: number) => {
    const slotIndex = getSlotIndex(dayIndex, slotIdx);
    let classes = "time-cell";

    if (isEditMode) {
      const v = selectedSlots[slotIndex] ?? 0;
      if (v === 1) classes += " selected";
      else if (v === 2) classes += " if-needed";
    }

    if (heatmapData && !isEditMode) {
      const count = heatmapData[slotIndex];
      if (count > 0) {
        const intensity = Math.min(count, 5);
        classes += ` heatmap-${intensity}`;
      } else if ((softHeatmapData?.[slotIndex] ?? 0) > 0) {
        classes += " heatmap-soft";
      }
    }

    if (selectedParticipant) {
      const participant = room.participants.find(p => p.id === selectedParticipant);
      if (participant?.availability[slotIndex] === "1" || participant?.availability[slotIndex] === "2") {
        classes += " user-focus";
      }
    }

    if (room.isConfirmed && room.confirmedSlot === slotIndex) {
      classes += " confirmed";
    }

    return classes;
  };

  const getSlotTooltip = (dayIndex: number, slotIdx: number) => {
    const slotIndex = getSlotIndex(dayIndex, slotIdx);
    const localTime = convertSlotToLocalTime(dayIndex, slotIdx, viewingTimezone, room.startDate, room.timeStart, slotMinutes);
    
    if (heatmapData && !isEditMode) {
      const count = heatmapData[slotIndex];
      const softCount = softHeatmapData?.[slotIndex] ?? 0;
      const availableParticipants = room.participants.filter(
        p => p.availability[slotIndex] === "1"
      );
      const ifNeededParticipants = room.participants.filter(
        p => p.availability[slotIndex] === "2"
      );
      
    let tooltip = `${formatTimeForDisplay(localTime, use12h)} - ${count} available`;
      if (availableParticipants.length > 0) tooltip += `: ${availableParticipants.map(p => p.name).join(", ")}`;
      if (softCount > 0) tooltip += ` · ${softCount} if needed: ${ifNeededParticipants.map(p => p.name).join(", ")}`;
      return tooltip;
    }
    
    return formatTimeForDisplay(localTime, use12h);
  };

  return (
    <div className="w-full overflow-x-auto">
      {isEditMode && (
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs text-muted-foreground font-medium">{t('timeGrid.markAs')}</span>
          <div className="flex gap-1">
            <button
              type="button"
              className={`px-2.5 py-1 rounded text-xs font-medium border transition-colors ${
                dragMode === "available"
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border text-muted-foreground hover:bg-accent"
              }`}
              onClick={() => setDragMode("available")}
            >
              ✓ {t('timeGrid.available')}
            </button>
            <button
              type="button"
              className={`px-2.5 py-1 rounded text-xs font-medium border transition-colors ${
                dragMode === "if-needed"
                  ? "bg-amber-500 text-white border-amber-500"
                  : "border-border text-muted-foreground hover:bg-accent"
              }`}
              onClick={() => setDragMode("if-needed")}
            >
              ~ {t('timeGrid.ifNeeded')}
            </button>
            <button
              type="button"
              className="ml-1 px-2.5 py-1 rounded text-xs font-medium border border-border text-muted-foreground hover:bg-accent transition-colors"
              onClick={() => onSlotsChange(new Array(selectedSlots.length).fill(0))}
            >
              {t('timeGrid.clearAll')}
            </button>
          </div>
        </div>
      )}
      <div
        ref={gridRef}
        className="time-grid"
        style={{ gridTemplateColumns: `80px repeat(${slots.length}, minmax(${slotMinutes === 30 ? 28 : 36}px, 1fr))` }}
        onTouchMove={handleTouchMove}
      >
        {/* Corner cell */}
        <div className="day-header">Time</div>
        
        {/* Slot headers */}
        {slots.map(s => (
          <div key={s} className="time-header">
            {slotToTimeStr(s)}
          </div>
        ))}
        
        {/* Day rows */}
        {actualDays.map((dayInfo, dayIndex) => (
          <Fragment key={dayInfo.date.toISOString()}>
            <div className="day-header" title={dayInfo.tooltip}>
              <div className="day-name">{dayInfo.label}</div>
              <div className="day-date">{dayInfo.dateLabel}</div>
            </div>
            {slots.map((_, slotIdx) => {
              const slotIndex = getSlotIndex(dayIndex, slotIdx);
              return (
                <div
                  key={`${dayIndex}-${slotIdx}`}
                  className={getCellClass(dayIndex, slotIdx)}
                  title={getSlotTooltip(dayIndex, slotIdx)}
                  data-slot={slotIndex}
                  onMouseDown={() => handleMouseDown(slotIndex)}
                  onMouseEnter={() => handleMouseEnter(slotIndex)}
                  onTouchStart={(e) => handleTouchStart(e, slotIndex)}
                  style={{ userSelect: "none" }}
                />
              );
            })}
          </Fragment>
        ))}
      </div>
    </div>
  );
}
