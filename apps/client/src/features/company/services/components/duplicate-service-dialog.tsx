import { zodResolver } from "@hookform/resolvers/zod"
import {
  duplicateServiceInputSchema,
  type DuplicateServiceInput,
  type ServiceProfileInput,
} from "@plyco/contracts"
import { Dialog } from "radix-ui"
import { useForm } from "react-hook-form"
import { useState } from "react"
import { SelectField } from "@/components/form/select-field"
import { TextField } from "@/components/form/text-field"
import { Button } from "@/components/ui/button"
import { type Option } from "@/features/vocabulary/lib/vocabulary"

export const DuplicateServiceDialog = ({
  service,
  regionOptions,
  isPending,
  onClose,
  onSubmit,
}: {
  service: ServiceProfileInput
  regionOptions: Option[]
  isPending: boolean
  onClose: () => void
  onSubmit: (input: DuplicateServiceInput) => void
}) => {
  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(
    null
  )
  const [returnFocusTo] = useState(() =>
    document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null
  )
  const form = useForm<DuplicateServiceInput>({
    defaultValues: {
      serviceName: `${service.serviceName?.trim() || "Service"} (copy)`,
      serviceUrl: service.serviceUrl ?? "",
      primaryHostingRegion: service.privacy.primaryHostingRegion ?? "",
    },
    resolver: zodResolver(duplicateServiceInputSchema),
    mode: "onBlur",
  })
  return (
    <Dialog.Root
      open
      onOpenChange={(open) => {
        if (!open && !isPending) onClose()
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[100] bg-slate-900/40" />
        <Dialog.Content
          ref={setPortalContainer}
          onCloseAutoFocus={(event) => {
            event.preventDefault()
            if (returnFocusTo?.isConnected) returnFocusTo.focus()
          }}
          className="fixed top-1/2 left-1/2 z-[101] grid max-h-[calc(100svh-2rem)] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 gap-5 rounded-lg bg-white p-6 shadow-xl"
          onEscapeKeyDown={(event) => {
            if (isPending) event.preventDefault()
          }}
          onInteractOutside={(event) => {
            if (isPending) event.preventDefault()
          }}
        >
          <Dialog.Title className="text-lg font-semibold text-slate-950">
            Duplicate service
          </Dialog.Title>
          <Dialog.Description className="text-sm leading-6 text-slate-500">
            Copy {service.serviceName?.trim() || "this service"}, including its
            settings, notes, activity assignments, and provider usage. Set the
            details for the new service below.
          </Dialog.Description>
          <form
            className="grid min-h-0 gap-5 overflow-y-auto"
            onSubmit={form.handleSubmit((input) => {
              if (!isPending) onSubmit(input)
            })}
          >
            <TextField
              label="Service name"
              name="serviceName"
              register={form.register}
              error={form.formState.errors.serviceName}
              disabled={isPending}
            />
            <TextField
              label="Service URL"
              name="serviceUrl"
              register={form.register}
              error={form.formState.errors.serviceUrl}
              disabled={isPending}
              placeholder="https://app.example.com"
            />
            <SelectField
              label="Primary hosting region"
              name="primaryHostingRegion"
              control={form.control}
              options={regionOptions}
              error={form.formState.errors.primaryHostingRegion}
              disabled={isPending}
              portalContainer={portalContainer}
            />
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={isPending}
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Duplicating…" : "Duplicate service"}
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
