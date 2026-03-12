import { addDays, startOfWeek, parseISO } from "date-fns";
import { getTimezoneOffset } from "./timezone-utils";
import type { Participant } from "@shared/schema";

/**
 * Convert a room slot to a display Date whose UTC fields (getUTCHours/getUTCMinutes)
 * equal the local wall-clock time in `timezone`.
 * Using UTC fields for rendering avoids the browser's own timezone applying
 * a second, unwanted offset when date-fns/format reads the Date.
 */
export function convertSlotToLocalTime(
  dayIndex: number,
  slotWithinDay: number,   // 0-based index within the day's time window
  timezone: string,
  startDate?: string,
  roomTimeStart?: number,  // room.timeStart (hour offset, e.g. 9)
  slotMinutes?: number     // 30 or 60
): Date {
  const sm = slotMinutes ?? 60;
  const ts = roomTimeStart ?? 0;
  const totalMinutes = ts * 60 + slotWithinDay * sm;
  const utcHours = Math.floor(totalMinutes / 60);
  const utcMinutes = totalMinutes % 60;

  let targetDay: Date;
  if (startDate) {
    const baseDate = parseISO(startDate);
    targetDay = addDays(baseDate, dayIndex);
  } else {
    const monday = startOfWeek(new Date(), { weekStartsOn: 1 });
    targetDay = addDays(monday, dayIndex);
  }

  // Build a UTC instant representing the slot start
  const utcTime = new Date(targetDay);
  utcTime.setUTCHours(utcHours, utcMinutes, 0, 0);

  // Offset (hours) from UTC → target timezone at this instant (accounts for DST)
  const offset = getTimezoneOffset(timezone, utcTime);

  // Compute the target-timezone wall-clock minutes, normalised to [0, 1440)
  const localTotalMinutes = ((utcHours * 60 + utcMinutes + Math.round(offset * 60)) % 1440 + 1440) % 1440;
  const localH = Math.floor(localTotalMinutes / 60);
  const localM = localTotalMinutes % 60;

  // Return a Date where UTC fields == local display time so that
  // getUTCHours()/getUTCMinutes() give the correct local time regardless of
  // which timezone the browser is in.
  const display = new Date(0);
  display.setUTCHours(localH, localM, 0, 0);
  return display;
}

/** Format a display Date produced by convertSlotToLocalTime.
 *  Reads UTC fields to stay browser-timezone-independent. */
export function formatTimeForDisplay(date: Date, use12h = false): string {
  const h = date.getUTCHours();
  const m = date.getUTCMinutes();
  if (use12h) {
    const period = h >= 12 ? "PM" : "AM";
    const h12 = h % 12 || 12;
    return m === 0
      ? `${h12} ${period}`
      : `${h12}:${String(m).padStart(2, "0")} ${period}`;
  }
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function formatDateTimeForDisplay(date: Date, use12h = false): string {
  const h = date.getUTCHours();
  const m = date.getUTCMinutes();
  const timeStr = formatTimeForDisplay(date, use12h);
  // date part is not meaningful for display Dates (epoch-based), return time only
  return timeStr;
}

export interface BestSlot {
  slotIndex: number;
  participantCount: number;
  availableParticipants: string[];
}

export function generateBestSlots(heatmap: number[], participants: Participant[]): BestSlot[] {
  const slots: BestSlot[] = [];

  for (let i = 0; i < heatmap.length; i++) {
    const count = heatmap[i];
    if (count > 0) {
      slots.push({
        slotIndex: i,
        participantCount: count,
        availableParticipants: participants
          .filter(p => p.availability[i] === "1" || p.availability[i] === "2")
          .map(p => p.name),
      });
    }
  }

  return slots.sort((a, b) => {
    if (a.participantCount !== b.participantCount) return b.participantCount - a.participantCount;
    return a.slotIndex - b.slotIndex;
  });
}

export function getSlotDay(slotIndex: number): string {
  const dayIndex = Math.floor(slotIndex / 24);
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  return days[dayIndex];
}

export function getSlotHour(slotIndex: number): number {
  return slotIndex % 24;
}

export function createSlotIndex(dayIndex: number, hourIndex: number): number {
  return dayIndex * 24 + hourIndex;
}
