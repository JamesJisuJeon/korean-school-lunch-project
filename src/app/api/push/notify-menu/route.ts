import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { sendToAllParents } from "@/lib/push";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const session = await auth();
  if (!session || !(session.user as any).roles.some((r: string) => ["PA", "ADMIN"].includes(r))) {
    return NextResponse.json({ message: "권한이 없습니다." }, { status: 403 });
  }

  try {
    const { menuId } = await req.json();
    if (!menuId) return NextResponse.json({ message: "menuId가 필요합니다." }, { status: 400 });

    const menu = await prisma.menu.findUnique({ where: { id: menuId } });
    if (!menu) return NextResponse.json({ message: "메뉴를 찾을 수 없습니다." }, { status: 404 });
    if (!menu.isPublished) return NextResponse.json({ message: "게시된 메뉴에만 알림을 발송할 수 있습니다." }, { status: 400 });

    const dateStr = new Date(menu.date).toLocaleDateString("ko-KR", {
      month: "long",
      day: "numeric",
      timeZone: "Pacific/Auckland",
    });

    await sendToAllParents({
      title: "간식 메뉴가 등록되었어요!",
      body: `${dateStr} 간식 신청이 시작되었습니다.`,
      url: "/parent/order",
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "알림 발송 중 오류가 발생했습니다." }, { status: 500 });
  }
}
