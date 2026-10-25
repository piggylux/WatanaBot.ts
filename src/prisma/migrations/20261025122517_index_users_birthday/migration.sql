-- DropIndex
DROP INDEX "users_userId_birthdayDay_birthdayMonth_idx";

-- CreateIndex
CREATE INDEX "users_birthdayMonth_birthdayDay_idx" ON "users"("birthdayMonth", "birthdayDay");
