import { auth } from "@/auth";
import { redirect } from "next/navigation";
import TeacherAllClassClient from "./TeacherAllClassClient";

export default async function TaAllClassesPage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  const user = session.user as any;

  if (!user.roles.includes("TA")) {
    redirect("/dashboard");
  }

  return (
    <div className="p-4 sm:p-8 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold mb-8 text-gray-900 dark:text-gray-50">
        반별 스낵 신청 명단
      </h1>
      <TeacherAllClassClient />
    </div>
  );
}
