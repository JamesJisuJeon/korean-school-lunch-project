import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { Role } from "@prisma/client";

export async function POST(req: Request) {
  const session = await auth();

  if (!session || !(session.user as any).roles.includes("ADMIN")) {
    return NextResponse.json({ message: "권한이 없습니다." }, { status: 403 });
  }

  try {
    const { email, name, roles } = await req.json();

    if (!email || !roles || roles.length === 0) {
      return NextResponse.json(
        { message: "필수 정보가 누락되었습니다." },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json(
        { message: "이미 존재하는 이메일입니다." },
        { status: 400 }
      );
    }

    const tempPassword = "password1234";
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    const user = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        roles: roles as Role[],
        mustChangePassword: true,
      },
    });

    console.log(`[신규 사용자] ${email}님 계정 생성 완료 (초기 비밀번호: ${tempPassword})`);

    return NextResponse.json({
      message: "사용자가 생성되었습니다.",
      user: { id: user.id, email: user.email },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  const session = await auth();

  if (!session || !["ADMIN", "TA", "S_PA"].some((r) => (session.user as any).roles.includes(r))) {
    return NextResponse.json({ message: "권한이 없습니다." }, { status: 403 });
  }

  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        roles: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(users);
  } catch (error) {
    return NextResponse.json(
      { message: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  const session = await auth();
  if (!session || !(session.user as any).roles.includes("ADMIN")) {
    return NextResponse.json({ message: "권한이 없습니다." }, { status: 403 });
  }

  try {
    const { id, email, name, roles } = await req.json();
    if (!id || !email || !roles) {
      return NextResponse.json({ message: "필수 정보가 누락되었습니다." }, { status: 400 });
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        email,
        name,
        roles: roles as Role[],
      },
    });

    // 해당 유저와 연결된 모든 학생들의 isPAChild 상태 동기화
    const studentIds = await prisma.student.findMany({
      where: { parents: { some: { id } } } as any,
      select: { id: true }
    });

    for (const sid of studentIds) {
      const studentWithParents = await prisma.student.findUnique({
        where: { id: sid.id },
        include: { parents: { select: { roles: true } } } as any
      }) as any;

      if (studentWithParents) {
        const anyParentIsPA = studentWithParents.parents.some((p: any) => p.roles.includes("PA"));
        await prisma.student.update({
          where: { id: sid.id },
          data: { isPAChild: anyParentIsPA }
        });
      }
    }

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "사용자 정보 수정 중 오류가 발생했습니다." }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session || !(session.user as any).roles.includes("ADMIN")) {
    return NextResponse.json({ message: "권한이 없습니다." }, { status: 403 });
  }

  try {
    const { id } = await req.json();
    if (!id) return NextResponse.json({ message: "ID가 필요합니다." }, { status: 400 });

    if (id === session.user.id) {
      return NextResponse.json({ message: "본인 계정은 삭제할 수 없습니다." }, { status: 400 });
    }

    await prisma.user.delete({ where: { id } });
    return NextResponse.json({ message: "사용자가 삭제되었습니다." });
  } catch (error) {
    return NextResponse.json({ message: "사용자 삭제 중 오류가 발생했습니다." }, { status: 500 });
  }
}
