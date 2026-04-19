import { auth } from "@/auth";
import { redirect } from "next/navigation";
import SpaBoardClient from "./SpaBoardClient";

export const metadata = { title: "학부모회 활동 관리" };

export default async function SpaBoardPage() {
  const session = await auth();
  const user = session?.user as any;
  if (!session || !["ADMIN", "S_PA"].some((r) => user?.roles?.includes(r))) {
    redirect("/dashboard");
  }

  return <SpaBoardClient />;
}
