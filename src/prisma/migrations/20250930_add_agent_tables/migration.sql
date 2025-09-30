-- CreateTable
CREATE TABLE "agent_sessions" (
    "session_id" VARCHAR NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "agent_sessions_pkey" PRIMARY KEY ("session_id")
);

-- CreateTable
CREATE TABLE "agent_messages" (
    "id" SERIAL NOT NULL,
    "session_id" VARCHAR NOT NULL,
    "message_data" TEXT NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "agent_messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_agent_messages_session_time" ON "agent_messages"("session_id", "created_at");

-- AddForeignKey
ALTER TABLE "agent_messages"
ADD CONSTRAINT "agent_messages_session_id_fkey"
FOREIGN KEY ("session_id") REFERENCES "agent_sessions"("session_id")
ON DELETE CASCADE ON UPDATE NO ACTION;