CREATE TABLE "organization_invitations" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "invited_by_user_id" TEXT NOT NULL,
    "accepted_by_user_id" TEXT,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "accepted_at" TIMESTAMP(3),
    "canceled_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organization_invitations_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "organization_invitations_token_hash_key"
ON "organization_invitations"("token_hash");

CREATE INDEX "idx_organization_invitations_organization_id"
ON "organization_invitations"("organization_id");

CREATE INDEX "idx_organization_invitations_email"
ON "organization_invitations"("email");

ALTER TABLE "organization_invitations" ADD CONSTRAINT "organization_invitations_organization_id_fkey"
FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "organization_invitations" ADD CONSTRAINT "organization_invitations_invited_by_user_id_fkey"
FOREIGN KEY ("invited_by_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "organization_invitations" ADD CONSTRAINT "organization_invitations_accepted_by_user_id_fkey"
FOREIGN KEY ("accepted_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
