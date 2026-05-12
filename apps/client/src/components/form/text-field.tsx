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
  error?: FieldError
  placeholder?: string
  type?: "text" | "number"
}

export const TextField = <T extends FieldValues>({
  label,
  name,
  register,
  error,
  placeholder,
  type = "text",
}: TextFieldProps<T>) => (
  <label className="grid gap-2 text-sm font-medium text-slate-800">
    {label}
    <input
      className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm font-normal text-slate-900 transition outline-none focus:border-blue-600 focus:ring-3 focus:ring-blue-100"
      inputMode={type === "number" ? "numeric" : undefined}
      min={type === "number" ? 1 : undefined}
      placeholder={placeholder}
      type={type}
      {...register(name, { valueAsNumber: type === "number" })}
    />
    {error && <span className="text-xs text-red-700">{error.message}</span>}
  </label>
)
