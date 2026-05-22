import { zodResolver } from "@hookform/resolvers/zod"
import {
  type OrganizationProvider,
  type Provider,
  privacyProfileSchema,
  type PrivacyProfile,
  type Vocabulary,
} from "@plyco/shared"
import { useState } from "react"
import { type Resolver, useForm } from "react-hook-form"
import { z } from "zod"

import { MultiSelectField } from "@/components/form/multi-select-field"
import { SelectField } from "@/components/form/select-field"
import { ToggleField } from "@/components/form/toggle-field"
import {
  ProfilePanelDetailGrid,
  ProfilePanelShell,
} from "@/features/security-profile/components/profile-panel-shell"
import { boolText } from "@/features/security-profile/lib/display"
import { providerNamesForSystem } from "@/features/security-profile/lib/profile"
import { codeLabel, type Option } from "@/features/vocabulary/lib/vocabulary"

const marketingSchema = privacyProfileSchema.pick({
  sendsMarketingEmails: true,
  marketingOptOutMethod: true,
  transactionalEmailsSent: true,
  organizationProviders: true,
})

type MarketingDraft = z.infer<typeof marketingSchema>

const toMarketingDraft = (privacy: PrivacyProfile): MarketingDraft => ({
  sendsMarketingEmails: privacy.sendsMarketingEmails,
  marketingOptOutMethod: privacy.marketingOptOutMethod,
  transactionalEmailsSent: privacy.transactionalEmailsSent,
  organizationProviders: privacy.organizationProviders,
})

const selectedNewsletterIds = (providers: OrganizationProvider[]) =>
  providers
    .filter((provider) => provider.systemType === "newsletter")
    .map((provider) => provider.providerId)

const marketingRows = (
  draft: MarketingDraft,
  vocabulary: Vocabulary | undefined,
  catalogProviders: Provider[],
) =>
  [
    ["Marketing emails", boolText(draft.sendsMarketingEmails)],
    [
      "Marketing opt-out method",
      draft.marketingOptOutMethod
        ? codeLabel(
            vocabulary,
            "privacy_marketing_opt_out_methods",
            draft.marketingOptOutMethod,
          )
        : "Not set",
    ],
    ["Transactional emails", boolText(draft.transactionalEmailsSent)],
    [
      "Newsletter provider",
      providerNamesForSystem(
        draft.organizationProviders,
        catalogProviders,
        "newsletter",
      ),
    ],
  ] as const

export const MarketingCommunicationsPanel = ({
  catalogProviders,
  isMutationPending,
  marketingOptOutMethodOptions,
  newsletterProviderOptions,
  privacy,
  vocabulary,
  onSave,
}: {
  catalogProviders: Provider[]
  isMutationPending: boolean
  marketingOptOutMethodOptions: Option[]
  newsletterProviderOptions: Option[]
  privacy: PrivacyProfile
  vocabulary: Vocabulary | undefined
  onSave: (patch: MarketingDraft) => void
}) => {
  const [isEditing, setIsEditing] = useState(false)
  const draft = toMarketingDraft(privacy)

  const form = useForm<MarketingDraft>({
    defaultValues: draft,
    mode: "onBlur",
    resolver: zodResolver(marketingSchema) as Resolver<MarketingDraft>,
    values: draft,
  })

  const organizationProviders = form.watch("organizationProviders")

  const submit = form.handleSubmit((next) => {
    onSave(next)
    setIsEditing(false)
  })

  return (
    <ProfilePanelShell
      description="Marketing communication practices, newsletters, and opt-out methodologies."
      isEditing={isEditing}
      isMutationPending={isMutationPending}
      readOnlyContent={
        <ProfilePanelDetailGrid
          rows={marketingRows(draft, vocabulary, catalogProviders)}
        />
      }
      saveLabel="Save section"
      title="Marketing & Communications"
      onCancel={() => {
        form.reset(draft)
        setIsEditing(false)
      }}
      onEdit={() => setIsEditing(true)}
      onSave={submit}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <ToggleField
          control={form.control}
          label="Sends marketing emails"
          name="sendsMarketingEmails"
        />
        <SelectField
          control={form.control}
          label="Marketing opt-out method"
          name="marketingOptOutMethod"
          options={[
            { value: "", label: "Not set" },
            ...marketingOptOutMethodOptions,
          ]}
          placeholder="Not set"
        />
        <ToggleField
          control={form.control}
          label="Transactional emails sent"
          name="transactionalEmailsSent"
        />
        <MultiSelectField
          control={form.control}
          label="Newsletter provider"
          name="organizationProviders"
          options={newsletterProviderOptions}
          placeholder="Select newsletter provider"
          value={selectedNewsletterIds(organizationProviders)}
          onValueChange={(providerIds) => {
            const selectedId = providerIds.slice(-1)
            const otherProviders = organizationProviders.filter(
              (provider) => provider.systemType !== "newsletter",
            )

            form.setValue(
              "organizationProviders",
              [
                ...otherProviders,
                ...selectedId.map((providerId) => ({
                  systemType: "newsletter" as const,
                  providerId,
                })),
              ],
              { shouldDirty: true, shouldValidate: true },
            )
          }}
        />
      </div>
    </ProfilePanelShell>
  )
}
