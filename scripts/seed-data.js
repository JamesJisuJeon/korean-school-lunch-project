const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash('password123', 10);

  console.log('Seeding data...');

  // 1. Admin 2명
  const admins = [
    { email: 'admin1@school.com', name: '관리자1', roles: ['ADMIN'] },
    { email: 'admin2@school.com', name: '관리자2', roles: ['ADMIN'] },
  ];
  for (const admin of admins) {
    await prisma.user.upsert({
      where: { email: admin.email },
      update: {},
      create: { ...admin, password, mustChangePassword: false },
    });
  }
  console.log('Admins created.');

  // 2. 학부모회(PA) 10명
  for (let i = 1; i <= 10; i++) {
    await prisma.user.upsert({
      where: { email: `pa${i}@school.com` },
      update: {},
      create: {
        email: `pa${i}@school.com`,
        name: `학부모회${i}`,
        roles: ['PA', 'PARENT'],
        password,
        mustChangePassword: false,
      },
    });
  }
  console.log('PA members created.');

  // 3. 선생님 20명
  const teachers = [];
  for (let i = 1; i <= 20; i++) {
    const teacher = await prisma.user.upsert({
      where: { email: `teacher${i}@school.com` },
      update: {},
      create: {
        email: `teacher${i}@school.com`,
        name: `선생님${i}`,
        roles: ['TEACHER'],
        password,
        mustChangePassword: false,
      },
    });
    teachers.push(teacher);
  }
  console.log('Teachers created.');

  // 4. 학사연도 및 학급 (데이터 연결을 위해 필요)
  const currentYear = new Date().getFullYear().toString();
  const academicYear = await prisma.academicYear.upsert({
    where: { name: currentYear },
    update: {},
    create: {
      name: currentYear,
      startDate: new Date(`${currentYear}-01-01`),
      endDate: new Date(`${currentYear}-12-31`),
      isActive: true,
    },
  });

  const grades = ['유치1', '유치2', '초등1', '초등2', '초등3'];
  const classes = [];
  for (let i = 0; i < 5; i++) {
    const cls = await prisma.class.create({
      data: {
        name: `${i + 1}반`,
        grade: grades[i % grades.length],
        academicYearId: academicYear.id,
        teacherName: teachers[i].name,
        teacherId: teachers[i].id,
      },
    });
    classes.push(cls);
  }
  console.log('Classes created.');

  // 5. 일반 학부모 40명 추가 (총 50명의 학부모를 만들기 위해 PA 10명 + 일반 40명)
  const parents = [];
  // PA 10명 먼저 추가
  const paUsers = await prisma.user.findMany({ where: { roles: { has: 'PA' } } });
  parents.push(...paUsers);

  for (let i = 1; i <= 40; i++) {
    const parent = await prisma.user.upsert({
      where: { email: `parent${i}@school.com` },
      update: {},
      create: {
        email: `parent${i}@school.com`,
        name: `학부모${i}`,
        roles: ['PARENT'],
        password,
        mustChangePassword: false,
      },
    });
    parents.push(parent);
  }
  console.log('Total Parents prepared (PA + General).');

  // 5. 학생 데이터 초기화 및 재생성
  await prisma.student.deleteMany();
  console.log('Existing students cleared.');

  // 6. 학생 50명
  const firstNames = ['민준', '서준', '도윤', '예준', '시우', '하준', '주원', '지호', '지후', '준서', '서윤', '서연', '지우', '하윤', '지유', '윤서', '채원', '하은', '수아', '다은'];
  const lastNames = ['김', '이', '박', '최', '정', '강', '조', '윤', '장', '임'];

  for (let i = 1; i <= 50; i++) {
    const randomLastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const randomFirstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const parent = parents[i % parents.length];
    const cls = classes[i % classes.length];

    await prisma.student.create({
      data: {
        name: `${randomLastName}${randomFirstName}${i}`,
        parents: { connect: { id: parent.id } },
        classId: cls.id,
        isPAChild: parent.roles.includes('PA'),
      },
    });
  }
  console.log('50 Students created and linked to parents via many-to-many relationship.');

  console.log('Seeding completed successfully!');
  console.log('All accounts password: password123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
