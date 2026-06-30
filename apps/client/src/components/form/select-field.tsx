import {
  Controller,
  type Control,
  type FieldPath,
  type FieldValues,
} from "react-hook-form"
import { Settings } from "lucide-react"
import { useState } from "react"

import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox"
import { CodeSetEditorDialog } from "@/features/vocabulary/components/code-set-editor-dialog"
import {
  applyCodeSetChange,
  type CodeSetChange,
  type Option,
} from "@/features/vocabulary/lib/vocabulary"

const comboboxInputClassName =
  "field-focus-within h-10 w-full rounded-md border-slate-200 bg-white text-sm font-normal text-slate-900 shadow-none"

type SelectFieldProps<T extends FieldValues, TValue extends string> = {
  control: Control<T>
  emptyMessage?: string
  helperText?: string
  label: string
  name: FieldPath<T>
  options: Array<Option & { value: TValue }>
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
  const [isComboboxOpen, setIsComboboxOpen] = useState(false)
  const [isEditingOptions, setIsEditingOptions] = useState(false)
  const fieldId = name.replace(/\W+/g, "-")
  const optionLabelByValue = new Map(
    options.map((option) => [option.value, option.label])
  )
  const codeSetId = options.find((option) => option.codeSetId)?.codeSetId
  const isEditable = options.some((option) => option.editable)

  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => {
        const handleCodeSetChange = (change: CodeSetChange) => {
          const nextValue = applyCodeSetChange(
            field.value ? [field.value] : [],
            change
          )[0]
          field.onChange(nextValue ?? "")
        }

        return (
          <>
            <label
              className="grid gap-2 text-sm font-medium text-slate-800"
              htmlFor={fieldId}
            >
              <span>{label}</span>
              {helperText ? (
                <span className="-mt-1 text-xs leading-5 font-normal text-slate-500">
                  {helperText}
                </span>
              ) : null}
              <Combobox<TValue>
                open={isComboboxOpen}
                items={options.map((option) => option.value)}
                value={field.value ?? null}
                autoHighlight
                itemToStringLabel={(value) =>
                  optionLabelByValue.get(value) ?? value
                }
                onValueChange={(value) => field.onChange(value ?? "")}
                onOpenChange={setIsComboboxOpen}
              >
                <ComboboxInput
                  id={fieldId}
                  className={`${comboboxInputClassName} group/code-select`}
                  endAction={
                    isEditable && codeSetId ? (
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
                    ) : null
                  }
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
                        <span className="grid gap-0.5">
                          <span>{option.label}</span>
                          {option.usesHints && option.description ? (
                            <span className="text-xs font-normal text-slate-500">
                              {option.description}
                            </span>
                          ) : null}
                        </span>
                      </ComboboxItem>
                    ))}
                  </ComboboxList>
                </ComboboxContent>
              </Combobox>
            </label>
            {codeSetId ? (
              <CodeSetEditorDialog
                codeSetId={codeSetId}
                isOpen={isEditingOptions}
                onChange={handleCodeSetChange}
                onClose={() => setIsEditingOptions(false)}
              />
            ) : null}
          </>
        )
      }}
    />
  )
}
