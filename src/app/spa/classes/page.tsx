import { auth } from "@/auth";
import { redirect } from "next/navigation";
import ClassesClient from "./ClassesClient";

export const metadata = { title: "학급정보" };

export default async function SpaClassesPage() {
  const session = await auth();
  const user = session?.user as any;
  if (!session || !["ADMIN", "S_PA"].some((r) => user?.roles?.includes(r))) {
    redirect("/dashboard");
  }

  return (
    <div className="p-4 sm:p-8 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold mb-8 text-gray-900 dark:text-gray-50">학급정보</h1>
      <ClassesClient />
    </div>
  );
}
