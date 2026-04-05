import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { Role } from "@prisma/client";

const VALID_ROLES: Role[] = ["PARENT", "TEACHER", "PA", "ADMIN"];
const DEFAULT_PASSWORD = "password1234";

export async function POST(req: Request) {
  const session = await auth();
  if (!session || !(session.user as any).roles.includes("ADMIN")) {
    return NextResponse.json({ message: "권한이 없습니다." }, { status: 403 });
  }

  try {
    const { users } = await req.json();
    if (!Array.isArray(users) || users.length === 0) {
      return NextResponse.json({ message: "등록할 데이터가 없습니다." }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 10);
    const results = { successCount: 0, skipCount: 0, errors: [] as { row: number; email: string; error: string }[] };

    for (let i = 0; i < users.length; i++) {
      const { name, email, roles } = users[i];

      if (!email) {
        results.errors.push({ row: i + 2, email: email || "-", error: "이메일 누락" });
        continue;
      }

      const parsedRoles: Role[] = (Array.isArray(roles) ? roles : [roles])
        .map((r: string) => r?.toString().trim().toUpperCase())
        .filter((r: string) => VALID_ROLES.includes(r as Role)) as Role[];

      if (parsedRoles.length === 0) parsedRoles.push("PARENT");

      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) {
        results.skipCount++;
        continue;
      }

      try {
        await prisma.user.create({
          data: { email, name: name || null, password: hashedPassword, roles: parsedRoles, mustChangePassword: true },
        });
        results.successCount++;
      } catch (e: any) {
        results.errors.push({ row: i + 2, email, error: e.message });
      }
    }

    return NextResponse.json({
      message: `완료: 등록 ${results.successCount}건, 중복 건너뜀 ${results.skipCount}건`,
      ...results,
    });
  } catch (error) {
    return NextResponse.json({ message: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
