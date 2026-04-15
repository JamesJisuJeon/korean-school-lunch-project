"use server";

import { auth } from "@/auth";
import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { formatInTimeZone } from "date-fns-tz";

const NOTICE_EXTS = ["png", "jpg", "jpeg"] as const;
const PUBLIC_DIR = path.join(process.cwd(), "public", "uploads");

function findExistingNoticeBg(): { filePath: string; ext: string } | null {
  for (const ext of NOTICE_EXTS) {
    const filePath = path.join(PUBLIC_DIR, `notice-bg.${ext}`);
    if (fs.existsSync(filePath)) {
      return { filePath, ext };
    }
  }
  return null;
}

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
  if (!originalExt || !NOTICE_EXTS.includes(originalExt as typeof NOTICE_EXTS[number])) {
    return NextResponse.json({ error: "png, jpg, jpeg 파일만 업로드 가능합니다." }, { status: 400 });
  }

  // 기존 notice-bg 파일 타임스탬프 백업
  const existing = findExistingNoticeBg();
  if (existing) {
    const timestamp = formatInTimeZone(new Date(), "Pacific/Auckland", "yyyyMMddHHmmss");
    const backupPath = path.join(PUBLIC_DIR, `notice-bg_${timestamp}.${existing.ext}`);
    fs.renameSync(existing.filePath, backupPath);
  }

  // 새 이미지 저장
  const buffer = Buffer.from(await file.arrayBuffer());
  const newFilePath = path.join(PUBLIC_DIR, `notice-bg.${originalExt}`);
  fs.writeFileSync(newFilePath, buffer);

  return NextResponse.json({ success: true });
}
