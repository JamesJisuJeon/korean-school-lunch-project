import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const session = await auth();
  if (!session || !(session.user as any).roles.includes("ADMIN")) {
    return NextResponse.json({ message: "권한이 없습니다." }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { classes } = body;
    console.log("Importing classes:", classes);

    if (!Array.isArray(classes)) {
      return NextResponse.json({ message: "올바른 데이터 형식이 아닙니다." }, { status: 400 });
    }

    const results = [];
    const errors = [];

    for (const item of classes) {
      try {
        const yearNameStr = item.yearName?.toString().trim();
        const classNameStr = item.name?.toString().trim();
        const gradeStr = item.grade?.toString().trim() || "";
        const teacherNameStr = item.teacherName?.toString().trim() || "";
        const teacherEmailStr = item.teacherEmail?.toString().trim() || "";
        const assistantEmailsStr = item.assistantEmails?.toString().trim() || "";
        const sortOrderVal = item.sortOrder !== undefined && item.sortOrder !== "" ? Number(item.sortOrder) : null;

        if (!yearNameStr || !classNameStr) continue;

        // 학사연도 조회 또는 생성
        let year = await prisma.academicYear.findUnique({ where: { name: yearNameStr } });
        if (!year) {
          const yearDigits = yearNameStr.match(/\d{4}/)?.[0] || new Date().getFullYear().toString();
          year = await prisma.academicYear.create({
            data: {
              name: yearNameStr,
              startDate: new Date(`${yearDigits}-01-01T00:00:00Z`),
              endDate: new Date(`${yearDigits}-12-31T23:59:59Z`),
              isActive: yearNameStr === new Date().getFullYear().toString(),
            },
          });
        }

        // 담임 교사 조회 — 이메일 우선, 없으면 이름으로
        let teacherId: string | null = null;
        let resolvedTeacherName = teacherNameStr;
        if (teacherEmailStr) {
          const teacher = await prisma.user.findUnique({ where: { email: teacherEmailStr } });
          if (teacher) { teacherId = teacher.id; resolvedTeacherName = teacher.name || teacherNameStr; }
        } else if (teacherNameStr) {
          const teacher = await prisma.user.findFirst({ where: { name: teacherNameStr } });
          if (teacher) teacherId = teacher.id;
        }

        // 보조교사 중복 체크 (학급 처리 전)
        if (assistantEmailsStr) {
          const emails = assistantEmailsStr.split(",").map((e: string) => e.trim()).filter(Boolean);
          for (const email of emails) {
            const user = await prisma.user.findUnique({ where: { email } });
            if (user) {
              const existing = await prisma.classAssistant.findUnique({
                where: { userId: user.id },
                include: { class: true },
              });
              if (existing) {
                throw new Error(`보조교사 "${user.name || email}"은(는) 이미 "${existing.class.name}" 학급에 등록되어 있습니다.`);
              }
            }
          }
        }

        // 학급 중복 체크
        const existingClass = await prisma.class.findFirst({
          where: { name: classNameStr, academicYearId: year.id },
        });

        let targetClassId: string;
        if (existingClass) {
          const dataToUpdate: any = { grade: gradeStr || (existingClass as any).grade, sortOrder: sortOrderVal };
          if (teacherEmailStr || teacherNameStr) {
            dataToUpdate.teacherId = teacherId;
            dataToUpdate.teacherName = teacherId ? resolvedTeacherName : null;
          }
          const updated = await (prisma.class.update as any)({ where: { id: existingClass.id }, data: dataToUpdate });
          results.push(updated);
          targetClassId = existingClass.id;
        } else {
          const newClass = await (prisma.class.create as any)({
            data: {
              name: classNameStr,
              grade: gradeStr,
              teacherName: teacherId ? resolvedTeacherName : null,
              teacherId,
              academicYearId: year.id,
              sortOrder: sortOrderVal,
            },
          });
          results.push(newClass);
          targetClassId = newClass.id;
        }

        // 보조교사 등록
        if (assistantEmailsStr) {
          const emails = assistantEmailsStr.split(",").map((e: string) => e.trim()).filter(Boolean);
          for (const email of emails) {
            const user = await prisma.user.findUnique({ where: { email } });
            if (user) {
              await prisma.classAssistant.create({ data: { classId: targetClassId, userId: user.id } });
            }
          }
        }
      } catch (e: any) {
        console.error("Error importing item:", item, e);
        errors.push({ item, error: e.message });
      }
    }

    return NextResponse.json({ 
      message: `${results.length}개의 학급이 처리되었습니다.` + (errors.length > 0 ? ` (${errors.length}건 오류)` : ""), 
      count: results.length,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error: any) {
    console.error("Critical Bulk Import Error:", error);
    return NextResponse.json({ message: "서버 내부 오류가 발생했습니다: " + error.message }, { status: 500 });
  }
}
