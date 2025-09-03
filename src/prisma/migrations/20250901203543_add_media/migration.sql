-- CreateTable
CREATE TABLE "public"."Media" (
    "id" TEXT NOT NULL,
    "uid" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Media_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."Media" ADD CONSTRAINT "Media_uid_fkey" FOREIGN KEY ("uid") REFERENCES "public"."User"("uid") ON DELETE RESTRICT ON UPDATE CASCADE;
