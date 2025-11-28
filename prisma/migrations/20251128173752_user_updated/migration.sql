/*
  Warnings:

  - A unique constraint covering the columns `[pseudoname]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `pseudoname` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Post" ADD COLUMN     "imageUrl" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "avatarUrl" TEXT,
ADD COLUMN     "pseudoname" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "User_pseudoname_key" ON "User"("pseudoname");
