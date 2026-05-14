import {
  Controller,
  type Control,
  type FieldError,
  type FieldPath,
  type FieldValues,
} from "react-hook-form"

import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
  ComboboxTrigger,
  useComboboxAnchor,
} from "@/components/ui/combobox"
import { cn } from "@/lib/utils"

const comboboxChipsClassName =
  "min-h-10 rounded-md border-slate-200 bg-white px-3 py-2 shadow-none focus-within:border-blue-600 focus-within:ring-3 focus-within:ring-blue-100 has-data-[slot=combobox-chip]:px-3"

const comboboxChipClassName =
  "h-6 rounded-sm bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700 dark:bg-slate-100"

type MultiSelectFieldProps<T extends FieldValues, TValue extends string> = {
  control: Control<T>
  error?: FieldError
  label: string
  name: FieldPath<T>
  options: Array<{ value: TValue; label: string }>
  emptyMessage?: string
  placeholder?: string
  value?: TValue[]
  onValueChange?: (value: TValue[]) => void
}

export const MultiSelectField = <T extends FieldValues, TValue extends string>({
  control,
  error,
  label,
  name,
  options,
  emptyMessage = "No options available",
  placeholder = "Select options",
  value,
  onValueChange,
}: MultiSelectFieldProps<T, TValue>) => {
  const fieldId = name.replace(/\W+/g, "-")

  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => {
        const selectedValues =
          value ?? (Array.isArray(field.value) ? field.value : [])

        return (
          <MultiSelectInput
            error={error}
            fieldId={fieldId}
            label={label}
            options={options}
            emptyMessage={emptyMessage}
            placeholder={placeholder}
            selectedValues={selectedValues}
            onBlur={field.onBlur}
            onChange={onValueChange ?? field.onChange}
          />
        )
      }}
    />
  )
}

const MultiSelectInput = <TValue extends string>({
  error,
  fieldId,
  label,
  options,
  emptyMessage,
  placeholder,
  selectedValues,
  onBlur,
  onChange,
}: {
  error?: FieldError
  fieldId: string
  label: string
  options: Array<{ value: TValue; label: string }>
  emptyMessage: string
  placeholder: string
  selectedValues: TValue[]
  onBlur: () => void
  onChange: (value: TValue[]) => void
}) => {
  const anchorRef = useComboboxAnchor()
  const optionLabelByValue = new Map(
    options.map((option) => [option.value, option.label])
  )

  return (
    <div className="grid gap-2 text-sm font-medium text-slate-800">
      <label htmlFor={fieldId}>{label}</label>
      <Combobox<TValue, true>
        multiple
        items={options.map((option) => option.value)}
        value={selectedValues}
        itemToStringLabel={(value) => optionLabelByValue.get(value) ?? value}
        onValueChange={(value) => onChange([...value])}
      >
        <ComboboxChips
          ref={anchorRef}
          className={cn(
            comboboxChipsClassName,
            error &&
              "border-red-300 focus-within:border-red-500 focus-within:ring-red-100"
          )}
        >
          {selectedValues.map((selectedValue) => (
            <ComboboxChip key={selectedValue} className={comboboxChipClassName}>
              {optionLabelByValue.get(selectedValue) ?? selectedValue}
            </ComboboxChip>
          ))}
          <ComboboxChipsInput
            id={fieldId}
            aria-invalid={!!error || undefined}
            placeholder={selectedValues.length === 0 ? placeholder : undefined}
            className="text-sm font-normal text-slate-900 placeholder:text-slate-400"
            onBlur={onBlur}
          />
          <ComboboxTrigger className="ml-auto rounded-sm p-1 text-slate-500 transition hover:bg-slate-50 hover:text-slate-700" />
        </ComboboxChips>
        <ComboboxContent
          anchor={anchorRef}
          className="rounded-md border border-slate-200 bg-white shadow-lg ring-0"
        >
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
      {error && <span className="text-xs text-red-700">{error.message}</span>}
    </div>
  )
}
