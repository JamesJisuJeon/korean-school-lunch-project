-- AlterTable
ALTER TABLE "Menu" ADD COLUMN     "deadline" TIMESTAMP(3),
ADD COLUMN     "isPublished" BOOLEAN NOT NULL DEFAULT false;
