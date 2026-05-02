import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

function isPaOrSpa(roles: string[]) {
  return roles.some((r) => ["PA", "S_PA", "ADMIN"].includes(r));
}

// PA/S_PA 전체 목록 + 선택 메뉴 봉사 현황 조회
export async function GET(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ message: "인증이 필요합니다." }, { status: 401 });

  const roles: string[] = (session.user as any).roles || [];
  if (!isPaOrSpa(roles)) return NextResponse.json({ message: "권한이 없습니다." }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const menuId = searchParams.get("menuId");

  try {
    const paUsers = await prisma.user.findMany({
      where: { roles: { hasSome: ["PA", "S_PA"] } },
      select: { id: true, name: true, email: true, roles: true },
      orderBy: { name: "asc" },
    });

    if (!menuId) {
      return NextResponse.json(paUsers.map((u) => ({ ...u, available: false, task: null })));
    }

    const records = await prisma.volunteer.findMany({
      where: { menuId },
      select: { userId: true, available: true, task: true },
    });

    const recordMap = new Map(records.map((r) => [r.userId, r]));

    return NextResponse.json(
      paUsers.map((u) => ({
        userId: u.id,
        name: u.name,
        email: u.email,
        roles: u.roles,
        available: recordMap.get(u.id)?.available ?? false,
        task: recordMap.get(u.id)?.task ?? null,
      }))
    );
  } catch {
    return NextResponse.json({ message: "봉사 현황 조회 중 오류가 발생했습니다." }, { status: 500 });
  }
}

// 본인 봉사 가능 여부 토글
export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ message: "인증이 필요합니다." }, { status: 401 });

  const roles: string[] = (session.user as any).roles || [];
  if (!isPaOrSpa(roles)) return NextResponse.json({ message: "권한이 없습니다." }, { status: 403 });

  const userId: string = (session.user as any).id;

  try {
    const { menuId, available } = await req.json();
    if (!menuId || typeof available !== "boolean") {
      return NextResponse.json({ message: "잘못된 요청입니다." }, { status: 400 });
    }

    const record = await prisma.volunteer.upsert({
      where: { menuId_userId: { menuId, userId } },
      update: { available },
      create: { menuId, userId, available },
    });

    return NextResponse.json(record);
  } catch {
    return NextResponse.json({ message: "봉사 가능 여부 저장 중 오류가 발생했습니다." }, { status: 500 });
  }
}

// S_PA: 담당업무 작성
export async function PATCH(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ message: "인증이 필요합니다." }, { status: 401 });

  const roles: string[] = (session.user as any).roles || [];
  if (!roles.includes("S_PA") && !roles.includes("ADMIN")) {
    return NextResponse.json({ message: "권한이 없습니다." }, { status: 403 });
  }

  try {
    const { menuId, userId, task } = await req.json();
    if (!menuId || !userId) {
      return NextResponse.json({ message: "잘못된 요청입니다." }, { status: 400 });
    }

    const record = await prisma.volunteer.upsert({
      where: { menuId_userId: { menuId, userId } },
      update: { task: task ?? null },
      create: { menuId, userId, available: false, task: task ?? null },
    });

    return NextResponse.json(record);
  } catch {
    return NextResponse.json({ message: "담당업무 저장 중 오류가 발생했습니다." }, { status: 500 });
  }
}
