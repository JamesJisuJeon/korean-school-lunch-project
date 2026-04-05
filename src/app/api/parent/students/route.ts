import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session || !session.user) {
    return NextResponse.json({ message: "인증이 필요합니다." }, { status: 401 });
  }

  try {
    const students = await prisma.student.findMany({
      where: {
        parents: {
          some: { id: session.user.id }
        }
      },
      select: {
        id: true,
        name: true,
        isPAChild: true,
      }
    });

    return NextResponse.json(students);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "자녀 목록을 불러오는 중 오류가 발생했습니다." }, { status: 500 });
  }
}
