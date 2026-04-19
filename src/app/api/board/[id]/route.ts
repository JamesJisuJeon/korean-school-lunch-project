import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const user = session?.user as any;
  if (!session || !["ADMIN", "S_PA", "PARENT"].some((r) => user?.roles?.includes(r))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const post = await prisma.post.findUnique({
    where: { id },
    include: { author: { select: { name: true } } },
  });

  if (!post) return NextResponse.json({ error: "게시글을 찾을 수 없습니다." }, { status: 404 });

  return NextResponse.json({ success: true, data: post });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const user = session?.user as any;
  if (!session || !["ADMIN", "S_PA"].some((r) => user?.roles?.includes(r))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();
  const { title, content, uploadedImages = [] } = body;

  if (!title?.trim() || !content?.trim()) {
    return NextResponse.json({ error: "제목과 내용을 입력해주세요." }, { status: 400 });
  }

  const existing = await prisma.post.findUnique({ where: { id }, select: { number: true, content: true } });
  if (!existing) return NextResponse.json({ error: "게시글을 찾을 수 없습니다." }, { status: 404 });

  const postNumber = existing.number;
  const boardDir = path.join(process.cwd(), "public", "uploads", "board");
  const tempDir = path.join(boardDir, "temp");
  const postDir = path.join(boardDir, String(postNumber));

  // Extract filenames from a content string for the given folder prefix
  function extractFilenames(html: string, prefix: string): Set<string> {
    const pattern = new RegExp(`${prefix}/([^"'\\s]+)`, "g");
    return new Set([...html.matchAll(pattern)].map((m) => m[1]));
  }

  // 1. Delete post images removed from content
  const oldPostFiles = extractFilenames(existing.content, `/uploads/board/${postNumber}`);
  const newPostFiles = extractFilenames(content, `/uploads/board/${postNumber}`);
  for (const filename of oldPostFiles) {
    if (!newPostFiles.has(filename)) {
      const file = path.join(postDir, filename);
      if (fs.existsSync(file)) fs.unlinkSync(file);
    }
  }

  // 2. Move new temp images referenced in content → post folder
  const newTempFiles = extractFilenames(content, "/uploads/board/temp");
  let updatedContent = content;
  if (newTempFiles.size > 0) {
    if (!fs.existsSync(postDir)) fs.mkdirSync(postDir, { recursive: true });
    for (const filename of newTempFiles) {
      const src = path.join(tempDir, filename);
      const dest = path.join(postDir, filename);
      if (fs.existsSync(src)) fs.renameSync(src, dest);
      updatedContent = updatedContent.replace(`/uploads/board/temp/${filename}`, `/uploads/board/${postNumber}/${filename}`);
    }
  }

  // 3. Delete orphaned temp images (uploaded during edit but removed from content)
  for (const url of uploadedImages as string[]) {
    const filename = url.split("/uploads/board/temp/")[1];
    if (filename && !newTempFiles.has(filename)) {
      const orphan = path.join(tempDir, filename);
      if (fs.existsSync(orphan)) fs.unlinkSync(orphan);
    }
  }

  const post = await prisma.post.update({
    where: { id },
    data: { title: title.trim(), content: updatedContent },
  });

  return NextResponse.json({ success: true, data: post });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const user = session?.user as any;
  if (!session || !["ADMIN", "S_PA"].some((r) => user?.roles?.includes(r))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const post = await prisma.post.findUnique({ where: { id }, select: { number: true } });
  await prisma.post.delete({ where: { id } });

  if (post) {
    const imageDir = path.join(process.cwd(), "public", "uploads", "board", String(post.number));
    if (fs.existsSync(imageDir)) fs.rmSync(imageDir, { recursive: true, force: true });
  }

  return NextResponse.json({ success: true });
}
