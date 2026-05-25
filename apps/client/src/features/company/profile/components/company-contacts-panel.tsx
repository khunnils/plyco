import { zodResolver } from "@hookform/resolvers/zod"
import { companyProfileSchema, type CompanyProfile } from "@plyco/shared"
import { useState } from "react"
import { type Resolver, useForm } from "react-hook-form"
import { z } from "zod"

import { TextField } from "@/components/form/text-field"
import {
  ProfilePanelDetailGrid,
  ProfilePanelShell,
} from "@/features/company/components/profile-panel-shell"
import { companyHelperText } from "./company-helper-text"

const contactsSchema = companyProfileSchema.pick({
  contactEmail: true,
  securityContactEmail: true,
  privacyContactEmail: true,
})

type ContactsDraft = z.infer<typeof contactsSchema>

const toContactsDraft = (company: CompanyProfile): ContactsDraft => ({
  contactEmail: company.contactEmail,
  securityContactEmail: company.securityContactEmail,
  privacyContactEmail: company.privacyContactEmail,
})

const contactsRows = (draft: ContactsDraft) =>
  [
    [
      "Contact email",
      draft.contactEmail || "Not set",
      companyHelperText.contactEmail,
    ],
    [
      "Security contact",
      draft.securityContactEmail || "Not set",
      companyHelperText.securityContactEmail,
    ],
    [
      "Privacy contact",
      draft.privacyContactEmail || "Not set",
      companyHelperText.privacyContactEmail,
    ],
  ] as const

export const CompanyContactsPanel = ({
  company,
  isMutationPending,
  onSave,
}: {
  company: CompanyProfile
  isMutationPending: boolean
  onSave: (patch: ContactsDraft, onSuccess?: () => void) => void
}) => {
  const [isEditing, setIsEditing] = useState(false)
  const draft = toContactsDraft(company)

  const form = useForm<ContactsDraft>({
    defaultValues: draft,
    mode: "onBlur",
    resolver: zodResolver(contactsSchema) as Resolver<ContactsDraft>,
    values: draft,
  })

  const submit = form.handleSubmit((next) => {
    onSave(next, () => setIsEditing(false))
  })

  return (
    <ProfilePanelShell
      description="Primary points of contact for customers and regulators."
      isEditing={isEditing}
      isMutationPending={isMutationPending}
      readOnlyContent={<ProfilePanelDetailGrid rows={contactsRows(draft)} />}
      saveLabel="Save"
      title="Contacts"
      onCancel={() => {
        form.reset(draft)
        setIsEditing(false)
      }}
      onEdit={() => setIsEditing(true)}
      onSave={submit}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <TextField
          error={form.formState.errors.contactEmail}
          helperText={companyHelperText.contactEmail}
          label="Contact email"
          name="contactEmail"
          placeholder="hello@acme.example"
          register={form.register}
        />
        <TextField
          error={form.formState.errors.securityContactEmail}
          helperText={companyHelperText.securityContactEmail}
          label="Security contact email"
          name="securityContactEmail"
          placeholder="security@acme.example"
          register={form.register}
        />
        <TextField
          error={form.formState.errors.privacyContactEmail}
          helperText={companyHelperText.privacyContactEmail}
          label="Privacy contact email"
          name="privacyContactEmail"
          placeholder="privacy@acme.example"
          register={form.register}
        />
      </div>
    </ProfilePanelShell>
  )
}
