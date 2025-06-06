/*
  Warnings:

  - You are about to drop the column `scheduledWith` on the `Interview` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Interview" DROP COLUMN "scheduledWith",
ADD COLUMN     "scheduledWithId" TEXT;

-- AddForeignKey
ALTER TABLE "Interview" ADD CONSTRAINT "Interview_scheduledWithId_fkey" FOREIGN KEY ("scheduledWithId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
