import { useState, useRef, useCallback, useEffect, Fragment, useMemo } from "react";
import { useDragSelection } from "@/hooks/use-drag-selection";
import { convertSlotToLocalTime, formatTimeForDisplay } from "@/lib/time-slots";
import { format, parseISO, eachDayOfInterval } from "date-fns";
import type { RoomWithParticipants } from "@shared/schema";

interface TimeGridProps {
  room: RoomWithParticipants;
  selectedSlots: boolean[];
  onSlotsChange: (slots: boolean[]) => void;
  viewingTimezone: string;
  isEditMode?: boolean;
  heatmapData?: number[];
  onSlotClick?: (slotIndex: number) => void;
  selectedParticipant?: number | null;
}

export function TimeGrid({
  room,
  selectedSlots,
  onSlotsChange,
  viewingTimezone,
  isEditMode = false,
  heatmapData,
  onSlotClick,
  selectedParticipant,
}: TimeGridProps) {
  const gridRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragValue, setDragValue] = useState(false);

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

  const hours = Array.from({ length: 24 }, (_, i) => i);

  const getSlotIndex = (dayIndex: number, hourIndex: number) => {
    return dayIndex * 24 + hourIndex;
  };

  const handleMouseDown = useCallback((slotIndex: number) => {
    if (!isEditMode) {
      onSlotClick?.(slotIndex);
      return;
    }

    setIsDragging(true);
    const newValue = !selectedSlots[slotIndex];
    setDragValue(newValue);
    
    const newSlots = [...selectedSlots];
    newSlots[slotIndex] = newValue;
    onSlotsChange(newSlots);
  }, [isEditMode, selectedSlots, onSlotsChange, onSlotClick]);

  const handleMouseEnter = useCallback((slotIndex: number) => {
    if (!isDragging || !isEditMode) return;
    
    const newSlots = [...selectedSlots];
    newSlots[slotIndex] = dragValue;
    onSlotsChange(newSlots);
  }, [isDragging, isEditMode, selectedSlots, dragValue, onSlotsChange]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Add event listeners for mouse up
  useEffect(() => {
    document.addEventListener("mouseup", handleMouseUp);
    return () => document.removeEventListener("mouseup", handleMouseUp);
  }, [handleMouseUp]);

  const getCellClass = (dayIndex: number, hourIndex: number) => {
    const slotIndex = getSlotIndex(dayIndex, hourIndex);
    let classes = "time-cell";

    if (isEditMode && selectedSlots[slotIndex]) {
      classes += " selected";
    }

    if (heatmapData && !isEditMode) {
      const count = heatmapData[slotIndex];
      if (count > 0) {
        const intensity = Math.min(count, 5);
        classes += ` heatmap-${intensity}`;
      }
    }

    if (selectedParticipant && room.participants[selectedParticipant]) {
      const participant = room.participants.find(p => p.id === selectedParticipant);
      if (participant?.availability[slotIndex] === "1") {
        classes += " user-focus";
      }
    }

    if (room.isConfirmed && room.confirmedSlot === slotIndex) {
      classes += " confirmed";
    }

    return classes;
  };

  const getSlotTooltip = (dayIndex: number, hourIndex: number) => {
    const slotIndex = getSlotIndex(dayIndex, hourIndex);
    const localTime = convertSlotToLocalTime(dayIndex, hourIndex, viewingTimezone, room.startDate);
    
    if (heatmapData && !isEditMode) {
      const count = heatmapData[slotIndex];
      const availableParticipants = room.participants.filter(
        p => p.availability[slotIndex] === "1"
      );
      
      return `${formatTimeForDisplay(localTime)} - ${count} people available${
        availableParticipants.length > 0 
          ? `: ${availableParticipants.map(p => p.name).join(", ")}`
          : ""
      }`;
    }
    
    return formatTimeForDisplay(localTime);
  };

  return (
    <div className="w-full overflow-x-auto">
      <div ref={gridRef} className="time-grid min-w-[1200px]">
        {/* Corner cell */}
        <div className="day-header">Time</div>
        
        {/* Hour headers */}
        {hours.map(hour => (
          <div key={hour} className="time-header">
            {hour.toString().padStart(2, "0")}
          </div>
        ))}
        
        {/* Day rows */}
        {actualDays.map((dayInfo, dayIndex) => (
          <Fragment key={dayInfo.date.toISOString()}>
            <div className="day-header" title={dayInfo.tooltip}>
              <div className="day-name">{dayInfo.label}</div>
              <div className="day-date">{dayInfo.dateLabel}</div>
            </div>
            {hours.map((hour, hourIndex) => {
              const slotIndex = getSlotIndex(dayIndex, hourIndex);
              return (
                <div
                  key={`${dayIndex}-${hourIndex}`}
                  className={getCellClass(dayIndex, hourIndex)}
                  title={getSlotTooltip(dayIndex, hourIndex)}
                  onMouseDown={() => handleMouseDown(slotIndex)}
                  onMouseEnter={() => handleMouseEnter(slotIndex)}
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
