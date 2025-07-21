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
    
    // 아시아
    { value: "Asia/Seoul", city: "서울", offset: "KST", flag: "🇰🇷", country: "한국" },
    { value: "Asia/Busan", city: "부산", offset: "KST", flag: "🇰🇷", country: "한국" },
    { value: "Asia/Tokyo", city: "도쿄", offset: "JST", flag: "🇯🇵", country: "일본" },
    { value: "Asia/Osaka", city: "오사카", offset: "JST", flag: "🇯🇵", country: "일본" },
    { value: "Asia/Kyoto", city: "교토", offset: "JST", flag: "🇯🇵", country: "일본" },
    { value: "Asia/Sapporo", city: "삿포로", offset: "JST", flag: "🇯🇵", country: "일본" },
    { value: "Asia/Shanghai", city: "상하이", offset: "CST", flag: "🇨🇳", country: "중국" },
    { value: "Asia/Beijing", city: "베이징", offset: "CST", flag: "🇨🇳", country: "중국" },
    { value: "Asia/Guangzhou", city: "광저우", offset: "CST", flag: "🇨🇳", country: "중국" },
    { value: "Asia/Shenzhen", city: "선전", offset: "CST", flag: "🇨🇳", country: "중국" },
    { value: "Asia/Chengdu", city: "청두", offset: "CST", flag: "🇨🇳", country: "중국" },
    { value: "Asia/Hong_Kong", city: "홍콩", offset: "HKT", flag: "🇭🇰", country: "홍콩" },
    { value: "Asia/Taipei", city: "타이베이", offset: "CST", flag: "🇹🇼", country: "대만" },
    { value: "Asia/Kaohsiung", city: "가오슝", offset: "CST", flag: "🇹🇼", country: "대만" },
    { value: "Asia/Singapore", city: "싱가포르", offset: "SGT", flag: "🇸🇬", country: "싱가포르" },
    { value: "Asia/Bangkok", city: "방콕", offset: "ICT", flag: "🇹🇭", country: "태국" },
    { value: "Asia/Phuket", city: "푸켓", offset: "ICT", flag: "🇹🇭", country: "태국" },
    { value: "Asia/Jakarta", city: "자카르타", offset: "WIB", flag: "🇮🇩", country: "인도네시아" },
    { value: "Asia/Bali", city: "발리", offset: "WITA", flag: "🇮🇩", country: "인도네시아" },
    { value: "Asia/Kuala_Lumpur", city: "쿠알라룸푸르", offset: "MYT", flag: "🇲🇾", country: "말레이시아" },
    { value: "Asia/Manila", city: "마닐라", offset: "PST", flag: "🇵🇭", country: "필리핀" },
    { value: "Asia/Cebu", city: "세부", offset: "PST", flag: "🇵🇭", country: "필리핀" },
    { value: "Asia/Ho_Chi_Minh", city: "호치민", offset: "ICT", flag: "🇻🇳", country: "베트남" },
    { value: "Asia/Hanoi", city: "하노이", offset: "ICT", flag: "🇻🇳", country: "베트남" },
    { value: "Asia/Kolkata", city: "뭄바이", offset: "IST", flag: "🇮🇳", country: "인도" },
    { value: "Asia/Delhi", city: "델리", offset: "IST", flag: "🇮🇳", country: "인도" },
    { value: "Asia/Bangalore", city: "방갈로르", offset: "IST", flag: "🇮🇳", country: "인도" },
    { value: "Asia/Chennai", city: "첸나이", offset: "IST", flag: "🇮🇳", country: "인도" },
    { value: "Asia/Dubai", city: "두바이", offset: "GST", flag: "🇦🇪", country: "UAE" },
    { value: "Asia/Abu_Dhabi", city: "아부다비", offset: "GST", flag: "🇦🇪", country: "UAE" },
    { value: "Asia/Riyadh", city: "리야드", offset: "AST", flag: "🇸🇦", country: "사우디아라비아" },
    { value: "Asia/Jerusalem", city: "예루살렘", offset: "IST", flag: "🇮🇱", country: "이스라엘" },
    { value: "Asia/Istanbul", city: "이스탄불", offset: "TRT", flag: "🇹🇷", country: "튀르키예" },
    
    // 유럽
    { value: "Europe/London", city: "런던", offset: "GMT/BST", flag: "🇬🇧", country: "영국" },
    { value: "Europe/Manchester", city: "맨체스터", offset: "GMT/BST", flag: "🇬🇧", country: "영국" },
    { value: "Europe/Edinburgh", city: "에든버러", offset: "GMT/BST", flag: "🇬🇧", country: "영국" },
    { value: "Europe/Paris", city: "파리", offset: "CET/CEST", flag: "🇫🇷", country: "프랑스" },
    { value: "Europe/Lyon", city: "리옹", offset: "CET/CEST", flag: "🇫🇷", country: "프랑스" },
    { value: "Europe/Nice", city: "니스", offset: "CET/CEST", flag: "🇫🇷", country: "프랑스" },
    { value: "Europe/Berlin", city: "베를린", offset: "CET/CEST", flag: "🇩🇪", country: "독일" },
    { value: "Europe/Munich", city: "뮌헨", offset: "CET/CEST", flag: "🇩🇪", country: "독일" },
    { value: "Europe/Hamburg", city: "함부르크", offset: "CET/CEST", flag: "🇩🇪", country: "독일" },
    { value: "Europe/Frankfurt", city: "프랑크푸르트", offset: "CET/CEST", flag: "🇩🇪", country: "독일" },
    { value: "Europe/Rome", city: "로마", offset: "CET/CEST", flag: "🇮🇹", country: "이탈리아" },
    { value: "Europe/Milan", city: "밀라노", offset: "CET/CEST", flag: "🇮🇹", country: "이탈리아" },
    { value: "Europe/Venice", city: "베네치아", offset: "CET/CEST", flag: "🇮🇹", country: "이탈리아" },
    { value: "Europe/Madrid", city: "마드리드", offset: "CET/CEST", flag: "🇪🇸", country: "스페인" },
    { value: "Europe/Barcelona", city: "바르셀로나", offset: "CET/CEST", flag: "🇪🇸", country: "스페인" },
    { value: "Europe/Amsterdam", city: "암스테르담", offset: "CET/CEST", flag: "🇳🇱", country: "네덜란드" },
    { value: "Europe/Stockholm", city: "스톡홀름", offset: "CET/CEST", flag: "🇸🇪", country: "스웨덴" },
    { value: "Europe/Zurich", city: "취리히", offset: "CET/CEST", flag: "🇨🇭", country: "스위스" },
    { value: "Europe/Geneva", city: "제네바", offset: "CET/CEST", flag: "🇨🇭", country: "스위스" },
    { value: "Europe/Moscow", city: "모스크바", offset: "MSK", flag: "🇷🇺", country: "러시아" },
    { value: "Europe/St_Petersburg", city: "상트페테르부르크", offset: "MSK", flag: "🇷🇺", country: "러시아" },
    { value: "Europe/Athens", city: "아테네", offset: "EET/EEST", flag: "🇬🇷", country: "그리스" },
    { value: "Europe/Vienna", city: "비엔나", offset: "CET/CEST", flag: "🇦🇹", country: "오스트리아" },
    { value: "Europe/Brussels", city: "브뤼셀", offset: "CET/CEST", flag: "🇧🇪", country: "벨기에" },
    { value: "Europe/Oslo", city: "오슬로", offset: "CET/CEST", flag: "🇳🇴", country: "노르웨이" },
    { value: "Europe/Copenhagen", city: "코펜하겐", offset: "CET/CEST", flag: "🇩🇰", country: "덴마크" },
    { value: "Europe/Helsinki", city: "헬싱키", offset: "EET/EEST", flag: "🇫🇮", country: "핀란드" },
    { value: "Europe/Dublin", city: "더블린", offset: "IST", flag: "🇮🇪", country: "아일랜드" },
    { value: "Europe/Lisbon", city: "리스본", offset: "WET/WEST", flag: "🇵🇹", country: "포르투갈" },
    { value: "Europe/Warsaw", city: "바르샤바", offset: "CET/CEST", flag: "🇵🇱", country: "폴란드" },
    { value: "Europe/Prague", city: "프라하", offset: "CET/CEST", flag: "🇨🇿", country: "체코" },
    { value: "Europe/Budapest", city: "부다페스트", offset: "CET/CEST", flag: "🇭🇺", country: "헝가리" },
    
    // 북미
    { value: "America/New_York", city: "뉴욕", offset: "EST/EDT", flag: "🇺🇸", country: "미국" },
    { value: "America/Washington", city: "워싱턴 DC", offset: "EST/EDT", flag: "🇺🇸", country: "미국" },
    { value: "America/Boston", city: "보스턴", offset: "EST/EDT", flag: "🇺🇸", country: "미국" },
    { value: "America/Philadelphia", city: "필라델피아", offset: "EST/EDT", flag: "🇺🇸", country: "미국" },
    { value: "America/Miami", city: "마이애미", offset: "EST/EDT", flag: "🇺🇸", country: "미국" },
    { value: "America/Chicago", city: "시카고", offset: "CST/CDT", flag: "🇺🇸", country: "미국" },
    { value: "America/Houston", city: "휴스턴", offset: "CST/CDT", flag: "🇺🇸", country: "미국" },
    { value: "America/Dallas", city: "댈러스", offset: "CST/CDT", flag: "🇺🇸", country: "미국" },
    { value: "America/Denver", city: "덴버", offset: "MST/MDT", flag: "🇺🇸", country: "미국" },
    { value: "America/Phoenix", city: "피닉스", offset: "MST", flag: "🇺🇸", country: "미국" },
    { value: "America/Los_Angeles", city: "로스앤젤레스", offset: "PST/PDT", flag: "🇺🇸", country: "미국" },
    { value: "America/San_Francisco", city: "샌프란시스코", offset: "PST/PDT", flag: "🇺🇸", country: "미국" },
    { value: "America/Seattle", city: "시애틀", offset: "PST/PDT", flag: "🇺🇸", country: "미국" },
    { value: "America/Las_Vegas", city: "라스베이거스", offset: "PST/PDT", flag: "🇺🇸", country: "미국" },
    { value: "America/Honolulu", city: "호놀룰루", offset: "HST", flag: "🇺🇸", country: "미국" },
    { value: "America/Anchorage", city: "앵커리지", offset: "AKST/AKDT", flag: "🇺🇸", country: "미국" },
    { value: "America/Toronto", city: "토론토", offset: "EST/EDT", flag: "🇨🇦", country: "캐나다" },
    { value: "America/Montreal", city: "몬트리올", offset: "EST/EDT", flag: "🇨🇦", country: "캐나다" },
    { value: "America/Vancouver", city: "밴쿠버", offset: "PST/PDT", flag: "🇨🇦", country: "캐나다" },
    { value: "America/Calgary", city: "캘거리", offset: "MST/MDT", flag: "🇨🇦", country: "캐나다" },
    { value: "America/Mexico_City", city: "멕시코시티", offset: "CST/CDT", flag: "🇲🇽", country: "멕시코" },
    { value: "America/Cancun", city: "칸쿤", offset: "EST", flag: "🇲🇽", country: "멕시코" },
    
    // 남미
    { value: "America/Sao_Paulo", city: "상파울루", offset: "BRT", flag: "🇧🇷", country: "브라질" },
    { value: "America/Rio_de_Janeiro", city: "리우데자네이루", offset: "BRT", flag: "🇧🇷", country: "브라질" },
    { value: "America/Buenos_Aires", city: "부에노스아이레스", offset: "ART", flag: "🇦🇷", country: "아르헨티나" },
    { value: "America/Lima", city: "리마", offset: "PET", flag: "🇵🇪", country: "페루" },
    { value: "America/Santiago", city: "산티아고", offset: "CLT", flag: "🇨🇱", country: "칠레" },
    { value: "America/Bogota", city: "보고타", offset: "COT", flag: "🇨🇴", country: "콜롬비아" },
    { value: "America/Caracas", city: "카라카스", offset: "VET", flag: "🇻🇪", country: "베네수엘라" },
    
    // 오세아니아
    { value: "Australia/Sydney", city: "시드니", offset: "AEST/AEDT", flag: "🇦🇺", country: "호주" },
    { value: "Australia/Melbourne", city: "멜버른", offset: "AEST/AEDT", flag: "🇦🇺", country: "호주" },
    { value: "Australia/Brisbane", city: "브리즈번", offset: "AEST", flag: "🇦🇺", country: "호주" },
    { value: "Australia/Perth", city: "퍼스", offset: "AWST", flag: "🇦🇺", country: "호주" },
    { value: "Australia/Adelaide", city: "애들레이드", offset: "ACST/ACDT", flag: "🇦🇺", country: "호주" },
    { value: "Pacific/Auckland", city: "오클랜드", offset: "NZST/NZDT", flag: "🇳🇿", country: "뉴질랜드" },
    { value: "Pacific/Wellington", city: "웰링턴", offset: "NZST/NZDT", flag: "🇳🇿", country: "뉴질랜드" },
    { value: "Pacific/Fiji", city: "수바", offset: "FJT", flag: "🇫🇯", country: "피지" },
    
    // 아프리카
    { value: "Africa/Cairo", city: "카이로", offset: "EET", flag: "🇪🇬", country: "이집트" },
    { value: "Africa/Johannesburg", city: "요하네스버그", offset: "SAST", flag: "🇿🇦", country: "남아프리카" },
    { value: "Africa/Cape_Town", city: "케이프타운", offset: "SAST", flag: "🇿🇦", country: "남아프리카" },
    { value: "Africa/Lagos", city: "라고스", offset: "WAT", flag: "🇳🇬", country: "나이지리아" },
    { value: "Africa/Nairobi", city: "나이로비", offset: "EAT", flag: "🇰🇪", country: "케냐" },
    { value: "Africa/Casablanca", city: "카사블랑카", offset: "WEST", flag: "🇲🇦", country: "모로코" },
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
