import { auth } from "@/auth";
import { redirect } from "next/navigation";
import ClassOrdersClient from "./ClassOrdersClient";

export default async function ClassOrdersPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const roles = (session.user as any).roles ?? [];
  if (!roles.some((r: string) => ["PA", "ADMIN"].includes(r))) {
    redirect("/dashboard");
  }

  return (
    <div className="p-4 sm:p-8 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold mb-8 text-gray-900 dark:text-gray-50">반별 스낵 신청 내역</h1>
      <ClassOrdersClient />
    </div>
  );
}
