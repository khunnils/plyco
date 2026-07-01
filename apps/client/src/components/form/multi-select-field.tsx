import {
  Controller,
  type Control,
  type FieldError,
  type FieldPath,
  type FieldValues,
} from "react-hook-form"
import { Settings } from "lucide-react"
import { useState } from "react"

import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxCollection,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
  ComboboxTrigger,
  useComboboxAnchor,
} from "@/components/ui/combobox"
import { cn } from "@/lib/utils"
import { CodeSetEditorDialog } from "@/features/vocabulary/components/code-set-editor-dialog"
import {
  applyCodeSetChange,
  type CodeSetChange,
  type Option,
} from "@/features/vocabulary/lib/vocabulary"

const comboboxChipsClassName =
  "field-focus-within min-h-11 flex-nowrap overflow-hidden rounded-sm border-slate-300 bg-white px-4 py-2.5 shadow-none has-data-[slot=combobox-chip]:px-4"

const comboboxChipClassName =
  "h-6 shrink-0 rounded-sm bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700 dark:bg-slate-100"

const visibleChipCount = 2

type MultiSelectFieldProps<T extends FieldValues, TValue extends string> = {
  control: Control<T>
  error?: FieldError
  helperText?: string
  label: string
  name: FieldPath<T>
  options: Array<Option & { value: TValue }>
  emptyMessage?: string
  placeholder?: string
  value?: TValue[]
  onValueChange?: (value: TValue[]) => void
}

export const MultiSelectField = <T extends FieldValues, TValue extends string>({
  control,
  error,
  helperText,
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
            helperText={helperText}
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
  helperText,
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
  helperText?: string
  label: string
  options: Array<Option & { value: TValue }>
  emptyMessage: string
  placeholder: string
  selectedValues: TValue[]
  onBlur: () => void
  onChange: (value: TValue[]) => void
}) => {
  const [isComboboxOpen, setIsComboboxOpen] = useState(false)
  const [isEditingOptions, setIsEditingOptions] = useState(false)
  const anchorRef = useComboboxAnchor()
  const optionLabelByValue = new Map(
    options.map((option) => [option.value, option.label])
  )
  const optionByValue = new Map(options.map((option) => [option.value, option]))
  const visibleSelectedValues = selectedValues.slice(0, visibleChipCount)
  const hiddenSelectedCount =
    selectedValues.length - visibleSelectedValues.length
  const codeSetId = options.find((option) => option.codeSetId)?.codeSetId
  const isEditable = options.some((option) => option.editable)
  const handleCodeSetChange = (change: CodeSetChange) => {
    onChange(applyCodeSetChange(selectedValues, change) as TValue[])
  }

  return (
    <div className="grid gap-2 text-sm font-medium text-slate-800">
      <label htmlFor={fieldId}>{label}</label>
      {helperText ? (
        <p className="-mt-1 text-xs leading-5 font-normal text-slate-500">
          {helperText}
        </p>
      ) : null}
      <Combobox<TValue, true>
        multiple
        open={isComboboxOpen}
        items={options.map((option) => option.value)}
        value={selectedValues}
        itemToStringLabel={(value) => optionLabelByValue.get(value) ?? value}
        onValueChange={(value) => onChange([...value])}
        onOpenChange={setIsComboboxOpen}
      >
        <ComboboxChips
          ref={anchorRef}
          className={cn(
            comboboxChipsClassName,
            "group/code-select",
            error &&
              "border-red-300 focus-within:border-red-500 focus-within:ring-red-100"
          )}
        >
          {visibleSelectedValues.map((selectedValue) => (
            <ComboboxChip key={selectedValue} className={comboboxChipClassName}>
              {optionLabelByValue.get(selectedValue) ?? selectedValue}
            </ComboboxChip>
          ))}
          {hiddenSelectedCount > 0 && (
            <span
              aria-label={`${hiddenSelectedCount} more selected options`}
              className={comboboxChipClassName}
            >
              +{hiddenSelectedCount}
            </span>
          )}
          <ComboboxChipsInput
            id={fieldId}
            aria-invalid={!!error || undefined}
            placeholder={selectedValues.length === 0 ? placeholder : undefined}
            className={cn(
              "min-w-0 text-sm font-normal text-slate-900 placeholder:text-slate-400",
              selectedValues.length > 0 && "w-0 flex-none"
            )}
            onBlur={onBlur}
          />
          <span className="ml-auto flex items-center gap-0.5">
            {isEditable && codeSetId ? (
              <button
                aria-label={`Edit ${label} options`}
                className="rounded-sm p-1 text-slate-400 opacity-0 transition group-hover/code-select:opacity-100 hover:bg-slate-100 hover:text-slate-700 focus-visible:opacity-100"
                title={`Edit ${label} options`}
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={(event) => {
                  event.preventDefault()
                  event.stopPropagation()
                  setIsComboboxOpen(false)
                  setIsEditingOptions(true)
                }}
              >
                <Settings className="size-3.5" />
              </button>
            ) : null}
            <ComboboxTrigger className="rounded-sm p-1 text-slate-500 transition hover:bg-slate-50 hover:text-slate-700" />
          </span>
        </ComboboxChips>
        <ComboboxContent
          anchor={anchorRef}
          className="rounded-sm border border-slate-200 bg-white shadow-lg ring-0"
        >
          <ComboboxEmpty>{emptyMessage}</ComboboxEmpty>
          <ComboboxList>
            <ComboboxCollection>
              {(value: TValue) => {
                const option = optionByValue.get(value)

                if (!option) {
                  return null
                }

                return (
                  <ComboboxItem
                    key={option.value}
                    className="rounded-sm text-slate-800 data-highlighted:bg-slate-50 data-highlighted:text-slate-900"
                    value={option.value}
                  >
                    <span className="grid gap-0.5">
                      <span>{option.label}</span>
                      {option.usesHints && option.description ? (
                        <span className="text-xs font-normal text-slate-500">
                          {option.description}
                        </span>
                      ) : null}
                    </span>
                  </ComboboxItem>
                )
              }}
            </ComboboxCollection>
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
      {error && <span className="text-xs text-red-700">{error.message}</span>}
      {codeSetId ? (
        <CodeSetEditorDialog
          codeSetId={codeSetId}
          isOpen={isEditingOptions}
          onChange={handleCodeSetChange}
          onClose={() => setIsEditingOptions(false)}
        />
      ) : null}
    </div>
  )
}
