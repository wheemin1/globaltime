import { format, addDays, startOfWeek, addHours, parseISO, eachDayOfInterval } from "date-fns";
import { getTimezoneOffset } from "./timezone-utils";
import type { Participant } from "@shared/schema";

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
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  let targetDay: Date;
  if (startDate) {
    const baseDate = parseISO(startDate);
    targetDay = addDays(baseDate, dayIndex);
  } else {
    const monday = startOfWeek(new Date(), { weekStartsOn: 1 });
    targetDay = addDays(monday, dayIndex);
  }

  const utcTime = new Date(targetDay);
  utcTime.setUTCHours(hours, minutes, 0, 0);

  const offset = getTimezoneOffset(timezone, utcTime);
  return addHours(utcTime, offset);
}

export function formatTimeForDisplay(date: Date, use12h = false): string {
  return format(date, use12h ? "h:mm a" : "HH:mm");
}

export function formatDateTimeForDisplay(date: Date, use12h = false): string {
  return format(date, use12h ? "EEEE, MMM d 'at' h:mm a" : "EEEE, MMM d 'at' HH:mm");
}

export interface BestSlot {
  slotIndex: number;
  participantCount: number;         // count of "1" (definitely available)
  ifNeededCount: number;            // count of "2" (if needed)
  availableParticipants: string[];  // names with "1"
  ifNeededParticipants: string[];   // names with "2"
}

export function generateBestSlots(heatmap: number[], participants: Participant[], softHeatmap?: number[]): BestSlot[] {
  const slots: BestSlot[] = [];
  
  for (let i = 0; i < heatmap.length; i++) {
    const count1 = heatmap[i];
    const count2 = softHeatmap?.[i] ?? 0;
    if (count1 > 0 || count2 > 0) {
      slots.push({
        slotIndex: i,
        participantCount: count1,
        ifNeededCount: count2,
        availableParticipants: participants.filter(p => p.availability[i] === "1").map(p => p.name),
        ifNeededParticipants: participants.filter(p => p.availability[i] === "2").map(p => p.name),
      });
    }
  }
  
  // Sort: weight by count*2 + ifNeeded*1, then chronological
  return slots.sort((a, b) => {
    const scoreA = a.participantCount * 2 + a.ifNeededCount;
    const scoreB = b.participantCount * 2 + b.ifNeededCount;
    if (scoreA !== scoreB) return scoreB - scoreA;
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
