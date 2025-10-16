-- CreateTable
CREATE TABLE "RecurrencePattern" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "frequency" TEXT NOT NULL,
    "frequencyValue" INTEGER NOT NULL,
    "durationMinutes" INTEGER NOT NULL,
    "timePreferences" JSONB NOT NULL,
    "dayPreferences" JSONB NOT NULL,
    "nthWeekdayConfig" JSONB,
    "yearlyConfig" JSONB,
    "yearlyNthWeekday" JSONB,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecurrencePattern_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Event" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "startTime" TIMESTAMP(3),
    "durationMinutes" INTEGER NOT NULL,
    "parentEventId" TEXT,
    "patternId" TEXT,
    "periodKey" TEXT,
    "category" TEXT NOT NULL DEFAULT 'general',
    "isTimeBound" BOOLEAN NOT NULL DEFAULT false,
    "deadline" TIMESTAMP(3),
    "notes" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RecurrencePattern_active_idx" ON "RecurrencePattern"("active");

-- CreateIndex
CREATE INDEX "Event_startTime_idx" ON "Event"("startTime");

-- CreateIndex
CREATE INDEX "Event_patternId_periodKey_idx" ON "Event"("patternId", "periodKey");

-- CreateIndex
CREATE INDEX "Event_parentEventId_idx" ON "Event"("parentEventId");

-- CreateIndex
CREATE INDEX "Event_isTimeBound_deadline_idx" ON "Event"("isTimeBound", "deadline");

-- CreateIndex
CREATE INDEX "Event_startTime_patternId_idx" ON "Event"("startTime", "patternId");

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_parentEventId_fkey" FOREIGN KEY ("parentEventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_patternId_fkey" FOREIGN KEY ("patternId") REFERENCES "RecurrencePattern"("id") ON DELETE SET NULL ON UPDATE CASCADE;
