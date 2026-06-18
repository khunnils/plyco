import { describe, expect, it } from "vitest"

import { InMemoryAccountRepository } from "../src/features/accounts/in-memory-repository.js"
import { ApiError } from "../src/infrastructure/errors.js"

const expiresAt = () => new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)

describe("account repository invitations", () => {
  it("creates and accepts an organization invitation", async () => {
    const repository = new InMemoryAccountRepository()
    const owner = await repository.upsertUser({
      googleSubject: "owner-google",
      email: "owner@example.com",
      name: "Owner",
    })
    const member = await repository.upsertUser({
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
    const owner = await repository.upsertUser({
      googleSubject: "owner-google",
      email: "owner@example.com",
      name: "Owner",
    })
    const invited = await repository.upsertUser({
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
    const owner = await repository.upsertUser({
      googleSubject: "owner-google",
      email: "owner@example.com",
      name: "Owner",
    })
    const member = await repository.upsertUser({
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
})
