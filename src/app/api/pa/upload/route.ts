import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { writeFile } from "fs/promises";
import path from "path";

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
    const buffer = Buffer.from(bytes);

    // 파일명 생성 (중복 방지를 위해 타임스탬프 추가)
    const fileName = `${Date.now()}-${file.name.replace(/\s+/g, "_")}`;
    const uploadPath = path.join(process.cwd(), "public/uploads", fileName);

    await writeFile(uploadPath, buffer);
    const imageUrl = `/uploads/${fileName}`;

    return NextResponse.json({ imageUrl });
  } catch (error) {
    console.error("Upload Error:", error);
    return NextResponse.json({ message: "업로드 중 오류가 발생했습니다." }, { status: 500 });
  }
}
