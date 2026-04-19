# 🛠️ 동남학교 시스템 성능 및 품질 개선 리팩토링 계획서 (PLAN.md)

본 계획서는 `RESEARCH.md`에 명시된 5장(향후 유지보수 포인트) 및 6장(리팩토링 권고사항)의 항목들을 안전하고 체계적으로 개선하기 위한 상세 실행 방안과 사이드 이펙트 검증 로직을 담고 있습니다. 본 리팩토링은 기존 **데이터베이스 스키마(Prisma Schema)를 일절 변경하지 않거나 완전히 호환되도록 구성**하여 데이터 유실의 위험을 원천 차단합니다.

---

## 🏗 파트 A. 코드 구조 및 중복 리팩토링 (기존 6장)

### 1. 컴포넌트 마크업 중복 제거 (반응형 UI 리팩토링)
* **보완/개선 방안:** 
  - `SalesManagementClient` 등에서 데스크톱(`xl:block`)과 모바일(`xl:hidden`) 뷰 양쪽에 존재하는 로직(예: 쿠폰 증감 버튼, 금액 표시뱃지, 상태 업데이트 드롭다운)을 `src/components/common` 내 자일 컴포넌트(예: `CouponControl.tsx`, `StatusSelect.tsx`)로 추출합니다.
  - 컨테이너 측에서는 props(studentId, currentValue, onUpdate 등)만 내려주는 형태로 변경합니다.
* **DB 스키마 영향도:** 전면 **없음**(순수 React 컴포넌트 분리).
* **사이드 이펙트 검증 계획:** 
  - [ ] 데스크톱 뷰에서 특정 학생의 상태값/쿠폰 수량을 변경한 후, 브라우저 가로폭을 줄여 모바일 뷰로 전환했을 때 변경사항이 즉각 동기화되어 있는지 테스트 (상태 단일화 검증).
  - [ ] iOS 및 Android 디바이스에서 드롭다운 터치 이벤트가 데스크톱의 클릭 이벤트와 동일하게 트리거되는지 확인.

### 2. 하드코딩 상수 중앙집중화 (PAYMENT_STATUSES 등)
* **보완/개선 방안:**
  - `src/lib/constants.ts` 파일을 생성하여 `PAYMENT_STATUSES`, `ORDER_TYPES` 등을 `export const` 객체 배열 또는 Enum 타입으로 정의합니다.
  - 여기에 컬러셋(예: `bg-green-600`, `text-green-600` 등) 맵핑도 공통 함수로 묶어 전역에서 Import 하도록 수정합니다.
* **DB 스키마 영향도:** **없음**. (단순 Typescript 상수화 및 매핑 변경).
* **사이드 이펙트 검증 계획:**
  - [ ] '점심 신청', '현장 수납', '학급 운영', '통계' 페이지 렌더링 시 기존과 100% 동일한 색상 배지와 텍스트 한글화가 나타나는지 대조.
  - [ ] 오타나 대소문자 문제로 빈 화면이나 `undefined` 텍스트 색상이 깨지는 엘리먼트가 없는지 콘솔의 경고(Warning) 확인.

### 3. 필터 및 상태 복구/초기화 로직 공통화
* **보완/개선 방안:**
  - 반 목록, 옵션(전체/신청/미신청) 추출 로직 및 상태 관리(`useState`)를 캡슐화한 커스텀 훅 `useFilterSort.ts` 을 도입합니다.
  - UI 측면에서는 `FilterBar` 컴포넌트를 생성해, props로 현재 사용 중인 화면 종류에 맞는 필터 셀렉트박스들을 통째로 넘기거나 렌더링하도록 합니다.
* **DB 스키마 영향도:** **없음**.
* **사이드 이펙트 검증 계획:**
  - [ ] 기존 화면의 필터와 정렬 로직이 엉키지 않는지 검증: '반 이름 검색' 후 '사전 신청'만 필터링 한 조합 상태가 정확히 리스트에 반영되는지 확인.
  - [ ] [초기화 ✖] 버튼 작동 시, 상단 통계 수치(활성 인원수)와 리스트 뷰가 최초 상태로 버그 없이 회귀하는지 테스트.

### 4. 백엔드 API 비즈니스 로직(Validation) 강화
* **보완/개선 방안:**
  - 프론트엔드에 의존했던 방어 로직(예: 무료 간식 변경 금액 강제 0원 할당 등)을 제거 혹은 유지하되, 백엔드 API (`/api/pa/sales/route.ts` 등) 내부에 확실한 서버사이드 검증 단계를 추가합니다.
  - `Order`, `CouponSale`을 갱신하는 PATCH 요청에 접근 시 해당 `studentId`가 진짜 PA Child인지 DB 모델에서 재조회 후 검증하고, 만약 일치하지 않는 금액(Amount) 조작 시 HTTP 400 (Bad Request) 예외를 리턴하도록 처리합니다.
* **DB 스키마 영향도:** **없음**.
* **사이드 이펙트 검증 계획:**
  - [ ] Postman이나 cURL 등을 이용해 임의로 일반 학생에게 FREE_SNACK의 금액($0)을 전송하거나 반대의 Payload를 보냈을 때 서버에서 요청을 튕겨내는지 API 단위 테스트 진행.
  - [ ] 프론트엔드의 정상적인 조작 시 불필요한 예외 페이지나 토스트 알림이 뜨지 않고 정상 처리(HTTP 200)되는지 End-to-End 확인.

---

## 📋 파트 C. 신기능 — 학부모회 활동 게시판 ✅ **완료 (2026-04-20)**

### C-1. 개요

| 항목 | 내용 |
|------|------|
| 목적 | 학부모회 활동 기록을 게시판 형태로 공유. S_PA가 작성/수정, 학부모는 조회 전용 |
| 에디터 | TinyMCE (GPLv2, self-hosted) — 정렬·밑줄·글자색·배경색·글자크기·표·들여쓰기 지원 |
| 이미지 | 서버 파일시스템 (`public/uploads/board/`) 저장, sharp WebP 변환 + EXIF 자동 회전 |
| 접근 권한 | `PARENT` : 조회 전용 / `S_PA` : 작성·수정·삭제 |

### 완료된 추가 구현 사항

- **EXIF 자동 회전 수정:** `sharp().rotate()` 적용 — 세로 사진 업로드 시 가로로 뒤집히던 버그 수정
- **이미지 폴더 자동 삭제:** 게시글 삭제 시 `public/uploads/board/{number}/` 폴더도 `fs.rmSync`로 일괄 삭제
- **수정 시 이미지 파일 정리:** PUT API에서 기존 콘텐츠와 새 콘텐츠를 비교하여 제거된 이미지 파일 자동 삭제
- **새 temp 이미지 이동:** 수정 시 temp 폴더의 새 이미지를 post 폴더로 이동 후 URL 교체
- **고아 temp 파일 정리:** 업로드 후 에디터에서 삭제된 temp 이미지를 `uploadedImages` ref로 추적, 저장 시 서버에서 삭제
- **라이트박스 기능:** PostViewer에서 이미지 클릭 시 전체화면 확대 모달 (이벤트 위임 방식으로 재클릭 버그 수정)
- **"← 목록으로" 우측 정렬:** spa/board/[id]·parent/board/[id] 상세 화면 모두 적용
- **대시보드 연동:** 게시글 없을 때 학부모 카드 "학부모회 활동 이야기" 링크 숨김 (서버사이드 count 조회)
- **S_PA 카드 설명 문구 변경:** "보결 선생님 배정 및 공지 이미지, 활동 내역을 관리합니다."

---

### C-2. DB 스키마 변경

`prisma/schema.prisma`에 `Post` 모델 추가:

```prisma
model Post {
  id        String   @id @default(cuid())
  title     String
  content   String   @db.Text   // Tiptap JSON 직렬화 문자열
  authorId  String
  author    User     @relation(fields: [authorId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

마이그레이션 명령:
```bash
npx prisma migrate dev --name add_post_model
```

---

### C-3. 파일 구조

```
src/
├── app/
│   ├── parent/
│   │   └── board/
│   │       ├── page.tsx              ← 글 목록 (PARENT 전용)
│   │       └── [id]/
│   │           └── page.tsx          ← 글 상세 조회 (PARENT 전용)
│   ├── spa/
│   │   └── board/
│   │       ├── page.tsx              ← 관리 목록 + 새글 버튼 (S_PA)
│   │       ├── new/
│   │       │   └── page.tsx          ← 새글 작성 (S_PA)
│   │       └── [id]/
│   │           └── page.tsx          ← 글 상세 + 수정하기 버튼 (S_PA)
│   └── api/
│       ├── board/
│       │   ├── route.ts              ← GET(목록) · POST(작성, S_PA)
│       │   └── [id]/
│       │       └── route.ts          ← GET(단건) · PUT(수정, S_PA) · DELETE(삭제, S_PA)
│       └── board/upload/
│           └── route.ts              ← POST: 이미지 → public/uploads/board/ 저장, WebP 변환 (S_PA)
└── components/
    └── board/
        ├── PostList.tsx              ← 목록 공통 컴포넌트
        ├── PostViewer.tsx            ← Tiptap read-only 뷰어
        └── PostEditor.tsx            ← Tiptap 에디터 (S_PA 전용)
```

---

### C-4. 라우팅 및 권한

| 경로 | 접근 가능 역할 | 기능 |
|------|---------------|------|
| `/parent/board` | PARENT | 게시글 목록 조회 |
| `/parent/board/[id]` | PARENT | 게시글 상세 조회 |
| `/spa/board` | S_PA | 관리용 목록 + 새글 쓰기 버튼 |
| `/spa/board/new` | S_PA | 새 게시글 작성 |
| `/spa/board/[id]` | S_PA | 게시글 상세 조회 + 수정하기 버튼 |

---

### C-5. API 설계

| Method | 경로 | 권한 | 설명 |
|--------|------|------|------|
| GET | `/api/board` | PARENT · S_PA | 목록 (최신순, 페이지네이션) |
| POST | `/api/board` | S_PA | 새 글 작성 |
| GET | `/api/board/[id]` | PARENT · S_PA | 단건 조회 |
| PUT | `/api/board/[id]` | S_PA | 글 수정 |
| DELETE | `/api/board/[id]` | S_PA | 글 삭제 |
| POST | `/api/board/upload` | S_PA | 이미지 → `public/uploads/board/` 저장, WebP 변환 후 URL 반환 |

---

### C-6. 대시보드 카드 변경

- **학부모 서비스 카드** (`PARENT`): `이번주 간식 안내` 아래 → `{ label: "학부모회 활동 이야기", href: "/parent/board" }` 추가
- **학부모회 관리자 카드** (`S_PA`, `isSpaMode`): `공지 이미지 변경` 아래 → `{ label: "학부모회 활동 관리", href: "/spa/board" }` 추가

---

### C-7. Tiptap 설치 패키지

```bash
npm install @tiptap/react @tiptap/starter-kit @tiptap/extension-image @tiptap/extension-link @tiptap/extension-placeholder
```

> 이미지 처리는 기존 `sharp` 패키지 재사용 (신규 설치 불필요)

---

### C-8. 구현 순서

1. `prisma/schema.prisma` — `Post` 모델 추가 후 `migrate dev`
2. `src/app/api/board/` — GET/POST 라우트 구현
3. `src/app/api/board/[id]/` — GET/PUT/DELETE 라우트 구현
4. `src/app/api/board/upload/` — 이미지 업로드 라우트 구현 (sharp WebP 변환 → `public/uploads/board/` 저장)
5. `src/components/board/PostList.tsx` — 목록 공통 컴포넌트
6. `src/components/board/PostViewer.tsx` — read-only 뷰어
7. `src/components/board/PostEditor.tsx` — Tiptap 에디터 (이미지 업로드 포함)
8. `src/app/parent/board/` — 조회용 페이지 (목록 + 상세)
9. `src/app/spa/board/` — 관리용 페이지 (목록 + 작성 + 상세/수정)
10. `src/app/dashboard/page.tsx` — 두 카드에 링크 추가
11. 모바일 Navbar — 필요 시 바로가기 추가 검토

---

### C-9. 사이드 이펙트 검증 계획

- [ ] PARENT 계정으로 `/spa/board/new` 직접 접근 시 접근 거부(redirect) 확인
- [ ] S_PA 이외 계정(PA, ADMIN 등)으로 `/parent/board` 직접 접근 시 접근 거부 확인
- [ ] S_PA 계정으로 글 작성 후 `/parent/board`에서 즉시 반영 확인
- [ ] 이미지 인라인 삽입 후 `public/uploads/board/` 저장 및 WebP 렌더링 확인
- [ ] 글 수정 시 기존 content(Tiptap JSON)가 에디터에 정상 로드되는지 확인
- [ ] `spa_mode` 쿠키가 false일 때 대시보드 "학부모회 활동 관리" 버튼 미노출 확인

---

## 🔧 파트 B. 운영 효율 및 유지보수 보완 (기존 5장)

### 9. 공지 이미지 관리 시스템 ✅ **완료 (2026-04-15)**
* **완료 내용:**
  - `public/uploads/notice-bg.webp` 고정 파일명으로 공지 배경 이미지 관리.
  - `/admin/notice-image` 페이지 + `/api/admin/notice-image` API 신규 생성.
  - 업로드 시 `sharp` WebP 변환(quality 85) 적용, 기존 파일은 NZ 타임스탬프 백업.
  - `NoticeImageZoom` 공통 클라이언트 컴포넌트로 `page.tsx` · `parent/notice/page.tsx` 모두에서 클릭-줌 팝업 지원.
  - `findNoticeBg()` 단순화: `notice-bg.webp` 단일 파일 존재 여부만 확인.
  - 대시보드에 "공지 이미지 변경"(ADMIN), "이번주 간식 안내"(PARENT) 링크 추가.
* **DB 스키마 영향도:** **없음** (파일 시스템 기반).
* **사이드 이펙트 검증 계획:**
  - [x] 새 이미지 업로드 후 기본 화면·`/parent/notice`에서 즉시 반영 확인 (캐시 버스팅).
  - [x] 기존 파일 백업명 형식(`notice-bg_YYYYMMDDHHMMSS.webp`) 확인.

### 5. Timezone(뉴질랜드 시간) 로직 무결성 확보 ✅ **완료 (2026-04-12)**
* **완료 내용:**
  - `src/lib/dateUtils.ts`에 `getNZTodayRange()` 함수 추가 — `date-fns-tz` 기반으로 NZ 기준 오늘 하루의 UTC 범위 `{ start, end }` 반환.
  - `api/teacher/class/route.ts`의 보결선생님 날짜 비교 로직을 `getNZTodayRange()` 사용으로 교체 (기존 KST 기반 `setHours` 버그 수정).
  - 마감일 비교(`isExpiredDeadline`), NZ 입력값 변환(`parseNZTimeToUTC`, `formatUTCtoNZInput`) 등 모든 날짜 로직이 `dateUtils.ts`에 집중됨.
* **DB 스키마 영향도:** **없음**.
* **사이드 이펙트 검증 계획:**
  - [x] 보결선생님 NZ 당일 등록 후 당일 조회 — 정상 노출 확인 (한국 서버 환경에서도 동작).

### 6. 다크모드 컴포넌트 일관성 점검 및 보완
* **보완/개선 방안:**
  - `color-scheme` 적용 이후 파편화가 생길 수 있는 Native 피커(`next/navigation` 모달 류나 `input[type="date"]` 등)의 스타일이 특정 페이지에선 겹쳐 보이는지 `grep` 으로 색상 코드 하드코딩 여부를 솎아냅니다.
* **DB 스키마 영향도:** **없음**.
* **사이드 이펙트 검증 계획:**
  - [ ] 모바일 Safari(iOS 15 이상) 및 Chrome Android 환경에서 시스템 다크모드 진입 시 달력형 Date Picker 와 드롭다운 텍스트 폰트가 투명화되지 않는지 실기기 디버깅 수준 점검.

### 7. 오프라인 네트워크 안정성 대책 (PWA)
* **보완/개선 방안:**
  - 오프라인 도중 네트워크 단절 감지 시 액션을 무시하는 대신, 낙관적 UI 업데이트(Optimistic UI Update)를 보류하고 사용자에게 "현장 네트워크가 불안정하여 수납이 확정되지 않았습니다." 라는 인라인 배너 띄워 실현 오류를 모면하게 방어벽(`window.navigator.onLine` 인터셉터)을 구성합니다.
* **DB 스키마 영향도:** **없음**.
* **사이드 이펙트 검증 계획:**
  - [ ] 크롬 DevTools의 Network 탭에서 `Offline` 트리거 상태를 만든 뒤 '현장결제'를 눌렀을 때, DB/UI가 망가지지 않고 경고 안내 후 복구(Retry)되는지 검증.

### 8. 정기 학생 데이터 이관(학기 갱신) 플로우 개발
* **보완/개선 방안:**
  - 다음 해의 새로운 학사 연도('2025-2026') 생성 시 기존 학생들을 반 미배정이나 새로운 학급으로 이동시키는 Bulk 편의성 모델을 `/api/admin/migrations` 단에 배치합니다.
* **DB 스키마 영향도:** **일부 쿼리 복합도 증가**. 하지만 스키마 구조 변경 자체(`migration.sql`)는 **발생하지 않음.** (기존에 존재하는 `AcademicYear`, `Class`, `Student(classId 변경)`를 재조립하는 과정일 뿐).
* **사이드 이펙트 검증 계획:**
  - [ ] 이관 스크립트 도중, "기존 학년도의 영수증/과거 결제 정보(Order 테이블)"가 새로운 학년도 반 배정 이후에도 잘 연결되어 이전 주문 명세로 열람 가능한지 FK 구조 결함 여부 전수 테스트. 
  - [ ] 데이터베이스 트랜잭션(`prisma.$transaction`) 구조를 강제 적용하여 도중 1개 학생의 데이터 오류 시 이전 진행 상태로 전부 롤백되는지 증명.
