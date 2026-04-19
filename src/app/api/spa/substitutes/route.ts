import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session || !["ADMIN", "S_PA", "TA"].some((r) => (session.user as any).roles.includes(r))) {
    return NextResponse.json({ message: "권한이 없습니다." }, { status: 403 });
  }

  try {
    const substitutes = await prisma.substitute.findMany({
      include: {
        class: { include: { academicYear: true } },
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { date: "desc" },
    });
    return NextResponse.json(substitutes);
  } catch (error) {
    return NextResponse.json({ message: "조회 중 오류 발생" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session || !["ADMIN", "S_PA", "TA"].some((r) => (session.user as any).roles.includes(r))) {
    return NextResponse.json({ message: "권한이 없습니다." }, { status: 403 });
  }

  try {
    const { date, classId, userId } = await req.json();
    const substitute = await prisma.substitute.create({
      data: {
        date: new Date(date),
        classId,
        userId,
      },
    });
    return NextResponse.json(substitute);
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ message: "해당 일자 및 학급에 이미 보결 선생님이 등록되어 있습니다." }, { status: 400 });
    }
    return NextResponse.json({ message: "등록 중 오류 발생" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session || !["ADMIN", "S_PA", "TA"].some((r) => (session.user as any).roles.includes(r))) {
    return NextResponse.json({ message: "권한이 없습니다." }, { status: 403 });
  }

  try {
    const { id } = await req.json();
    await prisma.substitute.delete({ where: { id } });
    return NextResponse.json({ message: "삭제 완료" });
  } catch (error) {
    return NextResponse.json({ message: "삭제 중 오류 발생" }, { status: 500 });
  }
}
