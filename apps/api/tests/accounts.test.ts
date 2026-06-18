import { describe, expect, it } from "vitest"

import { InMemoryAccountRepository } from "../src/features/accounts/in-memory-repository.js"
import { ApiError } from "../src/infrastructure/errors.js"

const expiresAt = () => new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)

describe("account repository invitations", () => {
  it("creates and accepts an organization invitation", async () => {
    const repository = new InMemoryAccountRepository()
    const owner = await repository.upsertGoogleUser({
      googleSubject: "owner-google",
      email: "owner@example.com",
      name: "Owner",
    })
    const member = await repository.upsertGoogleUser({
      googleSubject: "member-google",
      email: "teammate@example.com",
      name: "Teammate",
    })
    const organization = await repository.createOrganization(owner.id, {
      name: "Acme AI",
    })

    const invitation = await repository.createOrganizationInvitation({
      organizationId: organization.id,
      invitedByUserId: owner.id,
      invitation: { email: "teammate@example.com", role: "member" },
      tokenHash: "token-hash",
      expiresAt: expiresAt(),
    })

    expect(invitation.email).toBe("teammate@example.com")
    expect(await repository.listOrganizationInvitations(organization.id)).toHaveLength(1)

    const accepted = await repository.acceptOrganizationInvitation({
      tokenHash: "token-hash",
      userId: member.id,
      email: member.email,
      now: new Date(),
    })

    expect(accepted).toMatchObject({ id: organization.id, role: "member" })
    await expect(
      repository.acceptOrganizationInvitation({
        tokenHash: "token-hash",
        userId: member.id,
        email: member.email,
        now: new Date(),
      }),
    ).resolves.toMatchObject({ id: organization.id, role: "member" })
    expect(await repository.listOrganizationInvitations(organization.id)).toHaveLength(0)
    expect(await repository.getMembershipRole(member.id, organization.id)).toBe(
      "member",
    )
  })

  it("rejects duplicate pending invitations and wrong acceptance email", async () => {
    const repository = new InMemoryAccountRepository()
    const owner = await repository.upsertGoogleUser({
      googleSubject: "owner-google",
      email: "owner@example.com",
      name: "Owner",
    })
    const invited = await repository.upsertGoogleUser({
      googleSubject: "invited-google",
      email: "wrong@example.com",
      name: "Wrong Person",
    })
    const organization = await repository.createOrganization(owner.id, {
      name: "Acme AI",
    })

    await repository.createOrganizationInvitation({
      organizationId: organization.id,
      invitedByUserId: owner.id,
      invitation: { email: "teammate@example.com", role: "owner" },
      tokenHash: "token-hash",
      expiresAt: expiresAt(),
    })

    await expect(
      repository.createOrganizationInvitation({
        organizationId: organization.id,
        invitedByUserId: owner.id,
        invitation: { email: "teammate@example.com", role: "member" },
        tokenHash: "other-token-hash",
        expiresAt: expiresAt(),
      }),
    ).rejects.toMatchObject({
      code: "ORGANIZATION_INVITATION_ALREADY_EXISTS",
    })

    await expect(
      repository.acceptOrganizationInvitation({
        tokenHash: "token-hash",
        userId: invited.id,
        email: invited.email,
        now: new Date(),
      }),
    ).rejects.toMatchObject({
      code: "ORGANIZATION_INVITATION_EMAIL_MISMATCH",
    })
  })

  it("protects the last owner and deletes organizations", async () => {
    const repository = new InMemoryAccountRepository()
    const owner = await repository.upsertGoogleUser({
      googleSubject: "owner-google",
      email: "owner@example.com",
      name: "Owner",
    })
    const member = await repository.upsertGoogleUser({
      googleSubject: "member-google",
      email: "member@example.com",
      name: "Member",
    })
    const organization = await repository.createOrganization(owner.id, {
      name: "Acme AI",
    })
    repository.addMembership(member.id, organization, "member")

    await expect(
      repository.updateOrganizationMemberRole(organization.id, owner.id, {
        role: "member",
      }),
    ).rejects.toBeInstanceOf(ApiError)
    await expect(
      repository.removeOrganizationMember(organization.id, owner.id),
    ).rejects.toMatchObject({ code: "ORGANIZATION_REQUIRES_OWNER" })

    await repository.updateOrganizationMemberRole(organization.id, member.id, {
      role: "owner",
    })
    await expect(
      repository.removeOrganizationMember(organization.id, owner.id),
    ).resolves.toBe(true)

    await expect(repository.deleteOrganization(organization.id)).resolves.toBe(
      true,
    )
    await expect(repository.deleteOrganization(organization.id)).resolves.toBe(
      false,
    )
    expect(await repository.getMembershipRole(member.id, organization.id)).toBeNull()
  })

  it("creates users from magic links and merges later Google login by email", async () => {
    const repository = new InMemoryAccountRepository()
    await repository.createMagicLinkToken({
      email: "founder@example.com",
      tokenHash: "token-hash",
      expiresAt: expiresAt(),
    })

    const emailUser = await repository.consumeMagicLinkToken({
      tokenHash: "token-hash",
      now: new Date(),
    })
    const googleUser = await repository.upsertGoogleUser({
      googleSubject: "founder-google",
      email: "Founder@Example.com",
      name: "Founder",
      picture: "https://example.com/avatar.png",
    })

    expect(googleUser).toMatchObject({
      id: emailUser.id,
      email: "founder@example.com",
      name: "Founder",
    })
  })

  it("merges magic-link login into an existing Google user by email", async () => {
    const repository = new InMemoryAccountRepository()
    const googleUser = await repository.upsertGoogleUser({
      googleSubject: "founder-google",
      email: "founder@example.com",
      name: "Founder",
    })
    await repository.createMagicLinkToken({
      email: "Founder@Example.com",
      tokenHash: "token-hash",
      expiresAt: expiresAt(),
    })

    const emailUser = await repository.consumeMagicLinkToken({
      tokenHash: "token-hash",
      now: new Date(),
    })

    expect(emailUser.id).toBe(googleUser.id)
    expect(emailUser.name).toBe("Founder")
  })

  it("rejects reused and expired magic links", async () => {
    const repository = new InMemoryAccountRepository()
    await repository.createMagicLinkToken({
      email: "founder@example.com",
      tokenHash: "token-hash",
      expiresAt: expiresAt(),
    })

    await expect(
      repository.consumeMagicLinkToken({
        tokenHash: "token-hash",
        now: new Date(),
      }),
    ).resolves.toMatchObject({ email: "founder@example.com" })
    await expect(
      repository.consumeMagicLinkToken({
        tokenHash: "token-hash",
        now: new Date(),
      }),
    ).rejects.toMatchObject({ code: "MAGIC_LINK_INVALID" })

    await repository.createMagicLinkToken({
      email: "expired@example.com",
      tokenHash: "expired-token-hash",
      expiresAt: new Date(Date.now() - 1000),
    })
    await expect(
      repository.consumeMagicLinkToken({
        tokenHash: "expired-token-hash",
        now: new Date(),
      }),
    ).rejects.toMatchObject({ code: "MAGIC_LINK_INVALID" })
  })

  it("accepts invitations after magic-link login with the invited email", async () => {
    const repository = new InMemoryAccountRepository()
    const owner = await repository.upsertGoogleUser({
      googleSubject: "owner-google",
      email: "owner@example.com",
      name: "Owner",
    })
    const organization = await repository.createOrganization(owner.id, {
      name: "Acme AI",
    })
    await repository.createOrganizationInvitation({
      organizationId: organization.id,
      invitedByUserId: owner.id,
      invitation: { email: "teammate@example.com", role: "member" },
      tokenHash: "invite-token-hash",
      expiresAt: expiresAt(),
    })
    await repository.createMagicLinkToken({
      email: "Teammate@Example.com",
      tokenHash: "login-token-hash",
      expiresAt: expiresAt(),
    })

    const member = await repository.consumeMagicLinkToken({
      tokenHash: "login-token-hash",
      now: new Date(),
    })
    const accepted = await repository.acceptOrganizationInvitation({
      tokenHash: "invite-token-hash",
      userId: member.id,
      email: member.email,
      now: new Date(),
    })

    expect(accepted).toMatchObject({ id: organization.id, role: "member" })
  })
})
