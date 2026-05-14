import { Building2, Loader2, LogOut, Plus } from "lucide-react"
import { type AuthUser } from "@complyflow/shared"
import { useState, type FormEvent, type ReactNode } from "react"

import { Button } from "@/components/ui/button"
import { useCreateOrganization } from "@/features/organizations/hooks/use-organizations"
import { useCurrentOrganizationStore } from "@/features/organizations/stores/current-organization-store"

export const CreateOrganizationPanel = ({
  actions,
  className = "",
  error,
  isSubmitting,
  user,
  onCreate,
}: {
  actions?: ReactNode
  className?: string
  error: string | null
  isSubmitting: boolean
  user: AuthUser
  onCreate: (name: string) => void
}) => {
  const [name, setName] = useState("")

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    onCreate(name)
  }

  return (
    <section className={className}>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <div className="mb-4 flex size-10 items-center justify-center rounded-md bg-blue-50 text-blue-700">
            <Building2 className="size-5" />
          </div>
          <p className="text-sm font-semibold text-blue-700">ComplyFlow</p>
          <h1 className="mt-2 text-2xl font-semibold text-slate-950">
            Create an organization
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Start a workspace for the company whose security snapshot you want
            to manage.
          </p>
        </div>
        {actions}
      </div>

      <form className="grid gap-4" onSubmit={handleSubmit}>
        <label className="grid gap-1">
          <span className="text-sm font-medium text-slate-700">
            Organization name
          </span>
          <input
            className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 transition outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </label>
        {error && (
          <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-800">
            {error}
          </p>
        )}
        <div className="flex items-center justify-between gap-3">
          <div className="text-sm text-slate-500">
            Signed in as {user.email}
          </div>
          <Button disabled={isSubmitting} type="submit">
            {isSubmitting ? <Loader2 /> : <Plus />}
            Create organization
          </Button>
        </div>
      </form>
    </section>
  )
}

export const CreateOrganizationScreen = ({
  user,
  onLogout,
}: {
  user: AuthUser
  onLogout: () => void
}) => {
  const createOrganization = useCreateOrganization()
  const error = createOrganization.error?.message ?? null

  return (
    <main className="min-h-svh bg-slate-50 px-4 py-6 text-slate-900 md:px-8">
      <div className="mx-auto grid min-h-[calc(100svh-3rem)] max-w-xl content-center">
        <CreateOrganizationPanel
          className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
          error={error}
          isSubmitting={createOrganization.isPending}
          user={user}
          onCreate={(name) =>
            createOrganization.mutate(
              { name },
              {
                onSuccess: (organization) => {
                  const store = useCurrentOrganizationStore.getState()
                  store.selectOrganization(organization.id)
                  store.markOnboarding(organization.id)
                },
              }
            )
          }
          actions={
            <Button type="button" variant="outline" onClick={onLogout}>
              <LogOut />
              Logout
            </Button>
          }
        />
      </div>
    </main>
  )
}
