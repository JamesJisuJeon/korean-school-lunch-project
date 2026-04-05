import { auth } from "@/auth";
import { redirect } from "next/navigation";
import ClassStudentManagementClient from "./ClassStudentManagementClient";

export default async function ClassStudentManagementPage() {
  const session = await auth();

  if (!session || !(session.user as any).roles.includes("ADMIN")) {
    redirect("/dashboard");
  }

  return (
    <div className="p-8">
      <ClassStudentManagementClient />
    </div>
  );
}
