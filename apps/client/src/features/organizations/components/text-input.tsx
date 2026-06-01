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
    <input
      className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm font-normal text-slate-900 outline-none transition focus:border-blue-600 focus:ring-3 focus:ring-blue-100"
      placeholder={placeholder}
      required={required}
      type={type}
      value={value}
      onChange={(event) => onChange(event.target.value)}
    />
  </label>
)
