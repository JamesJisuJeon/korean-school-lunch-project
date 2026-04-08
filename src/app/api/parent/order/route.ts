import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ message: "인증이 필요합니다." }, { status: 401 });

  try {
    const orders = await prisma.order.findMany({
      where: {
        student: { parents: { some: { id: session.user.id } } } as any
      },
      include: {
        student: true,
        menu: true
      },
      orderBy: { menu: { date: "desc" } }
    });
    return NextResponse.json(orders);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "신청 내역 조회 중 오류가 발생했습니다." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session || !session.user) return NextResponse.json({ message: "인증이 필요합니다." }, { status: 401 });

  try {
    // studentIds (배열) 또는 studentId (단건) 지원
    const { studentId, studentIds, menuId, studentNotes } = await req.json();
    const idsToProcess = studentIds || (studentId ? [studentId] : []);

    if (idsToProcess.length === 0) {
      return NextResponse.json({ message: "학생 정보가 필요합니다." }, { status: 400 });
    }

    const menu = await prisma.menu.findUnique({
      where: { id: menuId }
    });

    if (!menu) {
      return NextResponse.json({ message: "유효하지 않은 메뉴입니다." }, { status: 404 });
    }

    if (!menu.isPublished) {
      return NextResponse.json({ message: "아직 공개되지 않은 메뉴입니다." }, { status: 400 });
    }

    if (menu.deadline && new Date() > new Date(menu.deadline)) {
      return NextResponse.json({ message: "신청 마감 시간이 지났습니다." }, { status: 400 });
    }

    const results = [];

    for (const sid of idsToProcess) {
      const student = await prisma.student.findUnique({
        where: { id: sid },
        include: { parents: true } as any
      }) as any;
      
      if (!student || !student.parents.some((p: any) => p.id === session.user.id)) {
        continue; // 본인 자녀가 아니면 스킵
      }

      const finalAmount = student.isPAChild ? 0 : menu.price;
      const notes = studentNotes ? studentNotes[sid] : null;

      const order = await (prisma as any).order.upsert({
        where: {
          studentId_menuId: { studentId: sid, menuId }
        },
        update: {
          amount: finalAmount,
          isPaid: false, // PA 자녀라도 신청 즉시 수납완료 처리하지 않음 (취소 가능하도록)
          notes: notes
        },
        create: {
          studentId: sid,
          menuId,
          amount: finalAmount,
          isPaid: false,
          orderType: "PRE_ORDER",
          notes: notes
        }
      });
      results.push(order);
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "신청 중 오류가 발생했습니다." }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session || !session.user) return NextResponse.json({ message: "인증이 필요합니다." }, { status: 401 });

  try {
    const { orderId } = await req.json();

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        student: { include: { parents: true } as any },
        menu: true
      } as any
    }) as any;

    if (!order) {
      return NextResponse.json({ message: "신청 내역을 찾을 수 없습니다." }, { status: 404 });
    }

    // 본인 자녀의 신청인지 확인
    if (!order.student.parents.some((p: any) => p.id === session.user.id)) {
      return NextResponse.json({ message: "권한이 없습니다." }, { status: 403 });
    }

    // 수납대기 상태인지 확인
    if (order.status !== "WAITING") {
      return NextResponse.json({ message: "수납대기 상태인 신청만 취소할 수 있습니다." }, { status: 400 });
    }

    // 배식일자 경과 여부 확인
    if (new Date() >= new Date(order.menu.date)) {
      return NextResponse.json({ message: "배식일자가 지난 신청은 취소할 수 없습니다." }, { status: 400 });
    }

    await prisma.order.delete({
      where: { id: orderId }
    });

    return NextResponse.json({ message: "신청이 취소되었습니다." });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "취소 중 오류가 발생했습니다." }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session || !session.user) return NextResponse.json({ message: "인증이 필요합니다." }, { status: 401 });

  try {
    const { orderId, notes } = await req.json();

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        student: { include: { parents: true } as any },
        menu: true
      } as any
    }) as any;

    if (!order) {
      return NextResponse.json({ message: "신청 내역을 찾을 수 없습니다." }, { status: 404 });
    }

    // 본인 자녀의 신청인지 확인
    if (!order.student.parents.some((p: any) => p.id === session.user.id)) {
      return NextResponse.json({ message: "권한이 없습니다." }, { status: 403 });
    }

    // 마감 여부 확인
    if (order.menu.deadline && new Date() > new Date(order.menu.deadline)) {
      return NextResponse.json({ message: "신청 마감 시간이 지난 신청은 수정할 수 없습니다." }, { status: 400 });
    }

    // 이미 결제된 경우 수정 불가 (보통 수납 전만 수정 가능하도록 설정)
    if (order.isPaid) {
      return NextResponse.json({ message: "이미 수납된 신청은 직접 수정할 수 없습니다. 관리자에게 문의해 주세요." }, { status: 400 });
    }

    const updatedOrder = await (prisma as any).order.update({
      where: { id: orderId },
      data: { notes }
    });

    return NextResponse.json(updatedOrder);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "수정 중 오류가 발생했습니다." }, { status: 500 });
  }
}
