import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const adminEmail = "admin@school.com";
  const adminPassword = "admin1234";
  const hashedAdminPassword = await bcrypt.hash(adminPassword, 10);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      name: "관리자",
      password: hashedAdminPassword,
      roles: [Role.ADMIN, Role.PARENT], // 관리자이자 학부모 권한 부여
      mustChangePassword: true,
    },
  });

  console.log(`Admin user created: ${admin.email}`);
  console.log(`Temporary Password: ${adminPassword}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
