import { auth } from "@/auth";
import Link from "next/link";
import { BookOpen, Utensils, DollarSign, ClipboardList, BarChart2, ShoppingCart, Bell, Users, UserCheck, Newspaper } from "lucide-react";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { getNZTodayRange } from "@/lib/dateUtils";
import SpaToggle from "./SpaToggle";
import ThemeSelector from "./ThemeSelector";
import UserMenu from "./UserMenu";

function MobileDivider() {
  return <div className="w-px h-8 bg-gray-200 dark:bg-gray-700 shrink-0 self-center" />;
}

function MobileShortcut({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <Link
      href={href}
      className="flex flex-col items-center gap-1 px-3 py-2 rounded-2xl text-gray-500 dark:text-gray-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400 transition-colors min-w-[56px]"
    >
      <span className="w-5 h-5">{icon}</span>
      <span className="text-[10px] font-black whitespace-nowrap">{label}</span>
    </Link>
  );
}

export default async function Navbar() {
  const session = await auth();

  if (!session) return null;

  const cookieStore = await cookies();
  const isAdminMode = cookieStore.get("admin_mode")?.value === "true";

  const user = session.user as any;
  const roles: string[] = user.roles || [];
  const isAdmin = roles.includes("ADMIN");
  const isSpa = roles.includes("S_PA");
  const isPA = roles.includes("PA");
  const isTA = roles.includes("TA");
  const isTeacher = roles.includes("TEACHER");
  const isParent = roles.includes("PARENT");

  // 우리반 접근 가능 여부 확인 (담임 배정 or 보결 or 보조교사)
  const { start: todayStart, end: todayEnd } = getNZTodayRange();
  const [substitute, activeClass, assistant] = await Promise.all([
    (prisma as any).substitute.findFirst({ where: { userId: user.id, date: { gte: todayStart, lt: todayEnd } } }),
    isTeacher
      ? (prisma as any).class.findFirst({
          where: {
            academicYear: { isActive: true },
            OR: [{ teacherId: user.id }, ...(user.name ? [{ teacherName: user.name }] : [])],
          },
        })
      : null,
    (prisma as any).classAssistant.findUnique({ where: { userId: user.id } }),
  ]);
  const hasTeacherAccess = !!substitute || !!activeClass || !!assistant;
  const postCount = isParent ? await (prisma as any).post.count() : 0;

  return (
    <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-50">
      <div className="flex flex-wrap justify-between items-center mx-auto max-w-screen-xl px-4 py-2.5">
        <Link href="/dashboard" className="flex items-center gap-2">
          <span className="self-center text-xl font-semibold whitespace-nowrap text-blue-600 dark:text-blue-400">
            동남한국학교 간식
          </span>
        </Link>
        <div className="flex items-center gap-3 lg:order-2">
          {isSpa && <SpaToggle />}
          <ThemeSelector />
          <UserMenu name={session.user.name || session.user.email || ""} isAdmin={isAdmin} initialAdminMode={isAdminMode} />
        </div>
      </div>

      {/* 모바일 바로가기 아이콘 바 */}
      <div className="md:hidden border-t border-gray-100 dark:border-gray-800 overflow-x-auto scrollbar-none">
        <div className="flex items-center gap-1 px-3 py-1 w-max">
          {(isPA || isAdmin) && (
            <>
              <MobileShortcut href="/pa/menu" icon={<Utensils className="w-5 h-5" />} label="간식관리" />
              <MobileShortcut href="/pa/sales" icon={<DollarSign className="w-5 h-5" />} label="현장수납" />
              <MobileShortcut href="/pa/class-orders" icon={<ClipboardList className="w-5 h-5" />} label="반별신청" />
              <MobileShortcut href="/pa/analytics" icon={<BarChart2 className="w-5 h-5" />} label="집계현황" />
            </>
          )}

          {isParent && (
            <>
              {(isPA || isAdmin) && <MobileDivider />}
              <MobileShortcut href="/parent/order" icon={<ShoppingCart className="w-5 h-5" />} label="간식신청" />
              <MobileShortcut href="/parent/notice" icon={<Bell className="w-5 h-5" />} label="간식안내" />
              {postCount > 0 && <MobileShortcut href="/parent/board" icon={<Newspaper className="w-5 h-5" />} label="활동이야기" />}
            </>
          )}

          {isTA && (
            <>
              {(isPA || isAdmin || isParent) && <MobileDivider />}
              <MobileShortcut href="/ta/all-classes" icon={<Users className="w-5 h-5" />} label="전체반" />
              <MobileShortcut href="/ta/substitutes" icon={<UserCheck className="w-5 h-5" />} label="보결관리" />
            </>
          )}

          {hasTeacherAccess && (
            <>
              {(isPA || isAdmin || isParent || isTA) && <MobileDivider />}
              <MobileShortcut href="/teacher/class" icon={<BookOpen className="w-5 h-5" />} label="우리반" />
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
