import {
  Check,
  Globe,
  Flag,
  Euro,
  Shield,
  ShieldCheck,
  Landmark,
  Compass,
  Map,
  Scale,
} from "lucide-react"

const IconWrapper = ({
  name,
  className,
}: {
  name: string
  className?: string
}) => {
  switch (name) {
    case "globe":
      return <Globe className={className} />
    case "us":
    case "flag":
      return <Flag className={className} />
    case "eu":
    case "euro":
      return <Euro className={className} />
    case "uk":
    case "gb":
    case "landmark":
      return <Landmark className={className} />
    case "apac":
    case "compass":
      return <Compass className={className} />
    case "latam":
    case "map":
      return <Map className={className} />
    case "mea":
    case "scale":
      return <Scale className={className} />
    case "shield-check":
    case "shieldCheck":
      return <ShieldCheck className={className} />
    case "shield":
    default:
      return <Shield className={className} />
  }
}

export const OptionPicker = ({
  label,
  options,
  value,
  helperText,
  hideHeader,
  cols,
  isCompliance,
  onChange,
}: {
  label?: string
  options: Array<{
    value: string
    label: string
    description?: string
    icon?: string
  }>
  value: string[] | null
  helperText?: string
  hideHeader?: boolean
  cols?: number
  isCompliance?: boolean
  onChange: (value: string[]) => void
}) => {
  const selectedValues = value ?? []
  const gridColsClass =
    cols === 2
      ? "sm:grid-cols-2"
      : `sm:grid-cols-2 ${options.length >= 3 ? "lg:grid-cols-3" : ""}`

  return (
    <fieldset className="grid gap-4">
      {!hideHeader && label ? (
        <div className="grid gap-1 text-center">
          <legend className="text-sm font-semibold tracking-wide text-slate-600 uppercase">
            {label}
          </legend>
          {helperText ? (
            <p className="text-sm leading-6 text-slate-500">{helperText}</p>
          ) : null}
        </div>
      ) : null}
      <div className={`grid gap-4 ${gridColsClass}`}>
        {options.map((option) => {
          const selected = selectedValues.includes(option.value)
          const iconName = isCompliance
            ? selected
              ? "shield-check"
              : "shield"
            : option.icon
          const hasDetails = option.description || iconName

          if (hasDetails) {
            return (
              <button
                key={option.value}
                className={`relative flex flex-col items-center rounded-xl border p-6 text-center transition-all ${
                  selected
                    ? "border-slate-900 bg-slate-50 text-slate-900 ring-1 ring-slate-900"
                    : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50/10"
                }`}
                type="button"
                onClick={() =>
                  onChange(
                    selected
                      ? selectedValues.filter((v) => v !== option.value)
                      : [...selectedValues, option.value]
                  )
                }
              >
                {/* Select Badge in Top Right */}
                {selected && (
                  <div className="absolute top-3 right-3 flex size-5 items-center justify-center rounded-full bg-slate-900 text-white">
                    <Check className="size-3 stroke-3" />
                  </div>
                )}

                {/* Icon in Circular Container */}
                {iconName && (
                  <div
                    className={`mb-4 flex size-12 items-center justify-center rounded-full transition-all ${
                      selected
                        ? "bg-slate-200 text-slate-800"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    <IconWrapper name={iconName} className="size-5" />
                  </div>
                )}

                <span className="mb-1 block text-base font-bold text-slate-900">
                  {option.label}
                </span>

                {option.description && (
                  <span className="block text-xs leading-relaxed font-normal text-slate-500">
                    {option.description}
                  </span>
                )}
              </button>
            )
          }

          return (
            <button
              key={option.value}
              className={`flex min-h-14 items-center justify-between rounded-md border px-4 py-3 text-left text-sm font-semibold transition ${
                selected
                  ? "border-slate-900 bg-slate-50 text-slate-900 ring-3 ring-slate-100"
                  : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50/40"
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
