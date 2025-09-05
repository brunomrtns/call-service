-- CreateEnum
CREATE TYPE "UserType" AS ENUM ('client', 'attendant', 'admin');

-- CreateEnum
CREATE TYPE "CallStatus" AS ENUM ('initiated', 'ringing', 'answered', 'busy', 'failed', 'ended', 'transferred', 'missed');

-- CreateEnum
CREATE TYPE "CallType" AS ENUM ('internal', 'external', 'conference', 'transfer');

-- CreateTable
CREATE TABLE "call_users" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "type" "UserType" NOT NULL DEFAULT 'client',
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "device" TEXT,
    "devicePassword" TEXT,
    "resetPasswordToken" TEXT,
    "resetPasswordExpires" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "call_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "call_history" (
    "id" TEXT NOT NULL,
    "callId" TEXT NOT NULL,
    "initiatorId" INTEGER NOT NULL,
    "receiverId" INTEGER NOT NULL,
    "initiatorDevice" TEXT NOT NULL,
    "receiverDevice" TEXT NOT NULL,
    "status" "CallStatus" NOT NULL DEFAULT 'initiated',
    "startTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endTime" TIMESTAMP(3),
    "duration" INTEGER,
    "callType" "CallType" NOT NULL DEFAULT 'internal',
    "transferredTo" TEXT,
    "transferredBy" TEXT,
    "recordingPath" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "call_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "call_users_username_key" ON "call_users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "call_users_email_key" ON "call_users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "call_users_device_key" ON "call_users"("device");

-- CreateIndex
CREATE UNIQUE INDEX "call_history_callId_key" ON "call_history"("callId");

-- AddForeignKey
ALTER TABLE "call_history" ADD CONSTRAINT "call_history_initiatorId_fkey" FOREIGN KEY ("initiatorId") REFERENCES "call_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "call_history" ADD CONSTRAINT "call_history_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "call_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
