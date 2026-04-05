import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// 1. 전체 주문 현황 조회 (수납 관리용)
export async function GET(req: Request) {
  const session = await auth();
  if (!session || !(session.user as any).roles.some((r: string) => ["PA", "ADMIN"].includes(r))) {
    return NextResponse.json({ message: "권한이 없습니다." }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const menuId = searchParams.get("menuId");

  if (!menuId) return NextResponse.json([]);

  try {
    // 1. 활성 학년도 찾기
    const activeYear = await prisma.academicYear.findFirst({
      where: { isActive: true }
    });

    if (!activeYear) return NextResponse.json({ message: "활성 학년도가 없습니다." }, { status: 400 });

    // 2. 해당 학년도 학급에 소속된 모든 학생 조회 (주문 정보 및 쿠폰 정보 포함)
    const students = await prisma.student.findMany({
      where: {
        class: { academicYearId: activeYear.id }
      },
      include: {
        class: true,
        orders: {
          where: { menuId },
          include: { menu: true }
        },
        couponSales: {
          where: { menuId }
        }
      },
      orderBy: [
        { class: { name: "asc" } },
        { name: "asc" }
      ]
    });

    return NextResponse.json(students);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "조회 중 오류가 발생했습니다." }, { status: 500 });
  }
}

// 2. 수납 상태/특이사항 변경 (PATCH)
export async function PATCH(req: Request) {
  const session = await auth();
  if (!session || !(session.user as any).roles.some((r: string) => ["PA", "ADMIN"].includes(r))) {
    return NextResponse.json({ message: "권한이 없습니다." }, { status: 403 });
  }

  try {
    const { orderId, status, notes, isPaid, studentId, menuId, couponPaymentStatus } = await req.json();

    // 쿠폰비 수납 상태 변경 (studentId + menuId 기준)
    if (studentId !== undefined && menuId !== undefined && couponPaymentStatus !== undefined) {
      const couponSale = await prisma.couponSale.update({
        where: { studentId_menuId: { studentId, menuId } },
        data: { paymentStatus: couponPaymentStatus }
      });
      return NextResponse.json(couponSale);
    }

    const updateData: any = {};
    if (status !== undefined) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes;
    if (isPaid !== undefined) {
      updateData.isPaid = isPaid;
      updateData.paymentDate = isPaid ? new Date() : null;
    }

    const order = await (prisma as any).order.update({
      where: { id: orderId },
      data: updateData
    });
    return NextResponse.json(order);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "수정 중 오류가 발생했습니다." }, { status: 500 });
  }
}

// 3. 현장 신청 직접 생성 / 쿠폰 판매 (POST)
export async function POST(req: Request) {
  const session = await auth();
  if (!session || !(session.user as any).roles.some((r: string) => ["PA", "ADMIN"].includes(r))) {
    return NextResponse.json({ message: "권한이 없습니다." }, { status: 403 });
  }

  try {
    const { studentId, menuId, quantity } = await req.json();

    // 쿠폰 판매 처리 (quantity가 있는 경우) - 학생+메뉴 기준 단일 레코드 upsert
    if (quantity !== undefined) {
      if (quantity === 0) {
        await prisma.couponSale.deleteMany({ where: { studentId, menuId } });
        return NextResponse.json({ success: true });
      }
      const couponSale = await prisma.couponSale.upsert({
        where: { studentId_menuId: { studentId, menuId } },
        create: {
          studentId,
          menuId,
          quantity,
          amount: quantity * 5,
        },
        update: {
          quantity,
          amount: quantity * 5,
        }
      });
      return NextResponse.json(couponSale);
    }

    // 현장 신청 처리
    const menu = await prisma.menu.findUnique({ where: { id: menuId } });
    const student = await prisma.student.findUnique({ where: { id: studentId } });

    if (!menu || !student) return NextResponse.json({ message: "정보를 찾을 수 없습니다." }, { status: 404 });

    const order = await (prisma as any).order.upsert({
      where: { studentId_menuId: { studentId, menuId } },
      create: {
        studentId,
        menuId,
        amount: student.isPAChild ? 0 : menu.price,
        orderType: "ON_SITE",
        status: "WAITING",
        isPaid: false,
        paymentDate: null
      },
      update: {
        status: "PAID",
        isPaid: true,
        paymentDate: new Date()
      }
    });

    return NextResponse.json(order);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "처리 중 오류가 발생했습니다." }, { status: 500 });
  }
}

// 4. 현장 신청 삭제 (DELETE) - ON_SITE 주문만 삭제 가능
export async function DELETE(req: Request) {
  const session = await auth();
  if (!session || !(session.user as any).roles.some((r: string) => ["PA", "ADMIN"].includes(r))) {
    return NextResponse.json({ message: "권한이 없습니다." }, { status: 403 });
  }

  try {
    const { orderId } = await req.json();

    const order = await (prisma as any).order.findUnique({ where: { id: orderId } });
    if (!order) return NextResponse.json({ message: "주문을 찾을 수 없습니다." }, { status: 404 });
    if (order.orderType !== "ON_SITE") {
      return NextResponse.json({ message: "사전 신청은 취소할 수 없습니다." }, { status: 400 });
    }

    await (prisma as any).order.delete({ where: { id: orderId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "삭제 중 오류가 발생했습니다." }, { status: 500 });
  }
}
