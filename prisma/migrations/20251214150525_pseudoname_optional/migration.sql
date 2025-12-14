-- DropIndex
DROP INDEX "User_pseudoname_key";

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "pseudoname" DROP NOT NULL;
