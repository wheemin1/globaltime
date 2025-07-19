import { format, addHours } from "date-fns";

export interface TimezoneOption {
  value: string;
  label: string;
  city: string;
  offset: string;
}

export function getUserTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

export function getTimezoneOffset(timezone: string): number {
  const now = new Date();
  const utc = new Date(now.getTime() + now.getTimezoneOffset() * 60000);
  const target = new Date(utc.toLocaleString("en-US", { timeZone: timezone }));
  return (target.getTime() - utc.getTime()) / (1000 * 60 * 60);
}

export function formatTimezoneForDisplay(timezone: TimezoneOption): string {
  return `${timezone.city} (${timezone.offset})`;
}

export function getCommonTimezones(): TimezoneOption[] {
  const timezones = [
    { value: "UTC", city: "UTC", offset: "UTC+0" },
    { value: "America/New_York", city: "New York", offset: "EST/EDT" },
    { value: "America/Chicago", city: "Chicago", offset: "CST/CDT" },
    { value: "America/Denver", city: "Denver", offset: "MST/MDT" },
    { value: "America/Los_Angeles", city: "Los Angeles", offset: "PST/PDT" },
    { value: "America/Toronto", city: "Toronto", offset: "EST/EDT" },
    { value: "America/Vancouver", city: "Vancouver", offset: "PST/PDT" },
    { value: "America/Sao_Paulo", city: "São Paulo", offset: "BRT" },
    { value: "Europe/London", city: "London", offset: "GMT/BST" },
    { value: "Europe/Paris", city: "Paris", offset: "CET/CEST" },
    { value: "Europe/Berlin", city: "Berlin", offset: "CET/CEST" },
    { value: "Europe/Rome", city: "Rome", offset: "CET/CEST" },
    { value: "Europe/Madrid", city: "Madrid", offset: "CET/CEST" },
    { value: "Europe/Amsterdam", city: "Amsterdam", offset: "CET/CEST" },
    { value: "Europe/Stockholm", city: "Stockholm", offset: "CET/CEST" },
    { value: "Europe/Zurich", city: "Zurich", offset: "CET/CEST" },
    { value: "Asia/Tokyo", city: "Tokyo", offset: "JST" },
    { value: "Asia/Seoul", city: "Seoul", offset: "KST" },
    { value: "Asia/Shanghai", city: "Shanghai", offset: "CST" },
    { value: "Asia/Hong_Kong", city: "Hong Kong", offset: "HKT" },
    { value: "Asia/Singapore", city: "Singapore", offset: "SGT" },
    { value: "Asia/Kolkata", city: "Mumbai", offset: "IST" },
    { value: "Asia/Dubai", city: "Dubai", offset: "GST" },
    { value: "Australia/Sydney", city: "Sydney", offset: "AEST/AEDT" },
    { value: "Australia/Melbourne", city: "Melbourne", offset: "AEST/AEDT" },
    { value: "Pacific/Auckland", city: "Auckland", offset: "NZST/NZDT" },
  ];

  return timezones.map(tz => ({
    ...tz,
    label: `${tz.city} (${tz.offset})`,
  }));
}

export function convertUtcToTimezone(utcDate: Date, timezone: string): Date {
  return new Date(utcDate.toLocaleString("en-US", { timeZone: timezone }));
}

export function convertTimezoneToUtc(localDate: Date, timezone: string): Date {
  const offset = getTimezoneOffset(timezone);
  return addHours(localDate, -offset);
}
