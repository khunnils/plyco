ALTER TABLE "users" ALTER COLUMN "google_subject" DROP NOT NULL;

CREATE TABLE "magic_link_tokens" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "used_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "magic_link_tokens_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "magic_link_tokens_token_hash_key" ON "magic_link_tokens"("token_hash");
CREATE INDEX "idx_magic_link_tokens_email" ON "magic_link_tokens"("email");
