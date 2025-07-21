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
    { value: "UTC", city: "UTC", offset: "UTC+0", flag: "🌍", country: "Global" },
    
    // 아시아
    { value: "Asia/Seoul", city: "서울", offset: "KST", flag: "🇰🇷", country: "한국" },
    { value: "Asia/Tokyo", city: "도쿄", offset: "JST", flag: "🇯🇵", country: "일본" },
    { value: "Asia/Shanghai", city: "상하이", offset: "CST", flag: "🇨🇳", country: "중국" },
    { value: "Asia/Hong_Kong", city: "홍콩", offset: "HKT", flag: "🇭🇰", country: "홍콩" },
    { value: "Asia/Taipei", city: "타이베이", offset: "CST", flag: "🇹🇼", country: "대만" },
    { value: "Asia/Singapore", city: "싱가포르", offset: "SGT", flag: "🇸🇬", country: "싱가포르" },
    { value: "Asia/Bangkok", city: "방콕", offset: "ICT", flag: "🇹🇭", country: "태국" },
    { value: "Asia/Jakarta", city: "자카르타", offset: "WIB", flag: "🇮🇩", country: "인도네시아" },
    { value: "Asia/Kuala_Lumpur", city: "쿠알라룸푸르", offset: "MYT", flag: "🇲🇾", country: "말레이시아" },
    { value: "Asia/Manila", city: "마닐라", offset: "PST", flag: "🇵🇭", country: "필리핀" },
    { value: "Asia/Ho_Chi_Minh", city: "호치민", offset: "ICT", flag: "🇻🇳", country: "베트남" },
    { value: "Asia/Kolkata", city: "뭄바이", offset: "IST", flag: "🇮🇳", country: "인도" },
    { value: "Asia/Dubai", city: "두바이", offset: "GST", flag: "🇦🇪", country: "UAE" },
    
    // 유럽
    { value: "Europe/London", city: "런던", offset: "GMT/BST", flag: "🇬🇧", country: "영국" },
    { value: "Europe/Paris", city: "파리", offset: "CET/CEST", flag: "🇫🇷", country: "프랑스" },
    { value: "Europe/Berlin", city: "베를린", offset: "CET/CEST", flag: "🇩🇪", country: "독일" },
    { value: "Europe/Rome", city: "로마", offset: "CET/CEST", flag: "🇮🇹", country: "이탈리아" },
    { value: "Europe/Madrid", city: "마드리드", offset: "CET/CEST", flag: "🇪🇸", country: "스페인" },
    { value: "Europe/Amsterdam", city: "암스테르담", offset: "CET/CEST", flag: "🇳🇱", country: "네덜란드" },
    { value: "Europe/Stockholm", city: "스톡홀름", offset: "CET/CEST", flag: "🇸🇪", country: "스웨덴" },
    { value: "Europe/Zurich", city: "취리히", offset: "CET/CEST", flag: "🇨🇭", country: "스위스" },
    { value: "Europe/Moscow", city: "모스크바", offset: "MSK", flag: "🇷🇺", country: "러시아" },
    
    // 북미
    { value: "America/New_York", city: "뉴욕", offset: "EST/EDT", flag: "🇺🇸", country: "미국" },
    { value: "America/Chicago", city: "시카고", offset: "CST/CDT", flag: "🇺🇸", country: "미국" },
    { value: "America/Denver", city: "덴버", offset: "MST/MDT", flag: "🇺🇸", country: "미국" },
    { value: "America/Los_Angeles", city: "로스앤젤레스", offset: "PST/PDT", flag: "🇺🇸", country: "미국" },
    { value: "America/Toronto", city: "토론토", offset: "EST/EDT", flag: "🇨🇦", country: "캐나다" },
    { value: "America/Vancouver", city: "밴쿠버", offset: "PST/PDT", flag: "🇨🇦", country: "캐나다" },
    { value: "America/Mexico_City", city: "멕시코시티", offset: "CST/CDT", flag: "🇲🇽", country: "멕시코" },
    
    // 남미
    { value: "America/Sao_Paulo", city: "상파울루", offset: "BRT", flag: "🇧🇷", country: "브라질" },
    { value: "America/Buenos_Aires", city: "부에노스아이레스", offset: "ART", flag: "🇦🇷", country: "아르헨티나" },
    { value: "America/Lima", city: "리마", offset: "PET", flag: "🇵🇪", country: "페루" },
    { value: "America/Santiago", city: "산티아고", offset: "CLT", flag: "🇨🇱", country: "칠레" },
    
    // 오세아니아
    { value: "Australia/Sydney", city: "시드니", offset: "AEST/AEDT", flag: "🇦🇺", country: "호주" },
    { value: "Australia/Melbourne", city: "멜버른", offset: "AEST/AEDT", flag: "🇦🇺", country: "호주" },
    { value: "Pacific/Auckland", city: "오클랜드", offset: "NZST/NZDT", flag: "🇳🇿", country: "뉴질랜드" },
    
    // 아프리카
    { value: "Africa/Cairo", city: "카이로", offset: "EET", flag: "🇪🇬", country: "이집트" },
    { value: "Africa/Johannesburg", city: "요하네스버그", offset: "SAST", flag: "🇿🇦", country: "남아프리카" },
    { value: "Africa/Lagos", city: "라고스", offset: "WAT", flag: "🇳🇬", country: "나이지리아" },
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
