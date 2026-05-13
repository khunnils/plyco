import { Check, ChevronDown, X } from "lucide-react"
import { useEffect, useMemo, useRef, useState } from "react"
import {
  Controller,
  type Control,
  type FieldError,
  type FieldPath,
  type FieldValues,
} from "react-hook-form"

import { cn } from "@/lib/utils"

type MultiSelectFieldProps<T extends FieldValues, TValue extends string> = {
  control: Control<T>
  error?: FieldError
  label: string
  name: FieldPath<T>
  options: Array<{ value: TValue; label: string }>
  emptyMessage?: string
  placeholder?: string
}

export const MultiSelectField = <T extends FieldValues, TValue extends string>({
  control,
  error,
  label,
  name,
  options,
  emptyMessage = "No options available",
  placeholder = "Select options",
}: MultiSelectFieldProps<T, TValue>) => {
  const fieldId = name.replace(/\W+/g, "-")

  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => {
        const selectedValues = Array.isArray(field.value) ? field.value : []

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
            onChange={field.onChange}
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
  selectedValues: string[]
  onBlur: () => void
  onChange: (value: string[]) => void
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const optionLabels = useMemo(
    () => new Map(options.map((option) => [option.value, option.label])),
    [options]
  )
  const selectedLabels = selectedValues.map(
    (value) => optionLabels.get(value) ?? value
  )

  useEffect(() => {
    const closeOnPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener("pointerdown", closeOnPointerDown)
    return () => document.removeEventListener("pointerdown", closeOnPointerDown)
  }, [])

  const toggleValue = (value: string) => {
    if (selectedValues.includes(value)) {
      onChange(
        selectedValues.filter((selectedValue) => selectedValue !== value)
      )
      return
    }

    onChange([...selectedValues, value])
  }

  return (
    <div
      ref={rootRef}
      className="relative grid gap-2 text-sm font-medium text-slate-800"
    >
      <span>{label}</span>
      <button
        aria-controls={`${fieldId}-options`}
        aria-expanded={isOpen}
        className={cn(
          "flex min-h-10 w-full items-center justify-between gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-left text-sm font-normal text-slate-900 transition outline-none focus:border-blue-600 focus:ring-3 focus:ring-blue-100",
          error && "border-red-300 focus:border-red-500 focus:ring-red-100"
        )}
        type="button"
        onBlur={onBlur}
        onClick={() => setIsOpen((current) => !current)}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            setIsOpen(false)
          }
        }}
      >
        <span className="flex min-w-0 flex-1 flex-wrap gap-1">
          {selectedLabels.length === 0 ? (
            <span className="truncate text-slate-400">{placeholder}</span>
          ) : (
            selectedLabels.map((selectedLabel) => (
              <span
                key={selectedLabel}
                className="inline-flex max-w-full items-center gap-1 rounded-sm bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700"
              >
                <span className="truncate">{selectedLabel}</span>
              </span>
            ))
          )}
        </span>
        <ChevronDown
          aria-hidden="true"
          className={cn(
            "size-4 shrink-0 text-slate-500 transition",
            isOpen && "rotate-180"
          )}
        />
      </button>
      {isOpen && (
        <div
          className="absolute top-full z-20 mt-1 grid max-h-64 w-full overflow-y-auto rounded-md border border-slate-200 bg-white p-1 shadow-lg"
          id={`${fieldId}-options`}
          role="listbox"
        >
          {options.length > 0 ? (
            options.map((option) => {
              const isSelected = selectedValues.includes(option.value)

              return (
                <button
                  key={option.value}
                  aria-selected={isSelected}
                  className="flex items-center gap-2 rounded-sm px-2 py-2 text-left text-sm font-normal text-slate-800 transition outline-none hover:bg-slate-50 focus:bg-slate-50"
                  role="option"
                  type="button"
                  onClick={() => toggleValue(option.value)}
                >
                  <span
                    className={cn(
                      "flex size-4 shrink-0 items-center justify-center rounded-sm border",
                      isSelected
                        ? "border-blue-600 bg-blue-600 text-white"
                        : "border-slate-300 bg-white text-transparent"
                    )}
                  >
                    <Check aria-hidden="true" className="size-3" />
                  </span>
                  <span className="min-w-0 flex-1 truncate">
                    {option.label}
                  </span>
                </button>
              )
            })
          ) : (
            <p className="px-2 py-2 text-sm font-normal text-slate-500">
              {emptyMessage}
            </p>
          )}
          {selectedValues.length > 0 && (
            <button
              className="mt-1 flex items-center gap-2 border-t border-slate-100 px-2 py-2 text-left text-xs font-medium text-slate-500 transition outline-none hover:text-slate-800 focus:text-slate-800"
              type="button"
              onClick={() => onChange([])}
            >
              <X aria-hidden="true" className="size-3.5" />
              Clear selections
            </button>
          )}
        </div>
      )}
      {error && <span className="text-xs text-red-700">{error.message}</span>}
    </div>
  )
}
