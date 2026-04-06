import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const session = await auth();
  if (!session || !(session.user as any).roles.includes("ADMIN")) {
    return NextResponse.json({ message: "권한이 없습니다." }, { status: 403 });
  }

  try {
    const { name, grade, teacherName, teacherId, academicYearId, sortOrder, assistantIds } = await req.json();

    if (teacherId) {
      const conflict = await prisma.class.findFirst({
        where: { academicYearId, teacherId },
      });
      if (conflict) {
        return NextResponse.json(
          { message: `해당 교사는 이미 같은 학사연도의 "${conflict.name}" 학급에 배정되어 있습니다.` },
          { status: 409 }
        );
      }
    }

    // 보조교사 중복 체크 (학급 생성 전)
    if (Array.isArray(assistantIds) && assistantIds.length > 0) {
      const conflicts = await prisma.classAssistant.findMany({
        where: { userId: { in: assistantIds } },
        include: { user: true, class: true },
      });
      if (conflicts.length > 0) {
        const names = conflicts.map(c => `${c.user.name || c.user.email} (${c.class.name})`).join(", ");
        return NextResponse.json(
          { message: `이미 다른 학급에 보조교사로 등록된 사용자가 있습니다: ${names}` },
          { status: 409 }
        );
      }
    }

    const newClass = await prisma.class.create({
      data: {
        name,
        grade,
        teacherName: teacherId ? teacherName : null,
        teacherId: teacherId || null,
        academicYearId,
        sortOrder: sortOrder !== undefined && sortOrder !== "" ? Number(sortOrder) : null,
      } as any,
    });

    // 보조교사 등록
    if (Array.isArray(assistantIds) && assistantIds.length > 0) {
      for (const userId of assistantIds) {
        await prisma.classAssistant.create({ data: { classId: newClass.id, userId } });
      }
    }

    return NextResponse.json(newClass);
  } catch (error) {
    return NextResponse.json({ message: "학급 생성 중 오류가 발생했습니다." }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const session = await auth();
  if (!session || !(session.user as any).roles.includes("ADMIN")) {
    return NextResponse.json({ message: "권한이 없습니다." }, { status: 403 });
  }

  try {
    const { id, name, grade, teacherName, teacherId, academicYearId, sortOrder } = await req.json();

    if (teacherId) {
      const conflict = await prisma.class.findFirst({
        where: { academicYearId, teacherId, NOT: { id } },
      });
      if (conflict) {
        return NextResponse.json(
          { message: `해당 교사는 이미 같은 학사연도의 "${conflict.name}" 학급에 배정되어 있습니다.` },
          { status: 409 }
        );
      }
    }

    const updatedClass = await prisma.class.update({
      where: { id },
      data: {
        name,
        grade,
        teacherName: teacherId ? teacherName : null,
        teacherId: teacherId || null,
        academicYearId,
        sortOrder: sortOrder !== undefined && sortOrder !== "" ? Number(sortOrder) : null,
      } as any,
    });

    return NextResponse.json(updatedClass);
  } catch (error) {
    return NextResponse.json({ message: "학급 수정 중 오류가 발생했습니다." }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session || !(session.user as any).roles.includes("ADMIN")) {
    return NextResponse.json({ message: "권한이 없습니다." }, { status: 403 });
  }

  try {
    const { id } = await req.json();

    // 보조교사 레코드 먼저 삭제 (FK 제약)
    await prisma.classAssistant.deleteMany({ where: { classId: id } });

    // 학생 연결 해제
    await prisma.student.updateMany({
      where: { classId: id },
      data: { classId: null }
    });

    await prisma.class.delete({
      where: { id },
    });

    return NextResponse.json({ message: "학급이 삭제되었습니다." });
  } catch (error) {
    return NextResponse.json({ message: "학급 삭제 중 오류가 발생했습니다." }, { status: 500 });
  }
}
