import { auth } from "@/auth";
import Link from "next/link";
import { Home, BookOpen, Utensils, DollarSign, ClipboardList, BarChart2, ShoppingCart } from "lucide-react";
import AdminToggle from "./AdminToggle";
import ThemeSelector from "./ThemeSelector";
import UserMenu from "./UserMenu";

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

  const user = session.user as any;
  const roles: string[] = user.roles || [];
  const isAdmin = roles.includes("ADMIN");
  const isPA = roles.includes("PA");
  const isTeacher = roles.includes("TEACHER");
  const isParent = roles.includes("PARENT");

  return (
    <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-50">
      <div className="flex flex-wrap justify-between items-center mx-auto max-w-screen-xl px-4 py-2.5">
        <Link href="/dashboard" className="flex items-center gap-2">
          <span className="self-center text-xl font-semibold whitespace-nowrap text-blue-600 dark:text-blue-400">
            동남한국학교 스낵관리
          </span>
        </Link>
        <div className="flex items-center gap-3 lg:order-2">
          {isAdmin && <AdminToggle />}
          <ThemeSelector />
          <UserMenu name={session.user.name || session.user.email || ""} />
        </div>
      </div>

      {/* 모바일 바로가기 아이콘 바 */}
      <div className="md:hidden border-t border-gray-100 dark:border-gray-800 overflow-x-auto scrollbar-none">
        <div className="flex items-center gap-1 px-3 py-1 w-max">
          <MobileShortcut href="/dashboard" icon={<Home className="w-5 h-5" />} label="홈" />

{(isPA || isAdmin) && (
            <>
              <MobileShortcut href="/pa/menu" icon={<Utensils className="w-5 h-5" />} label="메뉴관리" />
              <MobileShortcut href="/pa/sales" icon={<DollarSign className="w-5 h-5" />} label="현장수납" />
              <MobileShortcut href="/pa/class-orders" icon={<ClipboardList className="w-5 h-5" />} label="반별신청" />
              <MobileShortcut href="/pa/analytics" icon={<BarChart2 className="w-5 h-5" />} label="집계현황" />
            </>
          )}

          {isParent && (
            <MobileShortcut href="/parent/order" icon={<ShoppingCart className="w-5 h-5" />} label="점심신청" />
          )}

          {isTeacher && (
            <MobileShortcut href="/teacher/class" icon={<BookOpen className="w-5 h-5" />} label="우리반" />
          )}
        </div>
      </div>
    </nav>
  );
}
