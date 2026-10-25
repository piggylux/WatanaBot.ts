-- CreateTable
CREATE TABLE "guilds" (
    "id" SERIAL NOT NULL,
    "guildId" TEXT NOT NULL,
    "birthdayChannelId" TEXT,
    "logsChannelId" TEXT,

    CONSTRAINT "guilds_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "guilds_guildId_key" ON "guilds"("guildId");

-- CreateIndex
CREATE UNIQUE INDEX "guilds_birthdayChannelId_key" ON "guilds"("birthdayChannelId");

-- CreateIndex
CREATE UNIQUE INDEX "guilds_logsChannelId_key" ON "guilds"("logsChannelId");
