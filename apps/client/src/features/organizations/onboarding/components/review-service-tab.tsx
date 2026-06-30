import { useOnboardingStore } from "../stores/onboarding-store"
import { TextInput } from "../../components/text-input"
import { MARKETING_WEBSITE_SERVICE_NAME } from "../../components/types"

interface ReviewServiceTabProps {
  regionOptions: Array<{ value: string; label: string }>
}

const SetupTextArea = ({
  label,
  value,
  placeholder,
  onChange,
}: {
  label: string
  value: string
  placeholder?: string
  onChange: (value: string) => void
}) => (
  <label className="grid gap-2 text-sm font-medium text-slate-800 md:col-span-2">
    <span>{label}</span>
    <textarea
      className="field-focus min-h-24 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm leading-6 font-normal text-slate-900 transition outline-none"
      placeholder={placeholder}
      value={value}
      onChange={(event) => onChange(event.target.value)}
    />
  </label>
)

export const ReviewServiceTab = ({ regionOptions }: ReviewServiceTabProps) => {
  const { draft, updateDraft } = useOnboardingStore()

  if (!draft) {
    return null
  }

  return (
    <div className="grid gap-3 md:grid-cols-2">
      <div className="md:col-span-2">
        <p className="text-sm font-semibold text-slate-950">Primary Service</p>
        <p className="mt-1 text-xs leading-5 text-slate-500">
          Edit the primary product or service saved during setup.
        </p>
      </div>
      <TextInput
        label="Service name"
        required
        value={draft.primaryService.serviceName ?? ""}
        onChange={(value) =>
          updateDraft((current) => ({
            ...current,
            primaryService: {
              ...current.primaryService,
              serviceName: value,
            },
          }))
        }
      />
      <TextInput
        label="Service URL"
        value={draft.primaryService.serviceUrl ?? ""}
        onChange={(value) =>
          updateDraft((current) => ({
            ...current,
            primaryService: {
              ...current.primaryService,
              serviceUrl: value,
            },
          }))
        }
      />
      <SetupTextArea
        label="Description"
        value={draft.primaryService.serviceDescription ?? ""}
        onChange={(value) =>
          updateDraft((current) => ({
            ...current,
            primaryService: {
              ...current.primaryService,
              serviceDescription: value,
            },
          }))
        }
      />
      <label className="grid gap-2 text-sm font-medium text-slate-800 md:col-span-2">
        <span>Hosting region</span>
        <select
          className="field-focus h-10 rounded-md border border-slate-200 bg-white px-3 text-sm font-normal text-slate-900 transition outline-none"
          value={draft.primaryService.privacy.primaryHostingRegion ?? ""}
          onChange={(event) =>
            updateDraft((current) => ({
              ...current,
              primaryService: {
                ...current.primaryService,
                privacy: {
                  ...current.primaryService.privacy,
                  primaryHostingRegion: event.target.value || null,
                },
              },
            }))
          }
        >
          <option value="">Not set</option>
          {regionOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      <div className="mt-2 rounded-md border border-slate-200 bg-white p-4 md:col-span-2">
        <p className="text-sm font-semibold text-slate-950">
          {draft.websiteService.serviceName ?? MARKETING_WEBSITE_SERVICE_NAME}
        </p>
        <p className="mt-1 text-xs leading-5 text-slate-500">
          {draft.websiteService.serviceDescription}
        </p>
        {draft.websiteService.serviceUrl ? (
          <p className="mt-3 text-xs font-medium text-slate-600">
            {draft.websiteService.serviceUrl}
          </p>
        ) : null}
      </div>
    </div>
  )
}
