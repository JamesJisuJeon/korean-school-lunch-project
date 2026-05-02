-- AlterTable: make studentId nullable in Order and CouponSale
ALTER TABLE "Order" DROP CONSTRAINT "Order_studentId_fkey";
ALTER TABLE "Order" ALTER COLUMN "studentId" DROP NOT NULL;
ALTER TABLE "Order" ADD CONSTRAINT "Order_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "CouponSale" DROP CONSTRAINT "CouponSale_studentId_fkey";
ALTER TABLE "CouponSale" ALTER COLUMN "studentId" DROP NOT NULL;
ALTER TABLE "CouponSale" ADD CONSTRAINT "CouponSale_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE SET NULL ON UPDATE CASCADE;
