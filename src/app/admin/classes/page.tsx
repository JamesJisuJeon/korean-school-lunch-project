import { auth } from "@/auth";
import { redirect } from "next/navigation";
import ClassesManagementClient from "./ClassesManagementClient";

export const metadata = {
  title: "학급 관리 | 한국학교 관리자",
};

export default async function ClassesManagementPage() {
  const session = await auth();
  if (!session || !(session.user as any).roles.includes("ADMIN")) {
    redirect("/dashboard");
  }

  return (
    <main className="p-8">
      <ClassesManagementClient />
    </main>
  );
}
