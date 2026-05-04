import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ message: "인증이 필요합니다." }, { status: 401 });

  const roles: string[] = (session.user as any).roles || [];
  if (!roles.some((r) => ["S_PA", "ADMIN"].includes(r))) {
    return NextResponse.json({ message: "권한이 없습니다." }, { status: 403 });
  }

  try {
    const activeYear = await prisma.academicYear.findFirst({
      where: { isActive: true },
      include: {
        classes: {
          orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
          include: {
            assistants: {
              include: { user: { select: { id: true, name: true, email: true } } },
            },
          },
        },
      },
    });

    return NextResponse.json({ classes: activeYear?.classes ?? [] });
  } catch {
    return NextResponse.json({ message: "조회 중 오류가 발생했습니다." }, { status: 500 });
  }
}
