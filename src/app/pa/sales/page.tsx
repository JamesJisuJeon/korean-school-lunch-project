import { auth } from "@/auth";
import { redirect } from "next/navigation";
import SalesManagementClient from "./SalesManagementClient";

export default async function PASalesPage() {
  const session = await auth();

  if (!session || !(session.user as any).roles.some((r: string) => ["PA", "ADMIN"].includes(r))) {
    redirect("/dashboard");
  }

  return (
    <div className="p-4 sm:p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-8 text-gray-900 dark:text-gray-50">현장 수납 및 매점 관리</h1>
      <SalesManagementClient />
    </div>
  );
}
