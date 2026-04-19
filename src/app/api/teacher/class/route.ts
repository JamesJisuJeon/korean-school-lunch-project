import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getNZTodayRange } from "@/lib/dateUtils";

export async function GET(req: Request) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ message: "인증이 필요합니다." }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const menuId = searchParams.get("menuId");
  const classId = searchParams.get("classId");
  const user = session.user as any;

  // 뉴질랜드 시간 기준으로 오늘 날짜 범위 계산 (date-fns-tz 기반)
  const { start: todayStart, end: todayEnd } = getNZTodayRange();

  try {
    const listClasses = searchParams.get("listClasses") === "true";

    // TA: 모든 반에 접근 가능 (listClasses 요청이거나, classId가 있거나, TEACHER 롤이 없을 때)
    if (user.roles.includes("TA") && (listClasses || classId || !user.roles.includes("TEACHER"))) {
      if (!classId) {
        // 반 목록 반환
        const classes = await prisma.class.findMany({
          where: { academicYear: { isActive: true } },
          orderBy: { sortOrder: "asc" },
          select: { id: true, name: true }
        });
        return NextResponse.json({ classes });
      }

      const targetClass = await prisma.class.findUnique({
        where: { id: classId },
        include: { academicYear: true }
      });

      if (!targetClass) {
        return NextResponse.json({ message: "해당 학급을 찾을 수 없습니다." }, { status: 404 });
      }

      const students = await prisma.student.findMany({
        where: { classId: targetClass.id, isActive: true },
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
        isSubstitute: false,
        students
      });
    }

    // 1. 보결 선생님 여부 확인 (오늘 날짜 기준)
    const substitute = await prisma.substitute.findFirst({
      where: {
        userId: user.id,
        date: { gte: todayStart, lt: todayEnd }
      },
      include: { class: { include: { academicYear: true } } }
    });

    let targetClass;
    if (substitute) {
      // 1순위: 오늘 보결로 배정된 학급
      targetClass = substitute.class;
    } else if (user.roles.includes("TEACHER")) {
      // 2순위: 담임 교사로 배정된 활성 학급
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
      // 3순위: 보조교사로 등록된 학급
      const assistantRecord = await prisma.classAssistant.findUnique({
        where: { userId: user.id },
        include: { class: { include: { academicYear: true } } },
      });
      if (assistantRecord) {
        targetClass = assistantRecord.class;
      }
    }

    if (!targetClass) {
      return NextResponse.json({ message: "담당하거나 배정된 학급이 없습니다." }, { status: 403 });
    }

    // 3. 해당 반의 모든 학생과 선택한 메뉴의 주문 내역 가져오기
    const students = await prisma.student.findMany({
      where: { classId: targetClass.id, isActive: true },
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

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ message: "인증이 필요합니다." }, { status: 401 });
  }

  try {
    const { orderId, isServed } = await req.json();
    if (!orderId || typeof isServed !== "boolean") {
      return NextResponse.json({ message: "잘못된 요청입니다." }, { status: 400 });
    }

    const updated = await prisma.order.update({
      where: { id: orderId },
      data: { isServed },
    });

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ message: "업데이트 중 오류가 발생했습니다." }, { status: 500 });
  }
}
