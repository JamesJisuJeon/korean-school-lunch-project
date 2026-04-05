import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();

  if (!session || !(session.user as any).roles.includes("ADMIN")) {
    return NextResponse.json({ message: "권한이 없습니다." }, { status: 403 });
  }

  try {
    const userId = params.id;
    const tempPassword = Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
        mustChangePassword: true,
      },
    });

    // TODO: 이메일 발송 로직 추가 (tempPassword 안내)
    console.log(`[Email Mock] ${user.email}님께 새 임시 비밀번호 ${tempPassword}가 발송되었습니다.`);

    return NextResponse.json({
      message: "비밀번호가 초기화되었습니다.",
      tempPassword,
    });
  } catch (error) {
    return NextResponse.json(
      { message: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
