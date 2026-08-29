import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Creando tablas de analítica de forma segura y aditiva...");

  const queries = [
    `CREATE TABLE IF NOT EXISTS "AnalyticsExcludedIp" (
        "id" SERIAL NOT NULL,
        "ipHash" TEXT NOT NULL,
        "reason" TEXT NOT NULL DEFAULT 'admin_login',
        "firstDetectedAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "lastDetectedAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "AnalyticsExcludedIp_pkey" PRIMARY KEY ("id")
    );`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "AnalyticsExcludedIp_ipHash_key" ON "AnalyticsExcludedIp"("ipHash");`,
    `CREATE TABLE IF NOT EXISTS "AnalyticsVisitor" (
        "id" TEXT NOT NULL,
        "firstSeenAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "lastSeenAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "deviceType" TEXT,
        "os" TEXT,
        "browser" TEXT,
        "screenWidth" INTEGER,
        "screenHeight" INTEGER,
        "language" TEXT,
        "country" TEXT,
        "countryCode" TEXT,
        "region" TEXT,
        "city" TEXT,
        "isExcluded" BOOLEAN NOT NULL DEFAULT false,
        "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "AnalyticsVisitor_pkey" PRIMARY KEY ("id")
    );`,
    `CREATE TABLE IF NOT EXISTS "AnalyticsSession" (
        "id" TEXT NOT NULL,
        "visitorId" TEXT NOT NULL,
        "startedAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "lastActiveAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "durationSeconds" INTEGER NOT NULL DEFAULT 0,
        "ipHash" TEXT,
        "referrer" TEXT,
        "referrerHost" TEXT,
        "entryPage" TEXT,
        "exitPage" TEXT,
        "utmSource" TEXT,
        "utmMedium" TEXT,
        "utmCampaign" TEXT,
        "utmTerm" TEXT,
        "utmContent" TEXT,
        "country" TEXT,
        "countryCode" TEXT,
        "region" TEXT,
        "city" TEXT,
        "isExcluded" BOOLEAN NOT NULL DEFAULT false,
        "excludedReason" TEXT,
        "excludedAt" TIMESTAMP(6),
        CONSTRAINT "AnalyticsSession_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "AnalyticsSession_visitorId_fkey" FOREIGN KEY ("visitorId") REFERENCES "AnalyticsVisitor"("id") ON DELETE CASCADE ON UPDATE CASCADE
    );`,
    `CREATE INDEX IF NOT EXISTS "AnalyticsSession_ipHash_idx" ON "AnalyticsSession"("ipHash");`,
    `CREATE INDEX IF NOT EXISTS "AnalyticsSession_isExcluded_idx" ON "AnalyticsSession"("isExcluded");`,
    `CREATE TABLE IF NOT EXISTS "AnalyticsPageView" (
        "id" SERIAL NOT NULL,
        "visitorId" TEXT NOT NULL,
        "sessionId" TEXT NOT NULL,
        "url" TEXT NOT NULL,
        "pathname" TEXT NOT NULL,
        "title" TEXT,
        "referrer" TEXT,
        "isExcluded" BOOLEAN NOT NULL DEFAULT false,
        "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "AnalyticsPageView_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "AnalyticsPageView_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "AnalyticsSession"("id") ON DELETE CASCADE ON UPDATE CASCADE
    );`,
    `CREATE INDEX IF NOT EXISTS "AnalyticsPageView_sessionId_idx" ON "AnalyticsPageView"("sessionId");`,
    `CREATE INDEX IF NOT EXISTS "AnalyticsPageView_isExcluded_idx" ON "AnalyticsPageView"("isExcluded");`,
    `CREATE TABLE IF NOT EXISTS "AnalyticsEvent" (
        "id" SERIAL NOT NULL,
        "visitorId" TEXT NOT NULL,
        "sessionId" TEXT NOT NULL,
        "eventName" TEXT NOT NULL,
        "pathname" TEXT,
        "metadata" JSONB,
        "isExcluded" BOOLEAN NOT NULL DEFAULT false,
        "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "AnalyticsEvent_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "AnalyticsEvent_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "AnalyticsSession"("id") ON DELETE CASCADE ON UPDATE CASCADE
    );`,
    `CREATE INDEX IF NOT EXISTS "AnalyticsEvent_sessionId_idx" ON "AnalyticsEvent"("sessionId");`,
    `CREATE INDEX IF NOT EXISTS "AnalyticsEvent_eventName_idx" ON "AnalyticsEvent"("eventName");`,
    `CREATE INDEX IF NOT EXISTS "AnalyticsEvent_isExcluded_idx" ON "AnalyticsEvent"("isExcluded");`
  ];

  for (const q of queries) {
    await prisma.$executeRawUnsafe(q);
  }

  console.log("¡Tablas de analítica creadas exitosamente sin afectar ninguna tabla existente!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
