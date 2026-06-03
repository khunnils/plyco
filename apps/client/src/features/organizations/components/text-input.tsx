import { Input } from "@/components/ui/input"

export const TextInput = ({
  label,
  value,
  helperText,
  placeholder,
  required = false,
  type = "text",
  onChange,
}: {
  label: string
  value: string
  helperText?: string
  placeholder?: string
  required?: boolean
  type?: string
  onChange: (value: string) => void
}) => (
  <label className="grid gap-2 text-sm font-medium text-slate-800">
    <span>{label}</span>
    {helperText ? (
      <span className="-mt-1 text-xs font-normal leading-5 text-slate-500">
        {helperText}
      </span>
    ) : null}
    <Input
      className="bg-white border-slate-200"
      placeholder={placeholder}
      required={required}
      type={type}
      value={value}
      onChange={(event) => onChange(event.target.value)}
    />
  </label>
)
