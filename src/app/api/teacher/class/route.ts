import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ message: "인증이 필요합니다." }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const menuId = searchParams.get("menuId");
  const user = session.user as any;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  try {
    // 1. 보결 선생님 여부 확인 (오늘 날짜 기준)
    const substitute = await prisma.substitute.findFirst({
      where: { 
        userId: user.id, 
        date: { gte: today, lt: new Date(today.getTime() + 24*60*60*1000) } 
      },
      include: { class: { include: { academicYear: true } } }
    });

    let targetClass;
    if (substitute) {
      targetClass = substitute.class;
    } else if (user.roles.includes("TEACHER")) {
      // 2. 선생님의 활성 학년도 담당 학급 확인
      targetClass = await prisma.class.findFirst({
        where: { 
          academicYear: { isActive: true },
          OR: [
            { teacherId: user.id },
            ...(user.name ? [{ teacherName: user.name }] : [])
          ]
        },
        include: { academicYear: true }
      });
    }

    if (!targetClass) {
      return NextResponse.json({ message: "담당하거나 배정된 보결 학급이 없습니다." }, { status: 403 });
    }

    // 3. 해당 반의 모든 학생과 선택한 메뉴의 주문 내역 가져오기
    const students = await prisma.student.findMany({
      where: { classId: targetClass.id },
      include: {
        orders: {
          where: menuId ? { menuId } : undefined,
          include: { menu: true },
          take: 1,
        }
      },
      orderBy: { name: "asc" }
    });

    return NextResponse.json({
      className: targetClass.name,
      academicYear: targetClass.academicYear.name,
      isSubstitute: !!substitute,
      students
    });
  } catch (error) {
    return NextResponse.json({ message: "데이터 조회 중 오류가 발생했습니다." }, { status: 500 });
  }
}
