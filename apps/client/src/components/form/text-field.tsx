import { type ComponentProps } from "react"
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
  autoComplete?: ComponentProps<"input">["autoComplete"]
  disabled?: boolean
  error?: FieldError
  helperText?: string
  placeholder?: string
  type?: "text" | "number" | "date"
  min?: number
}

export const TextField = <T extends FieldValues>({
  label,
  name,
  register,
  autoComplete = "off",
  disabled = false,
  error,
  helperText,
  placeholder,
  type = "text",
  min,
}: TextFieldProps<T>) => (
  <label className="grid gap-2 text-sm font-medium text-slate-800">
    <span>{label}</span>
    {helperText ? (
      <span className="-mt-1 text-xs leading-5 font-normal text-slate-500">
        {helperText}
      </span>
    ) : null}
    <input
      autoComplete={autoComplete}
      className="field-focus h-11 rounded-sm border border-slate-300 bg-white px-4 py-2.5 text-sm font-normal text-slate-900 transition outline-none disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
      disabled={disabled}
      inputMode={type === "number" ? "numeric" : undefined}
      min={type === "number" ? (min !== undefined ? min : 1) : undefined}
      placeholder={placeholder}
      type={type}
      {...register(name, {
        disabled,
        setValueAs: (value) =>
          type === "number"
            ? value === ""
              ? null
              : Number(value)
            : type === "date"
              ? value === ""
                ? null
                : value
              : value,
      })}
    />
    {error && <span className="text-xs text-red-700">{error.message}</span>}
  </label>
)
