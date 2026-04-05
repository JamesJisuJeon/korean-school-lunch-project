import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { Role } from "@prisma/client";

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
        const sortOrderVal = item.sortOrder !== undefined && item.sortOrder !== "" ? Number(item.sortOrder) : null;
        
        if (!yearNameStr || !classNameStr) continue;

        // 학사연도 조회 또는 생성
        let year = await prisma.academicYear.findUnique({
          where: { name: yearNameStr }
        });

        if (!year) {
          // 숫자만 추출 (예: 2024-2025 -> 2024)
          const yearDigits = yearNameStr.match(/\d{4}/)?.[0] || new Date().getFullYear().toString();
          
          year = await prisma.academicYear.create({
            data: {
              name: yearNameStr,
              startDate: new Date(`${yearDigits}-01-01T00:00:00Z`),
              endDate: new Date(`${yearDigits}-12-31T23:59:59Z`),
              isActive: yearNameStr === new Date().getFullYear().toString()
            }
          });
        }

        // 교사 조회
        let teacherId = null;
        if (teacherNameStr) {
          const teacher = await prisma.user.findFirst({
            where: { 
              name: teacherNameStr,
              roles: { has: Role.TEACHER }
            }
          });
          if (teacher) teacherId = teacher.id;
        }

        // 중복 체크 (같은 연도에 같은 이름의 반이 있는지)
        const existingClass = await prisma.class.findFirst({
          where: {
            name: classNameStr,
            academicYearId: year.id
          }
        });

        if (existingClass) {
          // 이미 존재하면 업데이트
          // Update class with new data
          const dataToUpdate: any = {
            grade: gradeStr || (existingClass as any).grade,
            sortOrder: sortOrderVal,
          };
          if (teacherNameStr) {
            dataToUpdate.teacherId = teacherId;
            dataToUpdate.teacherName = teacherId ? teacherNameStr : null;
          }

          const updatedClass = await (prisma.class.update as any)({
            where: { id: existingClass.id },
            data: dataToUpdate
          });
          results.push(updatedClass);
        } else {
          // 신규 생성
          const newClass = await (prisma.class.create as any)({
            data: {
              name: classNameStr,
              grade: gradeStr,
              teacherName: teacherId ? teacherNameStr : null,
              teacherId: teacherId,
              academicYearId: year.id,
              sortOrder: sortOrderVal,
            }
          });
          results.push(newClass);
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
