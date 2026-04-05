import { auth } from "@/auth";
import { redirect } from "next/navigation";
import TeacherClassClient from "./TeacherClassClient";
import { prisma } from "@/lib/prisma";

export default async function TeacherClassPage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  const user = session.user as any;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // 1. 보결 선생님 여부 확인
  const substitute = await prisma.substitute.findFirst({
    where: { userId: user.id, date: { gte: today, lt: new Date(today.getTime() + 24*60*60*1000) } }
  });

  // 2. 선생님인 경우 담당 학급 여부 확인
  const activeClass = user.roles.includes("TEACHER") 
    ? await prisma.class.findFirst({
        where: { 
          academicYear: { isActive: true },
          OR: [
            { teacherId: user.id },
            ...(user.name ? [{ teacherName: user.name }] : [])
          ]
        }
      })
    : null;

  if (!substitute && !user.roles.includes("TEACHER")) {
    redirect("/dashboard");
  }

  return (
    <div className="p-4 sm:p-8 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold mb-8 text-gray-900 dark:text-gray-50">
        {substitute ? "보결 학급 명단 확인" : "우리 반 점심 신청 명단"}
      </h1>
      {substitute || activeClass ? (
        <TeacherClassClient />
      ) : (
        <div className="bg-orange-50/50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-800 text-orange-600 dark:text-orange-400 p-12 rounded-[2rem] text-center shadow-sm">
          <p className="text-xl font-black mb-2">현재 담당으로 배정된 학급이 없습니다.</p>
          <p className="text-sm font-bold text-gray-500 dark:text-gray-400">학급 운영 관리에서 담임 선생님으로 배정을 받으셔야 전체 명단을 확인할 수 있습니다.</p>
        </div>
      )}
    </div>
  );
}
