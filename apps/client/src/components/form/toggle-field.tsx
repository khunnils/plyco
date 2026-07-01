import {
  Controller,
  type Control,
  type FieldPath,
  type FieldValues,
} from "react-hook-form"

type ToggleFieldProps<T extends FieldValues> = {
  control: Control<T>
  helperText?: string
  label: string
  name: FieldPath<T>
}

export const ToggleField = <T extends FieldValues>({
  control,
  helperText,
  label,
  name,
}: ToggleFieldProps<T>) => (
  <Controller
    control={control}
    name={name}
    render={({ field }) => (
      <label className="grid gap-2 text-sm font-medium text-slate-800">
        <span>{label}</span>
        {helperText ? (
          <span className="-mt-1 text-xs leading-5 font-normal text-slate-500">
            {helperText}
          </span>
        ) : null}
        <span className="grid min-h-11 [grid-template-columns:minmax(0,1fr)_auto] items-center gap-4 rounded-sm border border-slate-300 bg-white px-4 py-2.5">
          <span className="min-w-0 text-xs font-medium text-slate-500">
            {field.value === null ? "Unanswered" : field.value ? "Yes" : "No"}
          </span>
          <input
            checked={field.value === true}
            className="size-4 shrink-0 accent-slate-900"
            type="checkbox"
            onBlur={field.onBlur}
            onChange={(event) => field.onChange(event.target.checked)}
          />
        </span>
      </label>
    )}
  />
)
