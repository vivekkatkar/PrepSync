/*
  Warnings:

  - A unique constraint covering the columns `[roomId]` on the table `Interview` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Interview" ADD COLUMN     "roomId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Interview_roomId_key" ON "Interview"("roomId");
