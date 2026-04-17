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
      return NextResponse.json({ message: "처리할 데이터가 없습니다." }, { status: 400 });
    }

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
      totalCount: students.length,
      successCount: 0,
      skipCount: 0,
      skips: [] as { row: number; name: string; message: string }[],
      errors: [] as { row: number; name: string; error: string }[],
    };

    for (let i = 0; i < students.length; i++) {
      const { name, className, parentEmails } = students[i];
      const rowNum = i + 2;

      if (!name) {
        results.errors.push({ row: rowNum, name: name || "-", error: "학생 이름 누락" });
        continue;
      }

      if (!className) {
        results.errors.push({ row: rowNum, name, error: "학급 정보 누락 (정확한 학생 검색을 위해 학급은 필수입니다)" });
        continue;
      }

      const classId = classMap[className.trim()] ?? null;
      if (!classId) {
        results.errors.push({ row: rowNum, name, error: `학급 "${className}"을 찾을 수 없습니다 (활성 학사연도 기준)` });
        continue;
      }

      const matchedStudents = await prisma.student.findMany({
        where: { name: name.trim(), classId },
      });

      if (matchedStudents.length === 0) {
        results.errors.push({ row: rowNum, name, error: `"${className}" 반에서 "${name}" 학생을 찾을 수 없습니다` });
        continue;
      }

      if (matchedStudents.length > 1) {
        results.errors.push({ row: rowNum, name, error: `"${className}" 반에 "${name}" 학생이 ${matchedStudents.length}명입니다. 수기로 수정해 주세요.` });
        continue;
      }

      const student = matchedStudents[0];

      // fetch current parents to compare
      const currentStudent = await prisma.student.findUnique({
        where: { id: student.id },
        include: { parents: { select: { email: true } } },
      });

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

      // skip if parent emails haven't changed
      const currentEmails = (currentStudent?.parents ?? []).map(p => p.email).sort().join(",");
      const newEmails = [...emails].sort().join(",");
      if (currentEmails === newEmails) {
        results.skipCount++;
        results.skips.push({ row: rowNum, name, message: "학부모 정보 변경 없음 (스킵)" });
        continue;
      }

      try {
        const isPAChild = parentUsers.some(u => u.roles.includes("PA"));
        await prisma.student.update({
          where: { id: student.id },
          data: {
            isPAChild,
            parents: { set: parentUsers.map(u => ({ id: u.id })) },
          } as any,
        });
        results.successCount++;
      } catch (e: any) {
        results.errors.push({ row: rowNum, name, error: e.message });
      }
    }

    const errorCount = results.errors.length;
    return NextResponse.json({
      message: `완료: 요청 ${results.totalCount}건, 업데이트 ${results.successCount}건, 스킵 ${results.skipCount}건, 오류 ${errorCount}건`,
      ...results,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
