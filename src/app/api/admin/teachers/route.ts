import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session || !(session.user as any).roles.some((r: string) => ["ADMIN", "PA"].includes(r))) {
    return NextResponse.json({ message: "권한이 없습니다." }, { status: 403 });
  }

  try {
    const teachers = await prisma.user.findMany({
      where: {
        roles: { has: "TEACHER" }
      },
      select: {
        id: true,
        name: true,
        email: true
      },
      orderBy: { name: "asc" }
    });
    return NextResponse.json(teachers);
  } catch (error) {
    return NextResponse.json({ message: "교사 명단 조회 중 오류가 발생했습니다." }, { status: 500 });
  }
}
