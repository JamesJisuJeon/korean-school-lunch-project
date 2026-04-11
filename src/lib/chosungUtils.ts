const CHOSUNG_LIST = [
  "ㄱ", "ㄲ", "ㄴ", "ㄷ", "ㄸ", "ㄹ", "ㅁ", "ㅂ", "ㅃ",
  "ㅅ", "ㅆ", "ㅇ", "ㅈ", "ㅉ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ",
];

const CHOSUNG_START = 0xac00;
const JUNGSUNG_COUNT = 21;
const JONGSUNG_COUNT = 28;

/** 한글 음절에서 초성을 추출. 한글 음절이 아니면 원래 문자 반환. */
function getChosungOfChar(char: string): string {
  const code = char.charCodeAt(0);
  if (code < CHOSUNG_START || code > 0xd7a3) return char;
  const index = Math.floor((code - CHOSUNG_START) / (JUNGSUNG_COUNT * JONGSUNG_COUNT));
  return CHOSUNG_LIST[index];
}

/** 문자열 전체의 초성 시퀀스를 반환. 예: "홍길동" → "ㅎㄱㄷ" */
export function extractChosung(str: string): string {
  return str.split("").map(getChosungOfChar).join("");
}

const CHOSUNG_SET = new Set(CHOSUNG_LIST);

/** 문자열이 초성 문자(ㄱ~ㅎ)로만 구성되어 있는지 확인. */
export function isChosungOnly(str: string): boolean {
  return str.length > 0 && str.split("").every((c) => CHOSUNG_SET.has(c));
}

/**
 * 초성 검색을 포함한 한글 이름 검색.
 * - 일반 문자열: 포함 여부(includes)로 매칭
 * - 초성만 입력: 이름의 초성 시퀀스에 포함되는지로 매칭
 */
export function matchesSearch(target: string, query: string): boolean {
  if (!query) return true;
  const q = query.toLowerCase();
  if (isChosungOnly(query)) {
    return extractChosung(target).includes(query);
  }
  return target.toLowerCase().includes(q);
}
