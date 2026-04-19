import { auth } from "@/auth";
import { redirect } from "next/navigation";
import ParentBoardClient from "./ParentBoardClient";

export const metadata = { title: "학부모회 활동 이야기" };

export default async function ParentBoardPage() {
  const session = await auth();
  const user = session?.user as any;
  if (!session || !user?.roles?.includes("PARENT")) {
    redirect("/dashboard");
  }

  return <ParentBoardClient />;
}
