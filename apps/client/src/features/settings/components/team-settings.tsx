import {
  organizationInvitationInputSchema,
  type AuthUser,
  type OrganizationMembershipRole,
  type OrganizationSummary,
} from "@plyco/shared"
import { usePostHog } from "@posthog/react"
import { MoreHorizontal, Trash2 } from "lucide-react"
import { useMemo, useState, type FormEvent } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  useCancelOrganizationInvitation,
  useDeleteOrganization,
  useInviteOrganizationMember,
  useOrganizationInvitations,
  useOrganizationMembers,
  useRemoveOrganizationMember,
  useUpdateOrganizationMemberRole,
} from "@/features/settings/hooks/use-team"
import { POSTHOG_EVENTS } from "@/lib/posthog-events"

export const TeamSettings = ({
  organization,
  user,
}: {
  organization: OrganizationSummary
  user: AuthUser
}) => {
  const posthog = usePostHog()
  const isOwner = organization.role === "owner"
  const members = useOrganizationMembers(organization.id)
  const invitations = useOrganizationInvitations(organization.id, isOwner)
  const inviteMember = useInviteOrganizationMember(organization.id)
  const updateRole = useUpdateOrganizationMemberRole(organization.id)
  const removeMember = useRemoveOrganizationMember(organization.id)
  const cancelInvitation = useCancelOrganizationInvitation(organization.id)
  const deleteOrganization = useDeleteOrganization(organization.id)
  const [email, setEmail] = useState("")
  const [role, setRole] = useState<OrganizationMembershipRole>("member")
  const [inviteError, setInviteError] = useState<string | null>(null)
  const [isInvitePanelOpen, setIsInvitePanelOpen] = useState(false)
  const [isDeletePanelOpen, setIsDeletePanelOpen] = useState(false)
  const [deleteConfirmation, setDeleteConfirmation] = useState("")
  const activeMembers = useMemo(() => members.data ?? [], [members.data])
  const pendingInvites = useMemo(
    () => invitations.data ?? [],
    [invitations.data]
  )
  const ownerCount = useMemo(
    () => activeMembers.filter((member) => member.role === "owner").length,
    [activeMembers]
  )

  const handleInvite = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const parsed = organizationInvitationInputSchema.safeParse({ email, role })

    if (!parsed.success) {
      setInviteError("Enter a valid email address.")
      return
    }

    setInviteError(null)
    inviteMember.mutate(parsed.data, {
      onSuccess: () => {
        posthog.capture(POSTHOG_EVENTS.TEAM_INVITATION_SENT, {
          role: parsed.data.role,
        })
        setEmail("")
        setRole("member")
      },
    })
  }

  const canDeleteOrganization = deleteConfirmation === organization.name

  return (
    <div className="grid gap-6">
      <section className="grid gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-950">Team</h2>
            <p className="mt-1 text-sm text-slate-500">
              Members can edit workspace data. Owners can manage members and
              delete the organization.
            </p>
          </div>
          {isOwner && !isInvitePanelOpen ? (
            <Button
              className="w-fit shrink-0"
              type="button"
              onClick={() => setIsInvitePanelOpen(true)}
            >
              Invite
            </Button>
          ) : null}
        </div>

        {isOwner && isInvitePanelOpen ? (
          <form
            className="grid gap-3 border border-slate-200 bg-white p-4 md:grid-cols-[minmax(0,1fr)_10rem_auto]"
            onSubmit={handleInvite}
          >
            <label className="grid gap-2 text-sm font-medium text-slate-800">
              <span>Email</span>
              <Input
                type="email"
                value={email}
                placeholder="teammate@example.com"
                onChange={(event) => setEmail(event.target.value)}
              />
              {inviteError ? (
                <span className="text-xs text-red-700">{inviteError}</span>
              ) : null}
            </label>
            <label className="grid gap-2 text-sm font-medium text-slate-800">
              <span>Role</span>
              <select
                className="field-focus h-11 rounded-sm border border-slate-300 bg-white px-4 py-2.5 text-sm font-normal text-slate-900 outline-none"
                value={role}
                onChange={(event) =>
                  setRole(event.target.value as OrganizationMembershipRole)
                }
              >
                <option value="member">Member</option>
                <option value="owner">Owner</option>
              </select>
            </label>
            <div className="flex items-end">
              <div className="flex gap-2">
                <Button disabled={inviteMember.isPending} type="submit">
                  Send
                </Button>
                <Button
                  disabled={inviteMember.isPending}
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setInviteError(null)
                    setIsInvitePanelOpen(false)
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </form>
        ) : null}

        <div className="overflow-hidden border border-slate-200 bg-white">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                {isOwner ? (
                  <TableHead className="text-right">Actions</TableHead>
                ) : null}
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.isLoading ? (
                <TableRow>
                  <TableCell
                    className="text-slate-500"
                    colSpan={isOwner ? 4 : 3}
                  >
                    Loading team members...
                  </TableCell>
                </TableRow>
              ) : activeMembers.length === 0 ? (
                <TableRow>
                  <TableCell
                    className="text-slate-500"
                    colSpan={isOwner ? 4 : 3}
                  >
                    No members found.
                  </TableCell>
                </TableRow>
              ) : (
                activeMembers.map((member) => {
                  const isLastOwner = member.role === "owner" && ownerCount <= 1
                  const isCurrentUser = member.userId === user.id

                  return (
                    <TableRow key={member.userId}>
                      <TableCell className="font-medium text-slate-900">
                        {member.name}
                        {isCurrentUser ? (
                          <span className="ml-2 text-xs font-normal text-slate-500">
                            You
                          </span>
                        ) : null}
                      </TableCell>
                      <TableCell className="text-slate-600">
                        {member.email}
                      </TableCell>
                      <TableCell>
                        <RoleBadge role={member.role} />
                      </TableCell>
                      {isOwner ? (
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                aria-label={`Manage ${member.name}`}
                                size="icon-sm"
                                type="button"
                                variant="ghost"
                              >
                                <MoreHorizontal className="size-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                disabled={member.role === "member"}
                                onSelect={() =>
                                  updateRole.mutate(
                                    {
                                      userId: member.userId,
                                      input: { role: "member" },
                                    },
                                    {
                                      onSuccess: () =>
                                        posthog.capture(
                                          POSTHOG_EVENTS.TEAM_MEMBER_ROLE_UPDATED,
                                          {
                                            role: "member",
                                          }
                                        ),
                                    }
                                  )
                                }
                              >
                                Make member
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                disabled={member.role === "owner"}
                                onSelect={() =>
                                  updateRole.mutate(
                                    {
                                      userId: member.userId,
                                      input: { role: "owner" },
                                    },
                                    {
                                      onSuccess: () =>
                                        posthog.capture(
                                          POSTHOG_EVENTS.TEAM_MEMBER_ROLE_UPDATED,
                                          {
                                            role: "owner",
                                          }
                                        ),
                                    }
                                  )
                                }
                              >
                                Make owner
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                disabled={isLastOwner}
                                variant="destructive"
                                onSelect={() =>
                                  removeMember.mutate(member.userId, {
                                    onSuccess: () =>
                                      posthog.capture(
                                        POSTHOG_EVENTS.TEAM_MEMBER_REMOVED,
                                        {
                                          previous_role: member.role,
                                        }
                                      ),
                                  })
                                }
                              >
                                Remove member
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      ) : null}
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>
      </section>

      {isOwner ? (
        <section className="grid gap-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-950">
              Pending invitations
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Invitations expire after 30 days.
            </p>
          </div>
          <div className="overflow-hidden border border-slate-200 bg-white">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Invited by</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invitations.isLoading ? (
                  <TableRow>
                    <TableCell className="text-slate-500" colSpan={5}>
                      Loading invitations...
                    </TableCell>
                  </TableRow>
                ) : pendingInvites.length === 0 ? (
                  <TableRow>
                    <TableCell className="text-slate-500" colSpan={5}>
                      No pending invitations.
                    </TableCell>
                  </TableRow>
                ) : (
                  pendingInvites.map((invitation) => (
                    <TableRow key={invitation.id}>
                      <TableCell className="font-medium text-slate-900">
                        {invitation.email}
                      </TableCell>
                      <TableCell>
                        <RoleBadge role={invitation.role} />
                      </TableCell>
                      <TableCell className="text-slate-600">
                        {invitation.invitedByName}
                      </TableCell>
                      <TableCell className="text-slate-600">
                        {new Date(invitation.expiresAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          type="button"
                          variant="ghost"
                          onClick={() =>
                            cancelInvitation.mutate(invitation.id, {
                              onSuccess: () =>
                                posthog.capture(
                                  POSTHOG_EVENTS.TEAM_INVITATION_CANCELED,
                                  {
                                    role: invitation.role,
                                  }
                                ),
                            })
                          }
                        >
                          Cancel
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </section>
      ) : null}

      {isOwner ? (
        <section className="grid gap-4 border-t border-slate-200 pt-6">
          <div>
            <h2 className="text-lg font-semibold text-slate-950">
              Danger Zone
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Destructive organization actions are hidden until you choose to
              reveal them.
            </p>
          </div>
          {!isDeletePanelOpen ? (
            <Button
              className="w-fit"
              type="button"
              variant="destructive"
              onClick={() => setIsDeletePanelOpen(true)}
            >
              <Trash2 />
              Delete Organization
            </Button>
          ) : (
            <div className="grid gap-4 border border-red-200 bg-white p-4">
              <div>
                <h3 className="text-lg font-semibold text-red-800">
                  Delete organization
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  This permanently removes the organization, workspace data,
                  members, and pending invitations.
                </p>
              </div>
              <label className="grid max-w-md gap-2 text-sm font-medium text-slate-800">
                <span>Type {organization.name} to confirm</span>
                <Input
                  value={deleteConfirmation}
                  onChange={(event) =>
                    setDeleteConfirmation(event.target.value)
                  }
                />
              </label>
              <div className="flex gap-2">
                <Button
                  className="w-fit"
                  disabled={
                    !canDeleteOrganization || deleteOrganization.isPending
                  }
                  type="button"
                  variant="destructive"
                  onClick={() =>
                    deleteOrganization.mutate(undefined, {
                      onSuccess: () =>
                        posthog.capture(POSTHOG_EVENTS.ORGANIZATION_DELETED),
                    })
                  }
                >
                  <Trash2 />
                  Delete organization
                </Button>
                <Button
                  disabled={deleteOrganization.isPending}
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setDeleteConfirmation("")
                    setIsDeletePanelOpen(false)
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </section>
      ) : null}
    </div>
  )
}

const RoleBadge = ({ role }: { role: OrganizationMembershipRole }) => (
  <Badge variant={role === "owner" ? "info" : "outline"}>
    {role === "owner" ? "Owner" : "Member"}
  </Badge>
)
