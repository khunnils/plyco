import { Check, ChevronDown, Plus } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { useSelectedOrganization } from "@/features/organizations/hooks/use-selected-organization"
import { useCurrentOrganizationStore } from "@/features/organizations/stores/current-organization-store"

export const OrganizationSwitcher = () => {
  const navigate = useNavigate()
  const { organizations, selectedOrganization } = useSelectedOrganization()
  const selectOrganization = useCurrentOrganizationStore(
    (state) => state.selectOrganization
  )
  const selectedOrganizationId = selectedOrganization?.id ?? ""
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) {
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
      }
    }

    document.addEventListener("pointerdown", handlePointerDown)
    document.addEventListener("keydown", handleKeyDown)

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown)
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [open])

  const handleSelectOrganization = (organizationId: string) => {
    selectOrganization(organizationId)
    setOpen(false)
  }

  if (!selectedOrganization) {
    return null
  }

  return (
    <div ref={containerRef} className="relative">
      <Button
        className="h-auto w-full justify-between gap-2 py-2 text-left text-slate-600 hover:bg-slate-50"
        type="button"
        variant="ghost"
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => {
          setOpen((current) => !current)
        }}
      >
        <span className="flex min-w-0 items-center">
          <span className="grid min-w-0 gap-0.5">
            <span className="truncate text-sm font-semibold">
              {selectedOrganization?.name}
            </span>
            <span className="text-xs font-medium">All workspace data</span>
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
                  navigate("/onboarding/organization/identity")
                }}
              >
                <Plus />
                Create organization
              </Button>
            </div>
          </>
        </div>
      )}
    </div>
  )
}
