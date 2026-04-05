import { auth } from "@/auth";
import { redirect } from "next/navigation";
import AnalyticsClient from "./AnalyticsClient";

export default async function AnalyticsPage() {
  const session = await auth();
  if (!session) redirect("/login");

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-8 text-gray-900 dark:text-gray-50">운영 집계 현황</h1>
      <AnalyticsClient />
    </div>
  );
}
