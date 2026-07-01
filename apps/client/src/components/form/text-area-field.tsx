import {
  type FieldError,
  type FieldPath,
  type FieldValues,
  type UseFormRegister,
} from "react-hook-form"

type TextAreaFieldProps<T extends FieldValues> = {
  label: string
  name: FieldPath<T>
  register: UseFormRegister<T>
  error?: FieldError
  helperText?: string
  placeholder?: string
}

export const TextAreaField = <T extends FieldValues>({
  label,
  name,
  register,
  error,
  helperText,
  placeholder,
}: TextAreaFieldProps<T>) => (
  <label className="grid gap-2 text-sm font-medium text-slate-800">
    <span>{label}</span>
    {helperText ? (
      <span className="-mt-1 text-xs leading-5 font-normal text-slate-500">
        {helperText}
      </span>
    ) : null}
    <textarea
      autoComplete="new-password"
      className="field-focus min-h-24 rounded-sm border border-slate-300 bg-white px-4 py-3 text-sm font-normal text-slate-900 transition outline-none"
      placeholder={placeholder}
      {...register(name)}
    />
    {error && <span className="text-xs text-red-700">{error.message}</span>}
  </label>
)
