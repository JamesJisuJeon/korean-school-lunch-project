# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

가능한건 동실에 실행해.
한번 읽은 파일은 다시 읽지마.

---

## Commands

```bash
# Development
npm run dev          # Start dev server (Turbopack)

# Database
npx prisma migrate dev --name <name>   # Create and apply a migration (스키마 변경 시 항상 이것만 사용)
npx prisma generate                    # Regenerate Prisma client after schema changes
npx prisma migrate status              # Check migration sync status
npx prisma studio                      # Open Prisma Studio (DB GUI)
npx ts-node --compiler-options '{"module":"CommonJS"}' prisma/seed.ts  # Run seed

# Lint
npm run lint
```

## Schema Change Workflow (필수 준수)

`prisma/schema.prisma` 변경 시 **반드시** 아래 순서를 따른다:

1. `prisma/schema.prisma` 수정
2. `npx prisma migrate dev --name <변경내용_설명>` 실행
   - 마이그레이션 SQL 파일이 `prisma/migrations/` 에 자동 생성되고 DB에 즉시 적용됨
3. 필요 시 `npx prisma generate` 로 클라이언트 재생성

> **절대 금지**: `prisma db push` 는 마이그레이션 파일을 생성하지 않으므로 사용하지 않는다.
> **절대 금지**: `prisma migrate reset` 은 모든 데이터를 삭제하므로 사용하지 않는다.
> **절대 금지**: `prisma migrate dev --create-only` 는 drift 감지 시 DB를 리셋할 수 있으므로 사용하지 않는다.

---

## Architecture Overview

**Stack:** Next.js 16 (App Router) · React 19 · Prisma 6 · PostgreSQL (Supabase) · Auth.js v5 beta · Tailwind CSS v4

### Auth & Session

Auth is configured in `src/auth.ts` using Auth.js (next-auth v5 beta) with a Credentials provider. The session carries `id`, `roles: Role[]`, and `mustChangePassword`. Type augmentations live in `src/types/next-auth.d.ts`.

- `src/middleware.ts` — enforces login, redirects `mustChangePassword` users to `/change-password`, and guards all non-public routes.
- API routes check roles inline: `(session.user as any).roles.some(r => ["PA","ADMIN"].includes(r))`.
- Admin-mode visibility is toggled via a `admin_mode` cookie (30-day, set client-side by `AdminToggle`), read server-side in `dashboard/page.tsx` via `cookies()`.

### Role Model

| Role | Access |
|------|--------|
| `ADMIN` | Full system management (users, classes, years, students, substitutes). Requires `admin_mode` cookie to show admin UI cards. |
| `PA` | Menu creation/publishing, on-site payment collection, coupon sales. |
| `TEACHER` | Read-only view of their assigned class roster + order status. Also granted to substitute teachers for their assigned day. |
| `PARENT` | Submit/cancel lunch orders for their own children only. |

### Page & Component Pattern

All non-trivial pages follow a **Server Component → Client Component** split:

```
src/app/<role>/<page>/
  page.tsx                  ← Server Component: auth check, metadata, layout shell
  <Page>Client.tsx          ← Client Component: all state, fetch, interactivity
```

`page.tsx` handles auth/redirect; the `*Client.tsx` handles all `useState`/`useEffect`/fetch logic.

### Data Model (key relations)

```
AcademicYear → Class[] → Student[]
User (PARENT) ↔ Student[]  (many-to-many via "StudentToParent")
User (TEACHER) → Class[]   (one-to-many "TeacherClasses")
Menu (Saturday date, deadline, isPublished) → Order[]
Order (status: WAITING|PAID|UNPAID|POST_PAID|CANCELLED)
Substitute (date + classId + userId, unique per date+class)
CouponSale (per-student, per-day $5 coupon records)
```

The `Menu` model enforces a single published menu at a time (checked in the POST handler). `deadline` is stored as UTC; the UI input (`datetime-local`) is in the browser's local time — NZ timezone offset must be accounted for when verifying deadlines.

### API Routes

All routes live under `src/app/api/`. Patterns:
- **`/api/admin/*`** — ADMIN only
- **`/api/pa/*`** — PA or ADMIN
- **`/api/teacher/class`** — TEACHER (or substitute for today)
- **`/api/parent/*`** — any authenticated user (ownership verified inside)

`/api/pa/sales` POST handles both on-site orders (when `menuId` present) and coupon sales (when `quantity` present) via the same endpoint.

### Dark Mode

Tailwind v4 class-based dark mode is configured in `src/app/globals.css`:

```css
@custom-variant dark (&:where(.dark, .dark *));
```

`next-themes` (attribute `"class"`) adds the `dark` class to `<html>`. All components use `dark:` utility classes directly — there are no CSS override hacks. `ThemeSelector` component handles light/dark/system switching.

### Known Issues (not yet fixed)

- `ParentOrderClient.tsx` empty-state row uses `colSpan={5}` but the table has 6 columns.
