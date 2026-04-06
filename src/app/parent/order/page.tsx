import { auth } from "@/auth";
import { redirect } from "next/navigation";
import ParentOrderClient from "./ParentOrderClient";

export default async function ParentOrderPage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="p-4 sm:p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-8 text-gray-900 dark:text-gray-50">스낵 신청</h1>
      <ParentOrderClient />
    </div>
  );
}
