import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const session = await auth();
  if (!session || !(session.user as any).roles.some((r: string) => ["PA", "ADMIN"].includes(r))) {
    return NextResponse.json({ message: "권한이 없습니다." }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const menuId = searchParams.get("menuId");
  const classId = searchParams.get("classId");

  if (!menuId) return NextResponse.json({ message: "menuId가 필요합니다." }, { status: 400 });

  const activeYear = await prisma.academicYear.findFirst({ where: { isActive: true } });
  if (!activeYear) return NextResponse.json({ message: "활성 학년도가 없습니다." }, { status: 400 });

  const classes = await prisma.class.findMany({
    where: { academicYearId: activeYear.id },
    select: { id: true, name: true, sortOrder: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });

  if (!classId) {
    return NextResponse.json({ classes });
  }

  const targetClass = await prisma.class.findUnique({
    where: { id: classId },
    include: { academicYear: true },
  });

  if (!targetClass) {
    return NextResponse.json({ message: "학급을 찾을 수 없습니다." }, { status: 404 });
  }

  const students = await prisma.student.findMany({
    where: { classId },
    include: {
      orders: {
        where: { menuId },
        include: { menu: true },
        take: 1,
      },
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json({
    classes,
    className: targetClass.name,
    academicYear: targetClass.academicYear.name,
    students,
  });
}
