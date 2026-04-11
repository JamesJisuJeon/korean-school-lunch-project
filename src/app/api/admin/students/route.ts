import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session || !(session.user as any).roles.includes("ADMIN")) {
    return NextResponse.json({ message: "권한이 없습니다." }, { status: 403 });
  }

  try {
    const students = await prisma.student.findMany({
      include: { 
        class: { include: { academicYear: true } },
        parents: { select: { id: true, name: true, email: true, roles: true } }
      } as any,
      orderBy: { name: 'asc' }
    });
    return NextResponse.json(students);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "데이터 조회 중 오류가 발생했습니다." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session || !(session.user as any).roles.includes("ADMIN")) {
    return NextResponse.json({ message: "권한이 없습니다." }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { name, classId, parentId, parentIds } = body;
    
    // parentId (단일) 혹은 parentIds (배열) 모두 대응
    const idsToConnect = parentIds || (parentId ? [parentId] : []);

    if (idsToConnect.length === 0) {
      return NextResponse.json({ message: "최소 한 명의 학부모를 선택해주세요." }, { status: 400 });
    }

    const parents = await prisma.user.findMany({
      where: { id: { in: idsToConnect } }
    });
    
    if (parents.length === 0) {
      return NextResponse.json({ message: "유효한 학부모 정보가 없습니다." }, { status: 400 });
    }

    const isPAChild = parents.some(p => p.roles.includes("PA"));

    const student = await prisma.student.create({
      data: {
        name,
        classId: classId || null,
        isPAChild,
        parents: {
          connect: idsToConnect.map((id: string) => ({ id }))
        }
      } as any,
      include: {
        parents: { select: { id: true, name: true, email: true } },
        class: { include: { academicYear: true } }
      } as any
    });

    return NextResponse.json(student);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "학생 등록 중 오류가 발생했습니다." }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const session = await auth();
  if (!session || !(session.user as any).roles.includes("ADMIN")) {
    return NextResponse.json({ message: "권한이 없습니다." }, { status: 403 });
  }

  try {
    const { id, name, classId, parentIds } = await req.json();

    if (!id || !parentIds || parentIds.length === 0) {
      return NextResponse.json({ message: "정보가 부족합니다." }, { status: 400 });
    }

    const parents = await prisma.user.findMany({
      where: { id: { in: parentIds } }
    });

    const isPAChild = parents.some(p => p.roles.includes("PA"));

    const student = await prisma.student.update({
      where: { id },
      data: {
        name,
        classId: classId || null,
        isPAChild,
        parents: {
          set: parentIds.map((pid: string) => ({ id: pid }))
        }
      } as any,
      include: {
        parents: { select: { id: true, name: true, email: true } },
        class: { include: { academicYear: true } }
      } as any
    });

    return NextResponse.json(student);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "학생 수정 중 오류가 발생했습니다." }, { status: 500 });
  }
}

// 활성/비활성 토글
export async function PATCH(req: Request) {
  const session = await auth();
  if (!session || !(session.user as any).roles.includes("ADMIN")) {
    return NextResponse.json({ message: "권한이 없습니다." }, { status: 403 });
  }

  try {
    const { id, isActive } = await req.json();
    if (!id || typeof isActive !== "boolean") {
      return NextResponse.json({ message: "정보가 부족합니다." }, { status: 400 });
    }

    const student = await prisma.student.update({
      where: { id },
      data: { isActive },
    });

    return NextResponse.json(student);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "상태 변경 중 오류가 발생했습니다." }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session || !(session.user as any).roles.includes("ADMIN")) {
    return NextResponse.json({ message: "권한이 없습니다." }, { status: 403 });
  }

  try {
    const { id } = await req.json();
    
    // 외래 키 연결(링크)만 해제하고 레코드는 남겨둠
    await prisma.$transaction([
      prisma.order.updateMany({
        where: { studentId: id },
        data: { studentId: null }
      }),
      prisma.couponSale.updateMany({
        where: { studentId: id },
        data: { studentId: null }
      }),
      prisma.student.delete({ where: { id } })
    ]);

    return NextResponse.json({ message: "학생 정보가 삭제되었습니다. (관련 내역은 유지됨)" });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "학생 삭제 중 오류가 발생했습니다." }, { status: 500 });
  }
}
