import { PrismaClient, Role, OrderType } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash("password123", 10);

  // 1. 사용자 생성
  await prisma.user.upsert({
    where: { email: "admin@school.com" },
    update: {},
    create: { email: "admin@school.com", name: "관리자", password, roles: [Role.ADMIN], mustChangePassword: false }
  });

  const paMember = await prisma.user.upsert({
    where: { email: "pa@school.com" },
    update: {},
    create: { email: "pa@school.com", name: "학부모회장", password, roles: [Role.PA, Role.PARENT], mustChangePassword: false }
  });

  const teacher = await prisma.user.upsert({
    where: { email: "teacher@school.com" },
    update: {},
    create: { email: "teacher@school.com", name: "김선생님", password, roles: [Role.TEACHER, Role.PARENT], mustChangePassword: false }
  });

  const parent = await prisma.user.upsert({
    where: { email: "parent@test.com" },
    update: {},
    create: { email: "parent@test.com", name: "이학부모", password, roles: [Role.PARENT], mustChangePassword: false }
  });

  // 2. 학년도 및 반 생성
  const year = await prisma.academicYear.upsert({
    where: { name: "2024-2025" },
    update: {},
    create: {
      name: "2024-2025",
      startDate: new Date("2024-03-01"),
      endDate: new Date("2025-02-28"),
      isActive: true
    }
  });

  const class1 = await prisma.class.create({ data: { name: "무궁화반", academicYearId: year.id, teacherId: teacher.id } });
  const class2 = await prisma.class.create({ data: { name: "진달래반", academicYearId: year.id } });

  // 3. 학생 생성
  const student1 = await prisma.student.create({ data: { name: "학부모회자녀", parents: { connect: { id: paMember.id } }, classId: class1.id, isPAChild: true } });
  await prisma.student.create({ data: { name: "선생님자녀", parents: { connect: { id: teacher.id } }, classId: class1.id, isPAChild: false } });
  await prisma.student.create({ data: { name: "일반자녀1", parents: { connect: { id: parent.id } }, classId: class2.id, isPAChild: false } });
  await prisma.student.create({ data: { name: "일반자녀2", parents: { connect: { id: parent.id } }, classId: class2.id, isPAChild: false } });

  // 4. 메뉴 생성
  const pastDate = new Date(); pastDate.setDate(pastDate.getDate() - 7);
  const now = new Date();
  const futureDate = new Date(); futureDate.setDate(futureDate.getDate() + 7);

  const menuPast = await prisma.menu.create({
    data: {
      date: pastDate,
      mainItems: "비빔밥, 과일, 주스",
      specialItems: null,
      price: 7,
      isPublished: true,
      deadline: pastDate
    }
  });

  await prisma.menu.create({
    data: {
      date: now,
      mainItems: "불고기, 도넛, 식혜",
      specialItems: "핫도그 $2",
      price: 7,
      isPublished: true,
      deadline: futureDate
    }
  });

  await prisma.menu.create({
    data: {
      date: futureDate,
      mainItems: "제육볶음",
      specialItems: null,
      price: 10,
      isPublished: false,
      deadline: null
    }
  });

  // 5. 샘플 주문
  await prisma.order.create({
    data: { studentId: student1.id, menuId: menuPast.id, amount: 0, isPaid: true, orderType: OrderType.PRE_ORDER }
  });

  console.log("테스트 데이터 생성 완료!");
  console.log("아이디: admin@school.com / pa@school.com / teacher@school.com / parent@test.com");
  console.log("비밀번호: password123");
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
