import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// 보조교사 추가
export async function POST(req: Request) {
  const session = await auth();
  if (!session || !(session.user as any).roles.includes("ADMIN")) {
    return NextResponse.json({ message: "권한이 없습니다." }, { status: 403 });
  }

  try {
    const { classId, userId } = await req.json();
    if (!classId || !userId) {
      return NextResponse.json({ message: "정보가 부족합니다." }, { status: 400 });
    }

    // 이미 다른 반의 보조교사인지 확인
    const existing = await prisma.classAssistant.findUnique({ where: { userId } });
    if (existing) {
      if (existing.classId === classId) {
        return NextResponse.json({ message: "이미 해당 학급의 보조교사입니다." }, { status: 409 });
      }
      const otherClass = await prisma.class.findUnique({ where: { id: existing.classId } });
      return NextResponse.json(
        { message: `이미 "${otherClass?.name ?? "다른 학급"}"의 보조교사로 등록되어 있습니다.` },
        { status: 409 }
      );
    }

    const assistant = await prisma.classAssistant.create({
      data: { classId, userId },
      include: { user: { select: { id: true, name: true, email: true } } },
    });

    return NextResponse.json(assistant);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "보조교사 추가 중 오류가 발생했습니다." }, { status: 500 });
  }
}

// 보조교사 제거
export async function DELETE(req: Request) {
  const session = await auth();
  if (!session || !(session.user as any).roles.includes("ADMIN")) {
    return NextResponse.json({ message: "권한이 없습니다." }, { status: 403 });
  }

  try {
    const { userId } = await req.json();
    if (!userId) return NextResponse.json({ message: "정보가 부족합니다." }, { status: 400 });

    await prisma.classAssistant.delete({ where: { userId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "보조교사 제거 중 오류가 발생했습니다." }, { status: 500 });
  }
}
