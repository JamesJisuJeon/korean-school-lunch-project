import { auth } from "@/auth";
import { redirect } from "next/navigation";
import ParentPostDetailClient from "./ParentPostDetailClient";

export default async function ParentPostDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const user = session?.user as any;
  if (!session || !user?.roles?.includes("PARENT")) {
    redirect("/dashboard");
  }

  const { id } = await params;
  return <ParentPostDetailClient id={id} />;
}
