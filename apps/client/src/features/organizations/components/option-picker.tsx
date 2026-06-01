import { Check } from "lucide-react"

export const OptionPicker = ({
  label,
  options,
  value,
  helperText,
  onChange,
}: {
  label: string
  options: Array<{ value: string; label: string }>
  value: string[] | null
  helperText?: string
  onChange: (value: string[]) => void
}) => {
  const selectedValues = value ?? []

  return (
    <fieldset className="grid gap-3">
      <div className="grid gap-1 text-center">
        <legend className="text-sm font-semibold uppercase tracking-wide text-slate-600">
          {label}
        </legend>
        {helperText ? (
          <p className="text-sm leading-6 text-slate-500">{helperText}</p>
        ) : null}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {options.map((option) => {
          const selected = selectedValues.includes(option.value)

          return (
            <button
              key={option.value}
              className={`flex min-h-14 items-center justify-between rounded-md border px-4 py-3 text-left text-sm font-semibold transition ${
                selected
                  ? "border-blue-600 bg-blue-50 text-blue-800 ring-3 ring-blue-100"
                  : "border-slate-200 bg-white text-slate-700 hover:border-blue-300 hover:bg-blue-50/40"
              }`}
              type="button"
              onClick={() =>
                onChange(
                  selected
                    ? selectedValues.filter((value) => value !== option.value)
                    : [...selectedValues, option.value]
                )
              }
            >
              {option.label}
              {selected ? <Check className="size-4" /> : null}
            </button>
          )
        })}
      </div>
    </fieldset>
  )
}
