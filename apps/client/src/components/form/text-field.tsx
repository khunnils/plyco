import {
  type FieldError,
  type FieldPath,
  type FieldValues,
  type UseFormRegister,
} from "react-hook-form"

type TextFieldProps<T extends FieldValues> = {
  label: string
  name: FieldPath<T>
  register: UseFormRegister<T>
  disabled?: boolean
  error?: FieldError
  helperText?: string
  placeholder?: string
  type?: "text" | "number"
}

export const TextField = <T extends FieldValues>({
  label,
  name,
  register,
  disabled = false,
  error,
  helperText,
  placeholder,
  type = "text",
}: TextFieldProps<T>) => (
  <label className="grid gap-2 text-sm font-medium text-slate-800">
    <span>{label}</span>
    {helperText ? (
      <span className="-mt-1 text-xs font-normal leading-5 text-slate-500">
        {helperText}
      </span>
    ) : null}
    <input
      className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm font-normal text-slate-900 transition outline-none focus:border-blue-600 focus:ring-3 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
      disabled={disabled}
      inputMode={type === "number" ? "numeric" : undefined}
      min={type === "number" ? 1 : undefined}
      placeholder={placeholder}
      type={type}
      {...register(name, {
        disabled,
        setValueAs: (value) =>
          type === "number"
            ? value === ""
              ? null
              : Number(value)
            : value,
      })}
    />
    {error && <span className="text-xs text-red-700">{error.message}</span>}
  </label>
)
