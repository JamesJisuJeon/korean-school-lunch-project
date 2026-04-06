-- CreateTable
CREATE TABLE "ClassAssistant" (
    "id" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "ClassAssistant_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ClassAssistant_userId_key" ON "ClassAssistant"("userId");

-- AddForeignKey
ALTER TABLE "ClassAssistant" ADD CONSTRAINT "ClassAssistant_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassAssistant" ADD CONSTRAINT "ClassAssistant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
