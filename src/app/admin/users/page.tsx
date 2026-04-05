import { auth } from "@/auth";
import { redirect } from "next/navigation";
import UserManagementClient from "./UserManagementClient";

export const metadata = {
  title: "사용자 계정 관리 | 한국학교 관리자",
};

export default async function AdminUsersPage() {
  const session = await auth();

  if (!session || !(session.user as any).roles.includes("ADMIN")) {
    redirect("/dashboard");
  }

  return (
    <main className="p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-gray-50">사용자 계정 및 권한 관리</h1>
          <p className="text-sm font-bold text-gray-400 dark:text-gray-500 mt-1">사용자를 등록하고 역할(권한)을 부여합니다.</p>
        </div>
        <UserManagementClient />
      </div>
    </main>
  );
}
