import { auth } from "@/auth";
import { redirect } from "next/navigation";
import SpaPostDetailClient from "./SpaPostDetailClient";

export default async function SpaPostDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const user = session?.user as any;
  if (!session || !["ADMIN", "S_PA"].some((r) => user?.roles?.includes(r))) {
    redirect("/dashboard");
  }

  const { id } = await params;
  return <SpaPostDetailClient id={id} />;
}
