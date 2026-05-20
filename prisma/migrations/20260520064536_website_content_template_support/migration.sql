-- AlterTable
ALTER TABLE "Business" ADD COLUMN     "features" JSONB,
ADD COLUMN     "fontStyle" TEXT,
ADD COLUMN     "templateId" TEXT,
ADD COLUMN     "testimonials" JSONB,
ADD COLUMN     "themeColor" TEXT,
ADD COLUMN     "websiteContent" JSONB;
