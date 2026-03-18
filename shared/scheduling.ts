export type SlotMinutes = 30 | 60;

export function normalizeSlotMinutes(slotMinutes: number | null | undefined): SlotMinutes {
  return slotMinutes === 30 ? 30 : 60;
}

export function getSlotsPerHour(slotMinutes: number | null | undefined): number {
  const normalized = normalizeSlotMinutes(slotMinutes);
  return normalized === 30 ? 2 : 1;
}

export function getSlotsPerDay(slotMinutes: number | null | undefined): number {
  return 24 * getSlotsPerHour(slotMinutes);
}

export function calculateInclusiveDays(startDate: Date | string, endDate: Date | string): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const startTime = start.getTime();
  const endTime = end.getTime();

  if (!Number.isFinite(startTime) || !Number.isFinite(endTime)) {
    throw new Error("Invalid date value");
  }
  if (endTime < startTime) {
    throw new Error("End date cannot be before start date");
  }

  return Math.ceil((endTime - startTime) / (1000 * 60 * 60 * 24)) + 1;
}

export function calculateTotalSlots(
  startDate: Date | string,
  endDate: Date | string,
  slotMinutes: number | null | undefined,
): number {
  const days = calculateInclusiveDays(startDate, endDate);
  return days * getSlotsPerDay(slotMinutes);
}

export function isValidAvailabilityString(availability: string): boolean {
  return /^[012]+$/.test(availability);
}
