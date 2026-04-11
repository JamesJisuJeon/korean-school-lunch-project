import { auth } from "@/auth";
import { redirect } from "next/navigation";
import MenuManagementClient from "./MenuManagementClient";

export default async function PAMenuPage() {
  const session = await auth();

  if (!session || !(session.user as any).roles.some((r: string) => ["PA", "ADMIN"].includes(r))) {
    redirect("/dashboard");
  }

  return (
    <div className="p-4 sm:p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8 text-gray-900 dark:text-gray-50">간식 관리 (학부모회)</h1>
      <MenuManagementClient />
    </div>
  );
}
