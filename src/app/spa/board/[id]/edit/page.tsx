import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import SpaPostFormClient from "../../SpaPostFormClient";

export const metadata = { title: "활동 기록 수정" };

export default async function SpaEditPostPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const user = session?.user as any;
  if (!session || !["ADMIN", "S_PA"].some((r) => user?.roles?.includes(r))) {
    redirect("/dashboard");
  }

  const { id } = await params;
  const post = await prisma.post.findUnique({ where: { id } });

  if (!post) redirect("/spa/board");

  return <SpaPostFormClient postId={post.id} initialTitle={post.title} initialContent={post.content} />;
}
