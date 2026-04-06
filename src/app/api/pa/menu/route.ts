import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// 메뉴 조회 (PA는 전체, 학부모는 공개된 것만)
export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ message: "인증이 필요합니다." }, { status: 401 });

  const isPAOrAdmin = (session.user as any).roles.some((r: string) => ["PA", "ADMIN"].includes(r));

  try {
    const menus = await prisma.menu.findMany({
      where: isPAOrAdmin ? {} : { isPublished: true },
      orderBy: { date: "desc" },
      take: 10,
    });
    return NextResponse.json(menus);
  } catch (error) {
    return NextResponse.json({ message: "메뉴 조회 중 오류가 발생했습니다." }, { status: 500 });
  }
}

// 메뉴 등록 및 공개 설정
export async function POST(req: Request) {
  const session = await auth();
  if (!session || !(session.user as any).roles.some((r: string) => ["PA", "ADMIN"].includes(r))) {
    return NextResponse.json({ message: "권한이 없습니다." }, { status: 403 });
  }

  try {
    const {
      date,
      mainItems,
      dessertItems,
      beverageItems,
      specialItems,
      imageUrl,
      price,
      isPublished,
      deadline
    } = await req.json();

    // 날짜를 자정(UTC 00:00:00)으로 정규화하여 중복 저장을 방지하고 정확한 비교를 보장함
    const menuDate = new Date(date);
    menuDate.setUTCHours(0, 0, 0, 0);

    const existingPublishedMenu = await prisma.menu.findFirst({
      where: { isPublished: true }
    });

    if (existingPublishedMenu) {
      const existingDate = new Date(existingPublishedMenu.date);
      existingDate.setUTCHours(0, 0, 0, 0);

      // 이번에 게시하려는 메뉴가 기존 게시된 메뉴와 날짜가 다르고, isPublished가 true라면 차단
      if (existingDate.getTime() !== menuDate.getTime() && isPublished) {
        return NextResponse.json({ 
          message: "이미 게시 중인 다른 날짜의 메뉴가 있습니다. 기존 메뉴의 게시를 해제해야 다른 메뉴를 게시할 수 있습니다." 
        }, { status: 400 });
      }
    }

    const menuData = {
      mainItems,
      dessertItems,
      beverageItems,
      specialItems,
      imageUrl,
      price: parseFloat(price),
      isPublished: isPublished ?? false,
      deadline: deadline ? new Date(deadline) : null
    };

    const menu = await prisma.menu.upsert({
      where: { date: menuDate },
      update: menuData,
      create: {
        date: menuDate,
        ...menuData
      },
    });

    return NextResponse.json(menu);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "메뉴 등록 중 오류가 발생했습니다." }, { status: 500 });
  }
}

// 메뉴 삭제
export async function DELETE(req: Request) {
  const session = await auth();
  if (!session || !(session.user as any).roles.some((r: string) => ["PA", "ADMIN"].includes(r))) {
    return NextResponse.json({ message: "권한이 없습니다." }, { status: 403 });
  }

  try {
    const { id } = await req.json();
    if (!id) return NextResponse.json({ message: "메뉴 ID가 필요합니다." }, { status: 400 });

    await prisma.menu.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "메뉴 삭제 중 오류가 발생했습니다." }, { status: 500 });
  }
}
