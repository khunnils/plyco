import {
  Controller,
  type Control,
  type FieldPath,
  type FieldValues,
} from "react-hook-form"

import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox"

const comboboxInputClassName =
  "h-10 w-full rounded-md border-slate-200 bg-white text-sm font-normal text-slate-900 shadow-none focus-within:border-blue-600 focus-within:ring-3 focus-within:ring-blue-100"

type SelectFieldProps<T extends FieldValues, TValue extends string> = {
  control: Control<T>
  emptyMessage?: string
  helperText?: string
  label: string
  name: FieldPath<T>
  options: Array<{ value: TValue; label: string }>
  placeholder?: string
}

export const SelectField = <T extends FieldValues, TValue extends string>({
  control,
  emptyMessage = "No options available",
  helperText,
  label,
  name,
  options,
  placeholder = "Select an option",
}: SelectFieldProps<T, TValue>) => {
  const fieldId = name.replace(/\W+/g, "-")
  const optionLabelByValue = new Map(
    options.map((option) => [option.value, option.label])
  )

  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <label
          className="grid gap-2 text-sm font-medium text-slate-800"
          htmlFor={fieldId}
        >
          <span>{label}</span>
          {helperText ? (
            <span className="-mt-1 text-xs font-normal leading-5 text-slate-500">
              {helperText}
            </span>
          ) : null}
          <Combobox<TValue>
            items={options.map((option) => option.value)}
            value={field.value ?? null}
            autoHighlight
            itemToStringLabel={(value) =>
              optionLabelByValue.get(value) ?? value
            }
            onValueChange={(value) => field.onChange(value ?? "")}
          >
            <ComboboxInput
              id={fieldId}
              className={comboboxInputClassName}
              placeholder={placeholder}
              onBlur={field.onBlur}
            />
            <ComboboxContent className="rounded-md border border-slate-200 bg-white shadow-lg ring-0">
              <ComboboxEmpty>{emptyMessage}</ComboboxEmpty>
              <ComboboxList>
                {options.map((option) => (
                  <ComboboxItem
                    key={option.value}
                    className="rounded-sm text-slate-800 data-highlighted:bg-slate-50 data-highlighted:text-slate-900"
                    value={option.value}
                  >
                    {option.label}
                  </ComboboxItem>
                ))}
              </ComboboxList>
            </ComboboxContent>
          </Combobox>
        </label>
      )}
    />
  )
}
