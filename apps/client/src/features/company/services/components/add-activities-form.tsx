import { Badge } from "@/components/ui/badge"
import { type Option } from "@/features/vocabulary/lib/vocabulary"

export const AddActivitiesForm = ({
  checkedIds,
  options,
  selectedActivityIds,
  onChange,
}: {
  checkedIds: string[]
  options: Option[]
  selectedActivityIds: Set<string>
  onChange: (checkedIds: string[]) => void
}) => {
  const toggleActivity = (activityId: string, checked: boolean) => {
    onChange(
      checked
        ? [...checkedIds, activityId]
        : checkedIds.filter((currentId) => currentId !== activityId)
    )
  }

  return (
    <div className="grid gap-4 border border-slate-200 bg-white p-4">
      <div className="grid gap-2">
        {options.map((option) => {
          const disabled = selectedActivityIds.has(option.value)

          return (
            <label
              className={[
                "flex min-h-11 items-center gap-3 border bg-white px-3 py-2 text-sm",
                disabled
                  ? "border-slate-200 text-slate-400"
                  : "border-slate-200 text-slate-800",
              ].join(" ")}
              key={option.value}
            >
              <input
                checked={disabled || checkedIds.includes(option.value)}
                className="field-checkbox-focus h-4 w-4 rounded border-slate-300 text-blue-600"
                disabled={disabled}
                type="checkbox"
                onChange={(event) =>
                  toggleActivity(option.value, event.target.checked)
                }
              />
              <span className="min-w-0 flex-1 truncate">{option.label}</span>
              {disabled ? <Badge variant="secondary">Selected</Badge> : null}
            </label>
          )
        })}
      </div>
    </div>
  )
}
