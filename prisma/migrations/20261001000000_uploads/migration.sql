CREATE TABLE "Upload" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "machineryId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Upload_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "Upload_userId_machineryId_idx" ON "Upload"("userId", "machineryId");
ALTER TABLE "Upload" ADD CONSTRAINT "Upload_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Upload" ADD CONSTRAINT "Upload_machineryId_fkey" FOREIGN KEY ("machineryId") REFERENCES "Machinery"("id") ON DELETE SET NULL ON UPDATE CASCADE;
