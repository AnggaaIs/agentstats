-- CreateTable
CREATE TABLE "legal_consents" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "userId" TEXT,
    "consentVersion" TEXT NOT NULL,
    "acceptedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "linkedAt" TIMESTAMP(3),

    CONSTRAINT "legal_consents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "legal_consents_token_key" ON "legal_consents"("token");

-- CreateIndex
CREATE INDEX "legal_consents_userId_acceptedAt_idx" ON "legal_consents"("userId", "acceptedAt");

-- CreateIndex
CREATE INDEX "legal_consents_consentVersion_acceptedAt_idx" ON "legal_consents"("consentVersion", "acceptedAt");

-- AddForeignKey
ALTER TABLE "legal_consents" ADD CONSTRAINT "legal_consents_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
