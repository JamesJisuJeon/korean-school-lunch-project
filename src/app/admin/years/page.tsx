import { auth } from "@/auth";
import { redirect } from "next/navigation";
import YearsManagementClient from "./YearsManagementClient";

export const metadata = {
  title: "학사연도 관리 | 한국학교 관리자",
};

export default async function YearsManagementPage() {
  const session = await auth();
  if (!session || !(session.user as any).roles.includes("ADMIN")) {
    redirect("/dashboard");
  }

  return (
    <main className="p-8">
      <YearsManagementClient />
    </main>
  );
}
