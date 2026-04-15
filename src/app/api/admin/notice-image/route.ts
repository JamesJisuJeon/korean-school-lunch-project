import { auth } from "@/auth";
import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import sharp from "sharp";
import { formatInTimeZone } from "date-fns-tz";

const UPLOADS_DIR = path.join(process.cwd(), "public", "uploads");
const NOTICE_BG_PATH = path.join(UPLOADS_DIR, "notice-bg.webp");

export async function POST(req: NextRequest) {
  const session = await auth();
  const user = session?.user as any;
  if (!session || !user?.roles?.includes("ADMIN")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("image") as File | null;

  if (!file) {
    return NextResponse.json({ error: "이미지 파일이 없습니다." }, { status: 400 });
  }

  const originalExt = file.name.split(".").pop()?.toLowerCase();
  if (!originalExt || !["png", "jpg", "jpeg", "webp"].includes(originalExt)) {
    return NextResponse.json({ error: "png, jpg, jpeg, webp 파일만 업로드 가능합니다." }, { status: 400 });
  }

  // 기존 notice-bg.webp 타임스탬프 백업
  if (fs.existsSync(NOTICE_BG_PATH)) {
    const timestamp = formatInTimeZone(new Date(), "Pacific/Auckland", "yyyyMMddHHmmss");
    fs.renameSync(NOTICE_BG_PATH, path.join(UPLOADS_DIR, `notice-bg_${timestamp}.webp`));
  }

  // WebP로 변환하여 저장
  const buffer = Buffer.from(await file.arrayBuffer());
  const compressed = await sharp(buffer).webp({ quality: 85 }).toBuffer();
  const newFilePath = path.join(UPLOADS_DIR, "notice-bg.webp");
  fs.writeFileSync(newFilePath, compressed);

  return NextResponse.json({ success: true });
}
