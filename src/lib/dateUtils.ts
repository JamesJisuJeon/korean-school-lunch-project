import { toZonedTime, formatInTimeZone, fromZonedTime } from "date-fns-tz";

const NZ_TZ = "Pacific/Auckland";

/**
 * 특정 로컬 날짜/시간 문자열(예: YYYY-MM-DDTHH:mm)을 뉴질랜드 시간(Pacific/Auckland)으로 취급하여
 * 정확한 UTC Date 객체로 변환합니다.
 */
export function parseNZTimeToUTC(localDateTimeStr: string): Date {
  return fromZonedTime(localDateTimeStr, NZ_TZ);
}

/**
 * UTC Date 객체를 뉴질랜드 로컬 시간 문자열(YYYY-MM-DDTHH:mm) 폼 입력용으로 변환합니다.
 */
export function formatUTCtoNZInput(utcDate: Date | string): string {
  // datetime-local 형식은 'yyyy-MM-ddTHH:mm' 이어야 함
  return formatInTimeZone(new Date(utcDate), NZ_TZ, "yyyy-MM-dd'T'HH:mm");
}

/**
 * 특정 날짜(Date 객체, 로컬 무관)가 주어졌을 때,
 * 뉴질랜드 달력 기준으로 다음 '토요일'의 날짜 문자열(YYYY-MM-DD)과,
 * 해당 토요일에 선행하는 '목요일 오후 2시(14:00)'를 UTC Date로 계산해 반환합니다.
 */
export function getNextSatAndDeadline(baseDate: Date = new Date()) {
  const nzDate = toZonedTime(baseDate, NZ_TZ);
  const dayOfWeek = nzDate.getDay();
  // 토요일(6)이 아니면 다음 토요일로 보정
  const daysToSaturday = dayOfWeek === 6 ? 0 : (6 - dayOfWeek + 7) % 7;

  // 기준 시간에서 daysToSaturday 만큼 더함
  const saturdayNZ = new Date(nzDate);
  saturdayNZ.setDate(saturdayNZ.getDate() + daysToSaturday);
  saturdayNZ.setHours(0, 0, 0, 0); // 자정

  const satYear = saturdayNZ.getFullYear();
  const satMonth = String(saturdayNZ.getMonth() + 1).padStart(2, '0');
  const satDay = String(saturdayNZ.getDate()).padStart(2, '0');
  const saturdayStr = `${satYear}-${satMonth}-${satDay}`;

  // 마감일: 토요일 기준 이틀 전(목요일) 오후 2시
  // Date 객체로 계산해야 월초(1일, 2일)에서도 정상 작동함
  const thursdayNZ = new Date(saturdayNZ);
  thursdayNZ.setDate(thursdayNZ.getDate() - 2);
  const thuYear = thursdayNZ.getFullYear();
  const thuMonth = String(thursdayNZ.getMonth() + 1).padStart(2, '0');
  const thuDay = String(thursdayNZ.getDate()).padStart(2, '0');
  const defaultDeadlineLocalStr = `${thuYear}-${thuMonth}-${thuDay}T14:00`;
  const deadlineUTC = parseNZTimeToUTC(defaultDeadlineLocalStr);

  return {
    saturdayStr,
    deadlineUTC,
    deadlineInputStr: formatUTCtoNZInput(deadlineUTC)
  };
}

/**
 * UTC Date가 들어왔을 때, 현재 시점 뉴질랜드 기준으로 마감되었는지 확인
 */
export function isExpiredDeadline(deadlineUTCStr: string | null | Date): boolean {
  if (!deadlineUTCStr) return false;
  const deadline = new Date(deadlineUTCStr);
  return new Date() > deadline; // Date()의 비교는 내부적으로 Timestamp(UTC 기준)를 쓰므로 안전
}

/**
 * 현재 뉴질랜드 시간 기준으로 "오늘" 하루의 UTC 범위를 반환합니다.
 * 날짜-only 필드(보결선생님 날짜 등)와 비교할 때 사용합니다.
 * - start: NZ 오늘 자정 (UTC)
 * - end:   NZ 내일 자정 (UTC)
 */
export function getNZTodayRange(): { start: Date; end: Date } {
  const now = new Date();
  const nzDateStr = formatInTimeZone(now, NZ_TZ, "yyyy-MM-dd"); // "YYYY-MM-DD" in NZ time
  const start = fromZonedTime(`${nzDateStr}T00:00:00`, NZ_TZ);
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  return { start, end };
}
