import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// 학년도(Academic Year) 생성 및 조회
export async function POST(req: Request) {
  const session = await auth();
  if (!session || !(session.user as any).roles.includes("ADMIN")) {
    return NextResponse.json({ message: "권한이 없습니다." }, { status: 403 });
  }

  try {
    const { name } = await req.json(); // name: e.g., "2026"
    const currentYear = new Date().getFullYear().toString();
    const isActive = name === currentYear;

    // 만약 이번이 활성 학년도라면, 다른 학년도들은 비활성화
    if (isActive) {
      await prisma.academicYear.updateMany({
        where: { isActive: true },
        data: { isActive: false }
      });
    }

    const academicYear = await prisma.academicYear.upsert({
      where: { name },
      update: {
        startDate: new Date(`${name}-01-01`),
        endDate: new Date(`${name}-12-31`),
        isActive,
      },
      create: {
        name,
        startDate: new Date(`${name}-01-01`),
        endDate: new Date(`${name}-12-31`),
        isActive,
      },
    });

    return NextResponse.json(academicYear);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "학년도 생성/수정 중 오류가 발생했습니다." }, { status: 500 });
  }
}

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ message: "인증이 필요합니다." }, { status: 401 });

  try {
    const currentYear = new Date().getFullYear().toString();
    
    // 조회 시점에 현재 연도와 일치하는 학년도만 활성화되어 있는지 다시 한번 정합성 체크 가능 (옵션)
    // 여기서는 단순히 조회만 수행
    const years = await prisma.academicYear.findMany({
      include: {
        classes: {
          orderBy: [
            { sortOrder: "asc" },
            { name: "asc" },
          ],
          include: {
            assistants: {
              include: { user: { select: { id: true, name: true, email: true } } },
            },
          },
        },
      },
      orderBy: { name: "desc" },
    });
    return NextResponse.json(years);
  } catch (error) {
    return NextResponse.json({ message: "데이터 조회 중 오류가 발생했습니다." }, { status: 500 });
  }
}
