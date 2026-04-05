import { auth } from "@/auth";
import { redirect } from "next/navigation";
import AdminSubstitutesClient from "./AdminSubstitutesClient";

export const metadata = {
  title: "보결 선생님 관리 | 한국학교 관리자",
};

export default async function AdminSubstitutesPage() {
  const session = await auth();
  if (!session || !(session.user as any).roles.includes("ADMIN")) {
    redirect("/dashboard");
  }

  return (
    <main className="p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex items-center gap-5">
          <div>
            <h1 className="text-3xl font-black text-gray-900 dark:text-gray-50">보결 선생님 관리</h1>
            <p className="text-sm font-bold text-gray-400 dark:text-gray-500 mt-1">날짜와 학급별로 보결 선생님을 배정하고 관리합니다.</p>
          </div>
        </div>
        <AdminSubstitutesClient />
      </div>
    </main>
  );
}
