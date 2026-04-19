import { auth } from "@/auth";
import { redirect } from "next/navigation";
import fs from "fs";
import path from "path";
import NoticeImageClient from "./NoticeImageClient";

function findNoticeBg(): string | null {
  const filePath = path.join(process.cwd(), "public", "uploads", "notice-bg.webp");
  if (!fs.existsSync(filePath)) return null;
  const mtime = fs.statSync(filePath).mtimeMs;
  return `/uploads/notice-bg.webp?v=${mtime}`;
}

export const dynamic = "force-dynamic";

export default async function SpaNoticeImagePage() {
  const session = await auth();
  const user = session?.user as any;
  if (!session || !["ADMIN", "S_PA"].some((r) => user?.roles?.includes(r))) {
    redirect("/dashboard");
  }

  const currentImage = findNoticeBg();

  return <NoticeImageClient currentImage={currentImage} />;
}
