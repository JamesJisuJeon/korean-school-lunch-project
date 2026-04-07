import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { writeFile } from "fs/promises";
import path from "path";
import sharp from "sharp";

export async function POST(req: Request) {
  const session = await auth();
  if (!session || !(session.user as any).roles.some((r: string) => ["PA", "ADMIN"].includes(r))) {
    return NextResponse.json({ message: "권한이 없습니다." }, { status: 403 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ message: "파일이 없습니다." }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const inputBuffer = Buffer.from(bytes);

    // WebP로 변환하여 파일 크기 압축 (해상도 유지, quality 85)
    const compressed = await sharp(inputBuffer)
      .webp({ quality: 85 })
      .toBuffer();

    const baseName = file.name.replace(/\s+/g, "_").replace(/\.[^.]+$/, "");
    const fileName = `${Date.now()}-${baseName}.webp`;
    const uploadPath = path.join(process.cwd(), "public/uploads", fileName);

    await writeFile(uploadPath, compressed);
    const imageUrl = `/uploads/${fileName}`;

    return NextResponse.json({ imageUrl });
  } catch (error) {
    console.error("Upload Error:", error);
    return NextResponse.json({ message: "업로드 중 오류가 발생했습니다." }, { status: 500 });
  }
}
