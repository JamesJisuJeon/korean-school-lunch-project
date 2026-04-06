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
    <main className="p-4 sm:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <AdminStudentsClient />
      </div>
    </main>
  );
}
