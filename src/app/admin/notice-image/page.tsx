import { auth } from "@/auth";
import { redirect } from "next/navigation";
import fs from "fs";
import path from "path";
import NoticeImageClient from "./NoticeImageClient";

function findNoticeBg(): string | null {
  const exts = ["png", "jpg", "jpeg"];
  for (const ext of exts) {
    const filePath = path.join(process.cwd(), "public", "notice-images", `notice-bg.${ext}`);
    if (fs.existsSync(filePath)) {
      const mtime = fs.statSync(filePath).mtimeMs;
      return `/notice-images/notice-bg.${ext}?v=${mtime}`;
    }
  }
  return null;
}

export const dynamic = "force-dynamic";

export default async function NoticeImagePage() {
  const session = await auth();
  const user = session?.user as any;
  if (!session || !user?.roles?.includes("ADMIN")) {
    redirect("/dashboard");
  }

  const currentImage = findNoticeBg();

  return <NoticeImageClient currentImage={currentImage} />;
}
