import { useState, useRef, useCallback, useEffect, Fragment, useMemo } from "react";
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

// ─── Doodle-style grid: columns = days, rows = time slots ───────────────────

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
  // In column-layout, vertical drag = time selection, horizontal = page scroll
  const touchStartPos = useRef<{ x: number; y: number; determined: boolean; isVertical: boolean } | null>(null);
  const { t } = useTranslation();
  const [isDragging, setIsDragging] = useState(false);
  const [dragValue, setDragValue] = useState<number>(0);
  const [dragMode, setDragMode] = useState<"available" | "if-needed">("available");

  // columns = days, rows = time slots
  const actualDays = useMemo(() => {
    const startDate = parseISO(room.startDate);
    const endDate = parseISO(room.endDate);
    const dateRange = eachDayOfInterval({ start: startDate, end: endDate });
    return dateRange.map(date => ({
      date,
      label: format(date, 'EEE'),
      dateLabel: format(date, 'M/d'),
      tooltip: format(date, 'EEEE, MMMM d, yyyy'),
    }));
  }, [room.startDate, room.endDate]);

  const slotMinutes = room.slotMinutes ?? 60;
  const slotsPerHour = Math.round(60 / slotMinutes);
  const slotsInWindow = (room.timeEnd - room.timeStart) * slotsPerHour;
  const slotsPerDay = 24 * slotsPerHour;
  const timeSlots = Array.from({ length: slotsInWindow }, (_, i) => i);

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

  const getSlotIndex = (dayIndex: number, slotIdx: number) =>
    dayIndex * slotsPerDay + slotIdx;

  // Click a day column header to toggle all slots in that day
  const handleDayHeaderClick = useCallback((dayIndex: number) => {
    if (!isEditMode) return;
    const target = dragMode === "available" ? 1 : 2;
    const daySlotIndices = timeSlots.map(slotIdx => getSlotIndex(dayIndex, slotIdx));
    const allSet = daySlotIndices.every(si => selectedSlots[si] === target);
    const newSlots = [...selectedSlots];
    daySlotIndices.forEach(si => { newSlots[si] = allSet ? 0 : target; });
    onSlotsChange(newSlots);
  }, [isEditMode, selectedSlots, onSlotsChange, dragMode, timeSlots, slotsPerDay]);

  const handleMouseDown = useCallback((slotIndex: number) => {
    if (!isEditMode) {
      onSlotClick?.(slotIndex);
      return;
    }
    navigator.vibrate?.(10);
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
      isVertical: false,
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
      pos.isVertical = dy >= dx; // vertical drag = select time slots within a day column
    }
    if (pos && !pos.isVertical) return; // let horizontal (day-scroll) pass through
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
      const avail = room.participants.filter(p => p.availability[slotIndex] === "1");
      const ifNeeded = room.participants.filter(p => p.availability[slotIndex] === "2");
      let tt = `${formatTimeForDisplay(localTime, use12h)} — ${count} available`;
      if (avail.length > 0) tt += `: ${avail.map(p => p.name).join(", ")}`;
      if (softCount > 0) tt += ` · ${softCount} if needed: ${ifNeeded.map(p => p.name).join(", ")}`;
      return tt;
    }

    return formatTimeForDisplay(localTime, use12h);
  };

  const selectedCount = selectedSlots.filter(v => v >= 1).length;

  return (
    <div className="w-full">
      {isEditMode && (
        <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
          <div className="flex items-center gap-1.5 flex-wrap">
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
          {selectedCount > 0 && (
            <span className="text-xs text-muted-foreground tabular-nums ml-auto">
              {t('timeGrid.slotsSelected', { count: selectedCount })}
            </span>
          )}
        </div>
      )}
      {isEditMode && (
        <p className="text-xs text-muted-foreground mb-2">{t('timeGrid.tapDayHint')}</p>
      )}
      <div className="w-full overflow-x-auto">
        <div
          ref={gridRef}
          className="time-grid"
          style={{ gridTemplateColumns: `56px repeat(${actualDays.length}, minmax(38px, 1fr))` }}
          onTouchMove={handleTouchMove}
        >
          {/* Top-left corner */}
          <div className="time-header corner-cell" />

          {/* Day column headers */}
          {actualDays.map((dayInfo, dayIndex) => (
            <div
              key={dayInfo.date.toISOString()}
              className={`day-header${isEditMode ? " day-header-clickable" : ""}`}
              title={isEditMode ? `${dayInfo.tooltip} — click to select all` : dayInfo.tooltip}
              onClick={() => handleDayHeaderClick(dayIndex)}
            >
              <div className="day-name">{dayInfo.label}</div>
              <div className="day-date">{dayInfo.dateLabel}</div>
            </div>
          ))}

          {/* Time rows: each row = one time slot across all days */}
          {timeSlots.map((slotIdx) => (
            <Fragment key={slotIdx}>
              <div className="time-header">
                {slotToTimeStr(slotIdx)}
              </div>
              {actualDays.map((_, dayIndex) => {
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
    </div>
  );
}
