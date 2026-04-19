import { auth } from "@/auth";
import { redirect } from "next/navigation";
import SpaPostFormClient from "../SpaPostFormClient";

export const metadata = { title: "새 활동 기록 작성" };

export default async function SpaNewPostPage() {
  const session = await auth();
  const user = session?.user as any;
  if (!session || !["ADMIN", "S_PA"].some((r) => user?.roles?.includes(r))) {
    redirect("/dashboard");
  }

  return <SpaPostFormClient />;
}
