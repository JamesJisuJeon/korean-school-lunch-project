import { auth } from "@/auth";
import { redirect } from "next/navigation";
import VolunteerClient from "./VolunteerClient";

export default async function VolunteerPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const user = session.user as any;
  const roles: string[] = user.roles || [];

  if (!roles.some((r: string) => ["PA", "S_PA", "ADMIN"].includes(r))) {
    redirect("/dashboard");
  }

  const isSpa = roles.includes("S_PA") || roles.includes("ADMIN");

  return (
    <div className="p-4 sm:p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8 text-gray-900 dark:text-gray-50">봉사 현황</h1>
      <VolunteerClient userId={user.id} isSpa={isSpa} />
    </div>
  );
}
