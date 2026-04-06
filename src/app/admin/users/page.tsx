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
    <main className="p-4 sm:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <UserManagementClient />
      </div>
    </main>
  );
}
