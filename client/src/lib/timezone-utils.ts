import { format, addHours } from "date-fns";

export interface TimezoneOption {
  value: string;
  label: string;
  city: string;
  offset: string;
  flag?: string;
  country?: string;
}

export function getUserTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

export function getTimezoneOffset(timezone: string, referenceDate?: Date): number {
  const now = referenceDate ?? new Date();
  
  // Create a date object in the target timezone
  const targetDate = new Date(now.toLocaleString("en-US", { timeZone: timezone }));
  const utcDate = new Date(now.toLocaleString("en-US", { timeZone: "UTC" }));
  
  // Calculate offset in hours
  return (targetDate.getTime() - utcDate.getTime()) / (1000 * 60 * 60);
}

export function formatTimezoneForDisplay(timezone: TimezoneOption): string {
  return `${timezone.city} (${timezone.offset})`;
}

export function getCommonTimezones(): TimezoneOption[] {
  const timezones = [
    { value: "UTC", city: "UTC", offset: "UTC+0", flag: "🌍", country: "Global" },
    
    // Asia
    { value: "Asia/Seoul", city: "Seoul", offset: "KST", flag: "🇰🇷", country: "South Korea" },
    { value: "Asia/Seoul", city: "Busan", offset: "KST", flag: "🇰🇷", country: "South Korea" },
    { value: "Asia/Tokyo", city: "Tokyo", offset: "JST", flag: "🇯🇵", country: "Japan" },
    { value: "Asia/Tokyo", city: "Osaka", offset: "JST", flag: "🇯🇵", country: "Japan" },
    { value: "Asia/Tokyo", city: "Kyoto", offset: "JST", flag: "🇯🇵", country: "Japan" },
    { value: "Asia/Tokyo", city: "Sapporo", offset: "JST", flag: "🇯🇵", country: "Japan" },
    { value: "Asia/Shanghai", city: "Shanghai", offset: "CST", flag: "🇨🇳", country: "China" },
    { value: "Asia/Shanghai", city: "Beijing", offset: "CST", flag: "🇨🇳", country: "China" },
    { value: "Asia/Shanghai", city: "Guangzhou", offset: "CST", flag: "🇨🇳", country: "China" },
    { value: "Asia/Shanghai", city: "Shenzhen", offset: "CST", flag: "🇨🇳", country: "China" },
    { value: "Asia/Shanghai", city: "Chengdu", offset: "CST", flag: "🇨🇳", country: "China" },
    { value: "Asia/Hong_Kong", city: "Hong Kong", offset: "HKT", flag: "🇭🇰", country: "Hong Kong" },
    { value: "Asia/Taipei", city: "Taipei", offset: "CST", flag: "🇹🇼", country: "Taiwan" },
    { value: "Asia/Taipei", city: "Kaohsiung", offset: "CST", flag: "🇹🇼", country: "Taiwan" },
    { value: "Asia/Singapore", city: "Singapore", offset: "SGT", flag: "🇸🇬", country: "Singapore" },
    { value: "Asia/Bangkok", city: "Bangkok", offset: "ICT", flag: "🇹🇭", country: "Thailand" },
    { value: "Asia/Bangkok", city: "Phuket", offset: "ICT", flag: "🇹🇭", country: "Thailand" },
    { value: "Asia/Jakarta", city: "Jakarta", offset: "WIB", flag: "🇮🇩", country: "Indonesia" },
    { value: "Asia/Makassar", city: "Bali", offset: "WITA", flag: "🇮🇩", country: "Indonesia" },
    { value: "Asia/Kuala_Lumpur", city: "Kuala Lumpur", offset: "MYT", flag: "🇲🇾", country: "Malaysia" },
    { value: "Asia/Manila", city: "Manila", offset: "PST", flag: "🇵🇭", country: "Philippines" },
    { value: "Asia/Manila", city: "Cebu", offset: "PST", flag: "🇵🇭", country: "Philippines" },
    { value: "Asia/Ho_Chi_Minh", city: "Ho Chi Minh", offset: "ICT", flag: "🇻🇳", country: "Vietnam" },
    { value: "Asia/Ho_Chi_Minh", city: "Hanoi", offset: "ICT", flag: "🇻🇳", country: "Vietnam" },
    { value: "Asia/Kolkata", city: "Mumbai", offset: "IST", flag: "🇮🇳", country: "India" },
    { value: "Asia/Kolkata", city: "Delhi", offset: "IST", flag: "🇮🇳", country: "India" },
    { value: "Asia/Kolkata", city: "Bangalore", offset: "IST", flag: "🇮🇳", country: "India" },
    { value: "Asia/Kolkata", city: "Chennai", offset: "IST", flag: "🇮🇳", country: "India" },
    { value: "Asia/Dubai", city: "Dubai", offset: "GST", flag: "🇦🇪", country: "UAE" },
    { value: "Asia/Dubai", city: "Abu Dhabi", offset: "GST", flag: "🇦🇪", country: "UAE" },
    { value: "Asia/Riyadh", city: "Riyadh", offset: "AST", flag: "🇸🇦", country: "Saudi Arabia" },
    { value: "Asia/Jerusalem", city: "Jerusalem", offset: "IST (IL)", flag: "🇮🇱", country: "Israel" },
    { value: "Asia/Istanbul", city: "Istanbul", offset: "TRT", flag: "🇹🇷", country: "Turkey" },
    
    // Europe
    { value: "Europe/London", city: "London", offset: "GMT/BST", flag: "🇬🇧", country: "United Kingdom" },
    { value: "Europe/London", city: "Manchester", offset: "GMT/BST", flag: "🇬🇧", country: "United Kingdom" },
    { value: "Europe/London", city: "Edinburgh", offset: "GMT/BST", flag: "🇬🇧", country: "United Kingdom" },
    { value: "Europe/Paris", city: "Paris", offset: "CET/CEST", flag: "🇫🇷", country: "France" },
    { value: "Europe/Paris", city: "Lyon", offset: "CET/CEST", flag: "🇫🇷", country: "France" },
    { value: "Europe/Paris", city: "Nice", offset: "CET/CEST", flag: "🇫🇷", country: "France" },
    { value: "Europe/Berlin", city: "Berlin", offset: "CET/CEST", flag: "🇩🇪", country: "Germany" },
    { value: "Europe/Berlin", city: "Munich", offset: "CET/CEST", flag: "🇩🇪", country: "Germany" },
    { value: "Europe/Berlin", city: "Hamburg", offset: "CET/CEST", flag: "🇩🇪", country: "Germany" },
    { value: "Europe/Berlin", city: "Frankfurt", offset: "CET/CEST", flag: "🇩🇪", country: "Germany" },
    { value: "Europe/Rome", city: "Rome", offset: "CET/CEST", flag: "🇮🇹", country: "Italy" },
    { value: "Europe/Rome", city: "Milan", offset: "CET/CEST", flag: "🇮🇹", country: "Italy" },
    { value: "Europe/Rome", city: "Venice", offset: "CET/CEST", flag: "🇮🇹", country: "Italy" },
    { value: "Europe/Madrid", city: "Madrid", offset: "CET/CEST", flag: "🇪🇸", country: "Spain" },
    { value: "Europe/Madrid", city: "Barcelona", offset: "CET/CEST", flag: "🇪🇸", country: "Spain" },
    { value: "Europe/Amsterdam", city: "Amsterdam", offset: "CET/CEST", flag: "🇳🇱", country: "Netherlands" },
    { value: "Europe/Stockholm", city: "Stockholm", offset: "CET/CEST", flag: "🇸🇪", country: "Sweden" },
    { value: "Europe/Zurich", city: "Zurich", offset: "CET/CEST", flag: "🇨🇭", country: "Switzerland" },
    { value: "Europe/Zurich", city: "Geneva", offset: "CET/CEST", flag: "🇨🇭", country: "Switzerland" },
    { value: "Europe/Moscow", city: "Moscow", offset: "MSK", flag: "🇷🇺", country: "Russia" },
    { value: "Europe/Moscow", city: "St. Petersburg", offset: "MSK", flag: "🇷🇺", country: "Russia" },
    { value: "Europe/Athens", city: "Athens", offset: "EET/EEST", flag: "🇬🇷", country: "Greece" },
    { value: "Europe/Vienna", city: "Vienna", offset: "CET/CEST", flag: "🇦🇹", country: "Austria" },
    { value: "Europe/Brussels", city: "Brussels", offset: "CET/CEST", flag: "🇧🇪", country: "Belgium" },
    { value: "Europe/Oslo", city: "Oslo", offset: "CET/CEST", flag: "🇳🇴", country: "Norway" },
    { value: "Europe/Copenhagen", city: "Copenhagen", offset: "CET/CEST", flag: "🇩🇰", country: "Denmark" },
    { value: "Europe/Helsinki", city: "Helsinki", offset: "EET/EEST", flag: "🇫🇮", country: "Finland" },
    { value: "Europe/Dublin", city: "Dublin", offset: "GMT/IST", flag: "🇮🇪", country: "Ireland" },
    { value: "Europe/Lisbon", city: "Lisbon", offset: "WET/WEST", flag: "🇵🇹", country: "Portugal" },
    { value: "Europe/Warsaw", city: "Warsaw", offset: "CET/CEST", flag: "🇵🇱", country: "Poland" },
    { value: "Europe/Prague", city: "Prague", offset: "CET/CEST", flag: "🇨🇿", country: "Czech Republic" },
    { value: "Europe/Budapest", city: "Budapest", offset: "CET/CEST", flag: "🇭🇺", country: "Hungary" },
    
    // North America
    { value: "America/New_York", city: "New York", offset: "EST/EDT", flag: "🇺🇸", country: "United States" },
    { value: "America/New_York", city: "Washington DC", offset: "EST/EDT", flag: "🇺🇸", country: "United States" },
    { value: "America/New_York", city: "Boston", offset: "EST/EDT", flag: "🇺🇸", country: "United States" },
    { value: "America/New_York", city: "Philadelphia", offset: "EST/EDT", flag: "🇺🇸", country: "United States" },
    { value: "America/New_York", city: "Miami", offset: "EST/EDT", flag: "🇺🇸", country: "United States" },
    { value: "America/Chicago", city: "Chicago", offset: "CST/CDT", flag: "🇺🇸", country: "United States" },
    { value: "America/Chicago", city: "Houston", offset: "CST/CDT", flag: "🇺🇸", country: "United States" },
    { value: "America/Chicago", city: "Dallas", offset: "CST/CDT", flag: "🇺🇸", country: "United States" },
    { value: "America/Denver", city: "Denver", offset: "MST/MDT", flag: "🇺🇸", country: "United States" },
    { value: "America/Phoenix", city: "Phoenix", offset: "MST", flag: "🇺🇸", country: "United States" },
    { value: "America/Los_Angeles", city: "Los Angeles", offset: "PST/PDT", flag: "🇺🇸", country: "United States" },
    { value: "America/Los_Angeles", city: "San Francisco", offset: "PST/PDT", flag: "🇺🇸", country: "United States" },
    { value: "America/Los_Angeles", city: "Seattle", offset: "PST/PDT", flag: "🇺🇸", country: "United States" },
    { value: "America/Los_Angeles", city: "Las Vegas", offset: "PST/PDT", flag: "🇺🇸", country: "United States" },
    { value: "America/Honolulu", city: "Honolulu", offset: "HST", flag: "🇺🇸", country: "United States" },
    { value: "America/Anchorage", city: "Anchorage", offset: "AKST/AKDT", flag: "🇺🇸", country: "United States" },
    { value: "America/Toronto", city: "Toronto", offset: "EST/EDT", flag: "🇨🇦", country: "Canada" },
    { value: "America/Toronto", city: "Montreal", offset: "EST/EDT", flag: "🇨🇦", country: "Canada" },
    { value: "America/Vancouver", city: "Vancouver", offset: "PST/PDT", flag: "🇨🇦", country: "Canada" },
    { value: "America/Edmonton", city: "Calgary", offset: "MST/MDT", flag: "🇨🇦", country: "Canada" },
    { value: "America/Mexico_City", city: "Mexico City", offset: "CST/CDT", flag: "🇲🇽", country: "Mexico" },
    { value: "America/Cancun", city: "Cancun", offset: "EST", flag: "🇲🇽", country: "Mexico" },
    
    // South America
    { value: "America/Sao_Paulo", city: "São Paulo", offset: "BRT", flag: "🇧🇷", country: "Brazil" },
    { value: "America/Sao_Paulo", city: "Rio de Janeiro", offset: "BRT", flag: "🇧🇷", country: "Brazil" },
    { value: "America/Argentina/Buenos_Aires", city: "Buenos Aires", offset: "ART", flag: "🇦🇷", country: "Argentina" },
    { value: "America/Lima", city: "Lima", offset: "PET", flag: "🇵🇪", country: "Peru" },
    { value: "America/Santiago", city: "Santiago", offset: "CLT", flag: "🇨🇱", country: "Chile" },
    { value: "America/Bogota", city: "Bogotá", offset: "COT", flag: "🇨🇴", country: "Colombia" },
    { value: "America/Caracas", city: "Caracas", offset: "VET", flag: "🇻🇪", country: "Venezuela" },
    
    // Oceania
    { value: "Australia/Sydney", city: "Sydney", offset: "AEST/AEDT", flag: "🇦🇺", country: "Australia" },
    { value: "Australia/Melbourne", city: "Melbourne", offset: "AEST/AEDT", flag: "🇦🇺", country: "Australia" },
    { value: "Australia/Brisbane", city: "Brisbane", offset: "AEST", flag: "🇦🇺", country: "Australia" },
    { value: "Australia/Perth", city: "Perth", offset: "AWST", flag: "🇦🇺", country: "Australia" },
    { value: "Australia/Adelaide", city: "Adelaide", offset: "ACST/ACDT", flag: "🇦🇺", country: "Australia" },
    { value: "Pacific/Auckland", city: "Auckland", offset: "NZST/NZDT", flag: "🇳🇿", country: "New Zealand" },
    { value: "Pacific/Auckland", city: "Wellington", offset: "NZST/NZDT", flag: "🇳🇿", country: "New Zealand" },
    { value: "Pacific/Fiji", city: "Suva", offset: "FJT", flag: "🇫🇯", country: "Fiji" },
    
    // Africa
    { value: "Africa/Cairo", city: "Cairo", offset: "EET", flag: "🇪🇬", country: "Egypt" },
    { value: "Africa/Johannesburg", city: "Johannesburg", offset: "SAST", flag: "🇿🇦", country: "South Africa" },
    { value: "Africa/Johannesburg", city: "Cape Town", offset: "SAST", flag: "🇿🇦", country: "South Africa" },
    { value: "Africa/Lagos", city: "Lagos", offset: "WAT", flag: "🇳🇬", country: "Nigeria" },
    { value: "Africa/Nairobi", city: "Nairobi", offset: "EAT", flag: "🇰🇪", country: "Kenya" },
    { value: "Africa/Casablanca", city: "Casablanca", offset: "WEST", flag: "🇲🇦", country: "Morocco" },
  ];

  return timezones.map(tz => ({
    ...tz,
    label: tz.flag ? `${tz.flag} ${tz.city} (${tz.offset})` : `${tz.city} (${tz.offset})`,
  }));
}

export function convertUtcToTimezone(utcDate: Date, timezone: string): Date {
  return new Date(utcDate.toLocaleString("en-US", { timeZone: timezone }));
}

export function convertTimezoneToUtc(localDate: Date, timezone: string): Date {
  const offset = getTimezoneOffset(timezone);
  return addHours(localDate, -offset);
}
