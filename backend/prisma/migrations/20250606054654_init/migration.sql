-- AlterTable
ALTER TABLE "Interview" ADD COLUMN     "meetLink" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "isOnline" BOOLEAN NOT NULL DEFAULT false;
