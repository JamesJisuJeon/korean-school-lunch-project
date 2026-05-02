import { auth } from "@/auth";
import { redirect } from "next/navigation";
import AssistantsClient from "./AssistantsClient";

export default async function TaAssistantsPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const user = session.user as any;
  if (!user.roles.includes("TA")) redirect("/dashboard");

  return (
    <div className="p-4 sm:p-8 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold mb-8 text-gray-900 dark:text-gray-50">보조교사 관리</h1>
      <AssistantsClient />
    </div>
  );
}
