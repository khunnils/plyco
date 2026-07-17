import { type OrganizationProvider } from "@plyco/shared"

import { Badge } from "@/components/ui/badge"

export const AddVendorsForm = ({
  selectedProviderIds,
  organizationProviders,
  checkedIds,
  onChange,
}: {
  selectedProviderIds: Set<string>
  organizationProviders: OrganizationProvider[]
  checkedIds: string[]
  onChange: (checkedIds: string[]) => void
}) => {
  const toggleProvider = (providerId: string, checked: boolean) => {
    onChange(
      checked
        ? [...checkedIds, providerId]
        : checkedIds.filter((currentId) => currentId !== providerId)
    )
  }

  return (
    <div className="grid gap-4 border border-slate-200 bg-slate-50 p-4">
      <div className="grid gap-2">
        {organizationProviders.map((provider) => {
          const disabled = selectedProviderIds.has(provider.id)

          return (
            <label
              className={[
                "flex min-h-11 items-center gap-3 border bg-white px-3 py-2 text-sm",
                disabled
                  ? "border-slate-200 text-slate-400"
                  : "border-slate-200 text-slate-800",
              ].join(" ")}
              key={provider.id}
            >
              <input
                checked={disabled || checkedIds.includes(provider.id)}
                className="field-checkbox-focus h-4 w-4 rounded border-slate-300 text-blue-600"
                disabled={disabled}
                type="checkbox"
                onChange={(event) =>
                  toggleProvider(provider.id, event.target.checked)
                }
              />
              <span className="min-w-0 flex-1 truncate">{provider.name}</span>
              {disabled ? <Badge variant="secondary">Selected</Badge> : null}
            </label>
          )
        })}
      </div>
    </div>
  )
}
