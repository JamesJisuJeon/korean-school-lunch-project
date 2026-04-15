import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Settings, Users, ClipboardList, BookOpen } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { getNZTodayRange } from "@/lib/dateUtils";
import { formatInTimeZone } from "date-fns-tz";

export default async function DashboardPage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  const cookieStore = await cookies();
  const isAdminMode = cookieStore.get("admin_mode")?.value === "true";

  const user = session.user as any;
  const roles = user.roles || [];
  const { start: todayStart, end: todayEnd } = getNZTodayRange();

  // 보결 배정 체크
  let substituteToday = null;
  try {
    substituteToday = await (prisma as any).substitute.findFirst({
      where: { userId: user.id, date: { gte: todayStart, lt: todayEnd } }
    });
  } catch { }

  // 담임 교사로 배정된 학급 여부 확인 (현재 활성 연도)
  let activeClass = null;
  if (roles.includes("TEACHER")) {
    try {
      activeClass = await (prisma as any).class.findFirst({
        where: {
          academicYear: { isActive: true },
          OR: [
            { teacherId: user.id },
            ...(user.name ? [{ teacherName: user.name }] : [])
          ]
        }
      });
    } catch { }
  }

  // 보조교사 여부 확인
  let assistantClass = null;
  try {
    const assistantRecord = await (prisma as any).classAssistant.findUnique({
      where: { userId: user.id },
      include: { class: true },
    });
    if (assistantRecord) assistantClass = assistantRecord.class;
  } catch { }

  const isTeacherAdmin = roles.includes("TEACHER_ADMIN");
  const canAccessTeacherMenu = isTeacherAdmin || !!activeClass || !!substituteToday || !!assistantClass;
  const isAssistantOnly = !activeClass && !substituteToday && !!assistantClass;

  return (
    <div className="p-4 sm:p-8 max-w-6xl mx-auto">
      <div className="mb-8 sm:mb-10 text-center md:text-left">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-50">
          안녕하세요, {session.user.name || session.user.email}님!
        </h1>
        <p className="mt-2 text-gray-500 dark:text-gray-400">
          오늘도 한국학교의 원활한 운영을 위해 함께해주셔서 감사합니다.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-start">
        {/* 관리자 카드 */}
        {roles.includes("ADMIN") && isAdminMode && (
          <DashboardCard
            title="시스템 관리 (Admin)"
            icon={<Settings className="w-6 h-6 text-blue-600 dark:text-blue-400" />}
            iconBg="bg-blue-50 dark:bg-blue-900/30"
            description="사용자 계정, 학생 등록 및 학교의 기본적인 학력/구조를 관리합니다."
            links={[
              { label: "학사연도 관리", href: "/admin/years" },
              { label: "학급 운영 관리", href: "/admin/classes" },
              { label: "학급 학생 관리", href: "/admin/class-students" },
              { label: "학생 관리", href: "/admin/students" },
              { label: "사용자 계정 관리", href: "/admin/users" },
              { label: "보결 선생님 관리", href: "/admin/substitutes" },
              { label: "공지 이미지 변경", href: "/admin/notice-image" },
            ]}
          />
        )}

        {/* 학부모회 카드 (관리자도 접근 가능) */}
        {(roles.includes("PA") || roles.includes("ADMIN")) && (
          <DashboardCard
            title="학부모회 운영 (PA)"
            icon={<ClipboardList className="w-6 h-6 text-green-600 dark:text-green-400" />}
            iconBg="bg-green-50 dark:bg-green-900/30"
            description="간식 메뉴 등록, 신청 내역 수납, 매점 쿠폰 판매를 관리합니다."
            links={[
              { label: "간식 메뉴 및 신청 관리", href: "/pa/menu" },
              { label: "현장 수납/쿠폰 판매", href: "/pa/sales" },
              { label: "반별 간식 신청 내역", href: "/pa/class-orders" },
              { label: "운영 집계 현황", href: "/pa/analytics" },
            ]}
          />
        )}

        {/* 학부모 카드 */}
        {roles.includes("PARENT") && (
          <DashboardCard
            title="학부모 서비스"
            icon={<Users className="w-6 h-6 text-purple-600 dark:text-purple-400" />}
            iconBg="bg-purple-50 dark:bg-purple-900/30"
            description="내 자녀의 간식을 신청하고 신청 현황을 확인합니다."
            links={[
              { label: "간식 신청하기", href: "/parent/order" },
              { label: "이번주 간식 안내", href: "/parent/notice" },
            ]}
          />
        )}

        {/* 선생님 카드 (보결선생님 포함) */}
        {canAccessTeacherMenu && (
          <DashboardCard
            title={substituteToday ? "임시 학급 관리 (배정됨)" : isAssistantOnly ? "학급 관리 (보조교사)" : isTeacherAdmin ? "전체 학급 관리 (Teacher)" : "학급 관리 (Teacher)"}
            icon={<BookOpen className="w-6 h-6 text-orange-600 dark:text-orange-400" />}
            iconBg="bg-orange-50 dark:bg-orange-900/30"
            description={substituteToday ? `${formatInTimeZone(new Date(), "Pacific/Auckland", "yyyy.MM.dd")} 보결 선생님으로 배정되었습니다.` : isAssistantOnly ? `${assistantClass?.name ?? ""} 학급의 보조교사로 등록되어 있습니다.` : isTeacherAdmin ? "모든 학급 학생들의 간식 신청 명단을 확인합니다." : "담당 학급 학생들의 간식 신청 명단을 확인합니다."}
            links={[
              { label: "우리 반 명단 확인", href: "/teacher/class" },
            ]}
          />
        )}
      </div>
    </div>
  );
}


function DashboardCard({
  title,
  icon,
  iconBg,
  description,
  links,
}: {
  title: string;
  icon: React.ReactNode;
  iconBg: string;
  description: string;
  links: { label: string; href: string }[];
}) {
  return (
    <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col hover:shadow-md dark:hover:shadow-gray-900/50 transition-shadow">
      <div className="flex items-center gap-3 mb-4">
        <div className={`p-3 rounded-xl ${iconBg}`}>{icon}</div>
        <h3 className="text-xl font-bold text-gray-900 dark:text-gray-50">{title}</h3>
      </div>
      <p className="text-gray-500 dark:text-gray-400 mb-6">{description}</p>
      <div className="space-y-3">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="block w-full text-center py-2.5 px-4 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-blue-600 dark:hover:bg-blue-600 hover:text-white dark:hover:text-white transition-colors border border-gray-200 dark:border-gray-700"
          >
            {link.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
