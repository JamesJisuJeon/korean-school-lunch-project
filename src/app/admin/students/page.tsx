import { auth } from "@/auth";
import { redirect } from "next/navigation";
import AdminStudentsClient from "./AdminStudentsClient";

export const metadata = {
  title: "학생 관리 | 한국학교 관리자",
};

export default async function AdminStudentsPage() {
  const session = await auth();

  if (!session || !(session.user as any).roles.includes("ADMIN")) {
    redirect("/dashboard");
  }

  return (
    <main className="p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-gray-50">학생 관리</h1>
          <p className="text-sm font-bold text-gray-400 dark:text-gray-500 mt-1">학생 정보를 등록하고 학부모 계정과 연결합니다.</p>
        </div>
        <AdminStudentsClient />
      </div>
    </main>
  );
}
