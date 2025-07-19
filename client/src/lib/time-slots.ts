import { format, addDays, startOfWeek, addHours } from "date-fns";
import { getTimezoneOffset } from "./timezone-utils";
import type { Participant } from "@shared/schema";

export function convertSlotToLocalTime(dayIndex: number, hourIndex: number, timezone: string): Date {
  // Start with Monday of current week as reference
  const monday = startOfWeek(new Date(), { weekStartsOn: 1 });
  const targetDay = addDays(monday, dayIndex);
  const utcTime = new Date(targetDay);
  utcTime.setUTCHours(hourIndex, 0, 0, 0);
  
  // Convert to target timezone
  const offset = getTimezoneOffset(timezone);
  return addHours(utcTime, offset);
}

export function formatTimeForDisplay(date: Date): string {
  return format(date, "HH:mm");
}

export function formatDateTimeForDisplay(date: Date): string {
  return format(date, "EEEE, MMM d 'at' HH:mm");
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
      const availableParticipants = participants
        .filter(p => p.availability[i] === "1")
        .map(p => p.name);
      
      slots.push({
        slotIndex: i,
        participantCount: count,
        availableParticipants,
      });
    }
  }
  
  // Sort by participant count (descending) then by slot index (ascending)
  return slots.sort((a, b) => {
    if (a.participantCount !== b.participantCount) {
      return b.participantCount - a.participantCount;
    }
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
