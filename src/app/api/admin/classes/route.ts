import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const session = await auth();
  if (!session || !(session.user as any).roles.includes("ADMIN")) {
    return NextResponse.json({ message: "권한이 없습니다." }, { status: 403 });
  }

  try {
    const { name, grade, teacherName, teacherId, academicYearId, sortOrder } = await req.json();

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

    // 혹시라도 학생이 연결되어 있을 경우 처리 필요 (CASCADE 미지정 시)
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
