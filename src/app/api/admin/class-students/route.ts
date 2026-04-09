import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session || !(session.user as any).roles.includes("ADMIN")) {
    return NextResponse.json({ message: "권한이 없습니다." }, { status: 403 });
  }

  try {
    const activeYear = await prisma.academicYear.findFirst({
      where: { isActive: true },
      include: {
        classes: {
          orderBy: [
            { sortOrder: "asc" },
            { name: "asc" },
          ],
          include: {
            students: {
              include: { parents: { select: { id: true, name: true } } }
            }
          }
        }
      }
    });

    if (!activeYear) {
      return NextResponse.json({ message: "활성화된 학년도가 없습니다." }, { status: 412 });
    }

    // 활성 연도의 어떤 학급에도 소속되지 않은 학생들 찾기
    // 1. 활성 연도의 모든 학급 ID 추출
    const activeClassIds = activeYear.classes.map(c => c.id);
    
    // 2. 전체 학생 중 classId가 activeClassIds에 없는 학생들
    const unassignedStudents = await prisma.student.findMany({
      where: {
        OR: [
          { classId: null },
          { classId: { notIn: activeClassIds } }
        ]
      },
      include: { parents: { select: { id: true, name: true } } },
      orderBy: { name: "asc" }
    });

    return NextResponse.json({
      activeYear: activeYear.name,
      classes: activeYear.classes,
      unassignedStudents
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "데이터 조회 중 오류 발생" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session || !(session.user as any).roles.includes("ADMIN")) {
    return NextResponse.json({ message: "권한이 없습니다." }, { status: 403 });
  }

  try {
    const { studentId, classId } = await req.json();

    // 학생을 특정 학급에 배정하거나(classId가 있을 때), 배정 취소(classId가 null일 때)
    await prisma.student.update({
      where: { id: studentId },
      data: { classId: classId || null }
    });

    return NextResponse.json({ message: "성공적으로 업데이트되었습니다." });
  } catch (error) {
    return NextResponse.json({ message: "업데이트 중 오류 발생" }, { status: 500 });
  }
}

// 엑셀 대량 등록을 위한 벌크 처리
export async function PUT(req: Request) {
  const session = await auth();
  if (!session || !(session.user as any).roles.includes("ADMIN")) {
    return NextResponse.json({ message: "권한이 없습니다." }, { status: 403 });
  }

  try {
    const { assignments } = await req.json(); // assignments: { studentName: string, className: string }[]

    const activeYear = await prisma.academicYear.findFirst({
      where: { isActive: true },
      include: { classes: true }
    });

    if (!activeYear) return NextResponse.json({ message: "활성 연도가 없습니다." }, { status: 400 });

    let successCount = 0;
    let failCount = 0;
    const updates = [];

    // 1. 매칭 단계 (찾을 수 없거나 중복인 경우 실패 카운트)
    for (const item of assignments) {
      const targetClass = activeYear.classes.find(c => c.name === item.className);
      if (!targetClass) {
        failCount++;
        continue;
      }

      const student = await prisma.student.findFirst({
        where: { name: item.studentName } // 실제 프로덕션에서는 이메일 등 유니크 식별자 사용 권장
      });

      if (student) {
        updates.push(
          prisma.student.update({
            where: { id: student.id },
            data: { classId: targetClass.id }
          })
        );
        successCount++;
      } else {
        failCount++;
      }
    }

    // 2. 트랜잭션 처리 단계 (동기적이고 안전하게 Bulk 이관)
    await prisma.$transaction(updates);

    return NextResponse.json({ successCount, failCount });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "대량 등록 중 트랜잭션 오류 발생 (전체 롤백됨)" }, { status: 500 });
  }
}
