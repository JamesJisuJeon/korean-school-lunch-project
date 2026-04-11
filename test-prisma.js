const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()
async function test() {
  try {
    const res = await prisma.student.findFirst()
    console.log("Success")
  } catch (e) {
    console.error(e)
  }
}
test()
