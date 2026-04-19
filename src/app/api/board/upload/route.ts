import { auth } from "@/auth";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import fs from "fs";
import path from "path";
import sharp from "sharp";
import { randomUUID } from "crypto";

export async function POST(req: NextRequest) {
  const session = await auth();
  const user = session?.user as any;
  if (!session || !["ADMIN", "S_PA"].some((r) => user?.roles?.includes(r))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("image") as File | null;
  const postId = formData.get("postId") as string | null;

  if (!file) {
    return NextResponse.json({ error: "이미지 파일이 없습니다." }, { status: 400 });
  }

  const ext = file.name.split(".").pop()?.toLowerCase();
  if (!ext || !["png", "jpg", "jpeg", "webp", "gif"].includes(ext)) {
    return NextResponse.json({ error: "png, jpg, jpeg, webp, gif 파일만 업로드 가능합니다." }, { status: 400 });
  }

  let folder = "temp";
  if (postId) {
    const post = await prisma.post.findUnique({ where: { id: postId }, select: { number: true } });
    if (post) folder = String(post.number);
  }

  const uploadDir = path.join(process.cwd(), "public", "uploads", "board", folder);
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const filename = `${randomUUID()}.webp`;
  const filePath = path.join(uploadDir, filename);

  await sharp(buffer).rotate().webp({ quality: 85 }).toFile(filePath);

  const url = `/uploads/board/${folder}/${filename}`;
  return NextResponse.json({ success: true, url });
}
