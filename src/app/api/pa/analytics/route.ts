import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const session = await auth();
  if (!session || !(session.user as any).roles.some((r: string) => ["PA", "ADMIN"].includes(r))) {
    return NextResponse.json({ message: "권한이 없습니다." }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const menuId = searchParams.get("menuId");

  if (!menuId) return NextResponse.json({ message: "menuId가 필요합니다." }, { status: 400 });

  const activeYear = await prisma.academicYear.findFirst({ where: { isActive: true } });
  if (!activeYear) return NextResponse.json({ message: "활성 학년도가 없습니다." }, { status: 400 });

  const menu = await prisma.menu.findUnique({ where: { id: menuId } });
  if (!menu) return NextResponse.json({ message: "메뉴를 찾을 수 없습니다." }, { status: 404 });

  const students = await prisma.student.findMany({
    where: { class: { academicYearId: activeYear.id } },
    include: {
      class: true,
      orders: { where: { menuId } },
      couponSales: { where: { menuId } },
    },
    orderBy: [{ class: { name: "asc" } }, { name: "asc" }],
  });

  // --- 전체 집계 ---
  const totalStudents = students.length;

  type OrderRow = {
    id: string;
    status: string;
    orderType: string;
    amount: number;
    isPAChild: boolean;
  };

  const allOrders: OrderRow[] = students.flatMap((s) =>
    s.orders.map((o) => ({
      id: o.id,
      status: o.status,
      orderType: o.orderType,
      amount: o.amount,
      isPAChild: s.isPAChild,
    }))
  );

  const paidStatuses = ["PAID", "POST_PAID"];

  const allPreOrders = allOrders.filter((o) => o.orderType === "PRE_ORDER");
  const onSiteOrders = allOrders.filter((o) => o.orderType === "ON_SITE");
  const cancelledOrders = allOrders.filter((o) => o.status === "CANCELLED");

  const activeOrders = allOrders.filter((o) => o.status !== "CANCELLED");
  const waitingCount = activeOrders.filter((o) => o.status === "WAITING").length;

  const paidConfirmedCount = activeOrders.filter((o) => paidStatuses.includes(o.status)).length;
  const unpaidCount = activeOrders.filter((o) => o.status === "UNPAID").length;
  const freeLunchCount = activeOrders.filter((o) => o.status === "FREE_SNACK").length;

  const paOrders = allOrders.filter((o) => o.isPAChild);
  const cancelledPaOrders = paOrders.filter((o) => o.status === "CANCELLED");
  const activePaOrders = paOrders.filter((o) => o.status !== "CANCELLED");

  // 사전 신청 (취소 포함)
  const preOrderCancelled = allPreOrders.filter((o) => o.status === "CANCELLED");
  const activePreOrders = allPreOrders.filter((o) => o.status !== "CANCELLED");
  const preOrderRegular = allPreOrders.filter((o) => !o.isPAChild);
  const preOrderPAChild = allPreOrders.filter((o) => o.isPAChild);

  const preOrderPaid = activePreOrders.filter((o) => paidStatuses.includes(o.status));
  const preOrderUnpaid = activePreOrders.filter((o) => o.status === "UNPAID");

  const onSitePaid = onSiteOrders.filter((o) => paidStatuses.includes(o.status));
  const onSiteUnpaid = onSiteOrders.filter((o) => o.status === "UNPAID");

  const allUnpaid = activeOrders.filter((o) => o.status === "UNPAID");

  const allCoupons = students.flatMap((s) => s.couponSales);
  const freeCouponCount = allCoupons.filter((c) => c.paymentStatus === "FREE_COUPON").reduce((sum, c) => sum + c.quantity, 0);
  const couponPaidStatuses = ["PAID", "POST_PAID"];
  const couponSaleAmount = allCoupons
    .filter((c) => couponPaidStatuses.includes(c.paymentStatus))
    .reduce((sum, c) => sum + c.amount, 0);
  const couponSaleUnpaidAmount = allCoupons
    .filter((c) => c.paymentStatus === "UNPAID")
    .reduce((sum, c) => sum + c.amount, 0);

  // 반별 sortOrder 맵
  const classSortOrderMap = new Map<string, number>();
  for (const student of students) {
    const className = student.class?.name ?? "미배정";
    if (!classSortOrderMap.has(className) && student.class?.sortOrder != null) {
      classSortOrderMap.set(className, student.class.sortOrder);
    }
  }

  // --- 반별 집계 ---
  type ClassStat = {
    className: string;
    totalStudents: number;
    orderedCount: number;
    confirmedCount: number;
    paidCount: number;
    unpaidCount: number;
    waitingCount: number;
    cancelledCount: number;
    paChildCount: number;
    freeLunchCount: number;
    paidAmount: number;
    unpaidAmount: number;
    couponAmount: number;
    couponUnpaidAmount: number;
    couponUnpaidCount: number;
    freeCouponCount: number;
  };

  const classMap = new Map<string, ClassStat>();

  for (const student of students) {
    const className = student.class?.name ?? "미배정";
    if (!classMap.has(className)) {
      classMap.set(className, {
        className,
        totalStudents: 0,
        orderedCount: 0,
        confirmedCount: 0,
        paidCount: 0,
        unpaidCount: 0,
        waitingCount: 0,
        cancelledCount: 0,
        paChildCount: 0,
        freeLunchCount: 0,
        paidAmount: 0,
        unpaidAmount: 0,
        couponAmount: 0,
        couponUnpaidAmount: 0,
        couponUnpaidCount: 0,
        freeCouponCount: 0,
      });
    }
    const cls = classMap.get(className)!;
    cls.totalStudents++;

    const order = student.orders[0];
    if (order) {
      if (order.status === "CANCELLED") {
        cls.cancelledCount++;
      } else {
        cls.orderedCount++;
        if (paidStatuses.includes(order.status)) {
          cls.paidCount++;
          cls.confirmedCount++;
          cls.paidAmount += order.amount;
        } else if (order.status === "UNPAID") {
          cls.unpaidCount++;
          cls.confirmedCount++;
          cls.unpaidAmount += order.amount;
        } else if (order.status === "FREE_SNACK") {
          cls.confirmedCount++;
          cls.freeLunchCount++;
        } else {
          cls.waitingCount++;
        }
        if (student.isPAChild) cls.paChildCount++;
      }
    }

    for (const coupon of student.couponSales) {
      if (coupon.paymentStatus === "FREE_COUPON") {
        cls.freeCouponCount += coupon.quantity;
      } else if (couponPaidStatuses.includes(coupon.paymentStatus)) {
        cls.couponAmount += coupon.amount;
      } else if (coupon.paymentStatus === "UNPAID") {
        cls.couponUnpaidAmount += coupon.amount;
        cls.couponUnpaidCount++;
      }
    }
  }



  return NextResponse.json({
    menu: { date: menu.date, price: menu.price },
    totalStudents,
    finalOrderCount: activeOrders.length,
    totalPreOrders: allPreOrders.length,
    preOrderRegularCount: preOrderRegular.length,
    preOrderPAChildCount: preOrderPAChild.length,
    preOrderCancelledCount: preOrderCancelled.length,
    onSiteCount: onSiteOrders.length,
    paOrdersCount: paOrders.length,
    activePaOrdersCount: activePaOrders.length,
    cancelledPaOrdersCount: cancelledPaOrders.length,
    cancelledOrdersCount: cancelledOrders.length,
    waitingCount,
    paidConfirmedCount,
    unpaidCount,
    freeLunchCount,
    freeCouponCount,
    finalConfirmedCount: paidConfirmedCount + unpaidCount + freeLunchCount,
    preOrderPaidAmount: preOrderPaid.reduce((sum, o) => sum + o.amount, 0),
    preOrderUnpaidAmount: preOrderUnpaid.reduce((sum, o) => sum + o.amount, 0),
    onSitePaidAmount: onSitePaid.reduce((sum, o) => sum + o.amount, 0),
    onSiteUnpaidAmount: onSiteUnpaid.reduce((sum, o) => sum + o.amount, 0),
    allUnpaidAmount: allUnpaid.reduce((sum, o) => sum + o.amount, 0),
    totalPaidAmount:
      preOrderPaid.reduce((sum, o) => sum + o.amount, 0) +
      onSitePaid.reduce((sum, o) => sum + o.amount, 0),
    couponSaleAmount,
    couponSaleUnpaidAmount,
    totalRevenue:
      preOrderPaid.reduce((sum, o) => sum + o.amount, 0) +
      onSitePaid.reduce((sum, o) => sum + o.amount, 0) +
      couponSaleAmount,
    classSummary: Array.from(classMap.values()).sort((a, b) => {
      const aOrder = classSortOrderMap.get(a.className) ?? Infinity;
      const bOrder = classSortOrderMap.get(b.className) ?? Infinity;
      if (aOrder !== bOrder) return aOrder - bOrder;
      return a.className.localeCompare(b.className, "ko");
    }),
  });
}
