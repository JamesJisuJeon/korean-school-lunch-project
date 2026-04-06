import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const session = await auth();
  if (!session || !(session.user as any).roles.includes("ADMIN")) {
    return NextResponse.json({ message: "권한이 없습니다." }, { status: 403 });
  }

  try {
    const { students } = await req.json();
    if (!Array.isArray(students) || students.length === 0) {
      return NextResponse.json({ message: "등록할 데이터가 없습니다." }, { status: 400 });
    }

    // 활성 학사연도의 학급 목록 (이름 → id 매핑)
    const activeYear = await prisma.academicYear.findFirst({
      where: { isActive: true },
      include: { classes: { select: { id: true, name: true } } },
    });

    const classMap: Record<string, string> = {};
    if (activeYear) {
      for (const cls of activeYear.classes) {
        classMap[cls.name.trim()] = cls.id;
      }
    }

    const results = {
      successCount: 0,
      skipCount: 0,
      errors: [] as { row: number; name: string; error: string }[],
    };

    for (let i = 0; i < students.length; i++) {
      const { name, className, parentEmails } = students[i];
      const rowNum = i + 2;

      if (!name) {
        results.errors.push({ row: rowNum, name: name || "-", error: "학생 이름 누락" });
        continue;
      }

      // 학급 확인
      const classId = className ? (classMap[className.trim()] ?? null) : null;
      if (className && !classId) {
        results.errors.push({ row: rowNum, name, error: `학급 "${className}"을 찾을 수 없습니다 (활성 학사연도 기준)` });
        continue;
      }

      // 학부모 이메일 → User id 확인
      const emails: string[] = (parentEmails || "")
        .split(",")
        .map((e: string) => e.trim())
        .filter(Boolean);

      if (emails.length === 0) {
        results.errors.push({ row: rowNum, name, error: "학부모 이메일 누락" });
        continue;
      }

      const parentUsers = await prisma.user.findMany({
        where: { email: { in: emails } },
      });

      const foundEmails = parentUsers.map(u => u.email);
      const missingEmails = emails.filter(e => !foundEmails.includes(e));
      if (missingEmails.length > 0) {
        results.errors.push({ row: rowNum, name, error: `등록되지 않은 이메일: ${missingEmails.join(", ")}` });
        continue;
      }

      const isPAChild = parentUsers.some(u => u.roles.includes("PA"));

      try {
        await prisma.student.create({
          data: {
            name,
            classId,
            isPAChild,
            isActive: true,
            parents: { connect: parentUsers.map(u => ({ id: u.id })) },
          } as any,
        });
        results.successCount++;
      } catch (e: any) {
        results.errors.push({ row: rowNum, name, error: e.message });
      }
    }

    return NextResponse.json({
      message: `완료: 등록 ${results.successCount}건, 오류 ${results.errors.length}건`,
      ...results,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
