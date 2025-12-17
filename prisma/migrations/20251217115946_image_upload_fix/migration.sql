/*
  Warnings:

  - The `imageUrl` column on the `Post` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - A unique constraint covering the columns `[pseudoname]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Made the column `pseudoname` on table `User` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Post" DROP COLUMN "imageUrl",
ADD COLUMN     "imageUrl" JSONB;

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "pseudoname" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "User_pseudoname_key" ON "User"("pseudoname");
