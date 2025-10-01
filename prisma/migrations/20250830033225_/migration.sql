-- CreateTable
CREATE TABLE "public"."Date" (
    "id" TEXT NOT NULL,
    "day" TIMESTAMP(3) NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "clientId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Date_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Date_day_idx" ON "public"."Date"("day");

-- CreateIndex
CREATE UNIQUE INDEX "Date_day_startsAt_endsAt_key" ON "public"."Date"("day", "startsAt", "endsAt");

-- AddForeignKey
ALTER TABLE "public"."Date" ADD CONSTRAINT "Date_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "public"."Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
