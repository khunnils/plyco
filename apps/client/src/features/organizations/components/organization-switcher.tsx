import { Building2, Check, ChevronDown, Plus, X } from "lucide-react"
import { type AuthUser } from "@plyco/shared"
import { useEffect, useRef, useState } from "react"

import { Button } from "@/components/ui/button"
import { CreateOrganizationPanel } from "@/features/organizations/components/create-organization-screen"
import { useCreateOrganization } from "@/features/organizations/hooks/use-organizations"
import { useSelectedOrganization } from "@/features/organizations/hooks/use-selected-organization"
import { useCurrentOrganizationStore } from "@/features/organizations/stores/current-organization-store"

export const OrganizationSwitcher = ({ user }: { user: AuthUser }) => {
  const { organizations, selectedOrganization } = useSelectedOrganization()
  const selectOrganization = useCurrentOrganizationStore(
    (state) => state.selectOrganization
  )
  const markOnboarding = useCurrentOrganizationStore(
    (state) => state.markOnboarding
  )
  const createOrganization = useCreateOrganization()
  const createError = createOrganization.error?.message ?? null
  const selectedOrganizationId = selectedOrganization?.id ?? ""
  const [open, setOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open && !creating) {
      return
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (open && !containerRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false)
        setCreating(false)
      }
    }

    document.addEventListener("pointerdown", handlePointerDown)
    document.addEventListener("keydown", handleKeyDown)

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown)
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [creating, open])

  const handleSelectOrganization = (organizationId: string) => {
    selectOrganization(organizationId)
    setOpen(false)
  }

  const handleCreateOrganization = (name: string) => {
    createOrganization.mutate(
      { name },
      {
        onSuccess: (organization) => {
          selectOrganization(organization.id)
          markOnboarding(organization.id)
          setCreating(false)
        },
      }
    )
  }

  if (!selectedOrganization) {
    return null
  }

  return (
    <div ref={containerRef} className="relative">
      <Button
        className="h-auto w-full gap-2 py-2 justify-between text-left text-slate-600 hover:bg-slate-50"
        type="button"
        variant="ghost"
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => {
          setOpen((current) => !current)
        }}
      >
        <span className="flex min-w-0 items-center gap-3">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-slate-50">
            <Building2 className="size-4" />
          </span>
          <span className="grid min-w-0 gap-0.5">
            <span className="truncate text-sm font-semibold">
              {selectedOrganization?.name}
            </span>
            <span className="text-xs font-medium">
              All workspace data
            </span>
          </span>
        </span>
        <ChevronDown className="size-4 shrink-0" />
      </Button>

      {open && (
        <div
          className="absolute top-[calc(100%+0.5rem)] left-0 z-50 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xl"
          role="dialog"
          aria-label="Organization switcher"
        >
          <>
            <div className="border-b border-slate-100 px-4 py-3 text-center text-sm font-semibold text-slate-900">
              Organizations ({organizations.length})
            </div>
            <div className="grid gap-1 p-3">
              {organizations.map((organization) => {
                const selected = organization.id === selectedOrganizationId

                return (
                  <button
                    key={organization.id}
                    className={
                      selected
                        ? "flex min-h-11 items-center justify-between gap-3 rounded-md bg-blue-50 px-3 text-left text-sm font-semibold text-blue-700"
                        : "flex min-h-11 items-center justify-between gap-3 rounded-md px-3 text-left text-sm font-semibold text-slate-800 hover:bg-slate-50"
                    }
                    type="button"
                    onClick={() => handleSelectOrganization(organization.id)}
                  >
                    <span className="truncate">{organization.name}</span>
                    {selected && <Check className="size-4 shrink-0" />}
                  </button>
                )
              })}
            </div>
            <div className="border-t border-slate-200 bg-slate-50 p-3">
              <Button
                className="w-full"
                type="button"
                variant="ghost"
                onClick={() => {
                  setOpen(false)
                  setCreating(true)
                }}
              >
                <Plus />
                Create organization
              </Button>
            </div>
          </>
        </div>
      )}

      {creating && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-slate-950/30 px-4 py-6"
          role="dialog"
          aria-modal="true"
          aria-label="Create organization"
        >
          <div className="w-full max-w-xl">
            <CreateOrganizationPanel
              className="rounded-lg border border-slate-200 bg-white p-6 shadow-xl"
              error={createError}
              isSubmitting={createOrganization.isPending}
              user={user}
              onCreate={handleCreateOrganization}
              actions={
                <Button
                  type="button"
                  size="icon-sm"
                  variant="outline"
                  aria-label="Close create organization"
                  onClick={() => setCreating(false)}
                >
                  <X />
                </Button>
              }
            />
          </div>
        </div>
      )}
    </div>
  )
}
