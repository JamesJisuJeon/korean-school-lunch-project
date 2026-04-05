import { auth, signOut } from "@/auth";
import Link from "next/link";
import { Home, LogOut, User } from "lucide-react";
import AdminToggle from "./AdminToggle";
import ThemeSelector from "./ThemeSelector";

export default async function Navbar() {
  const session = await auth();

  if (!session) return null;

  const user = session.user as any;
  const isAdmin = user.roles?.includes("ADMIN");

  return (
    <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 py-2.5 sticky top-0 z-50">
      <div className="flex flex-wrap justify-between items-center mx-auto max-w-screen-xl">
        <Link href="/dashboard" className="flex items-center gap-2">
          <span className="self-center text-xl font-semibold whitespace-nowrap text-blue-600 dark:text-blue-400">
            한국학교 점심관리
          </span>
        </Link>
        <div className="flex items-center gap-3 lg:order-2">
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 font-bold italic">
            <User className="w-4 h-4" />
            {session.user.name || session.user.email}
          </div>
          {isAdmin && <AdminToggle />}
          <ThemeSelector />
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/login" });
            }}
          >
            <button
              type="submit"
              className="text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 focus:ring-4 focus:ring-gray-200 dark:focus:ring-gray-700 font-medium rounded-lg text-sm px-3 py-2 flex items-center gap-1 transition-colors"
            >
              <LogOut className="w-4 h-4" /> 로그아웃
            </button>
          </form>
        </div>
      </div>
    </nav>
  );
}
