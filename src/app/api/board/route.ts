import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

function moveTempImages(content: string, postNumber: number, uploadedImages: string[] = []): string {
  const tempDir = path.join(process.cwd(), "public", "uploads", "board", "temp");
  const tempPattern = /\/uploads\/board\/temp\/([^"'\s]+)/g;
  const matches = [...content.matchAll(tempPattern)];

  // Delete orphaned temp files (uploaded but removed from content)
  const contentFilenames = new Set(matches.map((m) => m[1]));
  for (const url of uploadedImages) {
    const filename = url.split("/uploads/board/temp/")[1];
    if (filename && !contentFilenames.has(filename)) {
      const orphan = path.join(tempDir, filename);
      if (fs.existsSync(orphan)) fs.unlinkSync(orphan);
    }
  }

  if (matches.length === 0) return content;

  const destDir = path.join(process.cwd(), "public", "uploads", "board", String(postNumber));
  if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });

  let updated = content;
  for (const match of matches) {
    const filename = match[1];
    const src = path.join(tempDir, filename);
    const dest = path.join(destDir, filename);
    if (fs.existsSync(src)) fs.renameSync(src, dest);
    updated = updated.replace(`/uploads/board/temp/${filename}`, `/uploads/board/${postNumber}/${filename}`);
  }
  return updated;
}

export async function GET(req: NextRequest) {
  const session = await auth();
  const user = session?.user as any;
  if (!session || !["ADMIN", "S_PA", "PARENT"].some((r) => user?.roles?.includes(r))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit = 10;
  const skip = (page - 1) * limit;

  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: { author: { select: { name: true } } },
    }),
    prisma.post.count(),
  ]);

  return NextResponse.json({ success: true, data: posts, meta: { total, page, limit } });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  const user = session?.user as any;
  if (!session || !["ADMIN", "S_PA"].some((r) => user?.roles?.includes(r))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { title, content, uploadedImages } = body;

  if (!title?.trim() || !content?.trim()) {
    return NextResponse.json({ error: "제목과 내용을 입력해주세요." }, { status: 400 });
  }

  const post = await prisma.post.create({
    data: { title: title.trim(), content, authorId: user.id },
  });

  const movedContent = moveTempImages(content, post.number, uploadedImages);
  if (movedContent !== content) {
    await prisma.post.update({ where: { id: post.id }, data: { content: movedContent } });
    post.content = movedContent;
  }

  return NextResponse.json({ success: true, data: post }, { status: 201 });
}
