import { zodResolver } from "@hookform/resolvers/zod"
import { securityProfileSchema, type SecurityProfile } from "@plyco/shared"
import { useState } from "react"
import { type Resolver, useForm } from "react-hook-form"
import { z } from "zod"

import { ToggleField } from "@/components/form/toggle-field"
import {
  ProfilePanelDetailGrid,
  ProfilePanelShell,
  type ProfilePanelDetailRow,
} from "@/features/company/components/profile-panel-shell"
import { boolText } from "@/features/company/lib/display"
import { securityHelperText } from "../security-helper-text"

const developmentSecuritySchema = securityProfileSchema.pick({
  codeReviewRequired: true,
  dependencySecurityMonitoring: true,
  secretScanning: true,
  automatedTestingBeforeDeployment: true,
  cicdDeploymentProcess: true,
  productionDeploymentApprovalRequired: true,
})

type DevelopmentSecurityDraft = z.infer<typeof developmentSecuritySchema>

const fields = [
  ["codeReviewRequired", "Code review required"],
  ["dependencySecurityMonitoring", "Dependency security monitoring"],
  ["secretScanning", "Secret scanning"],
  ["automatedTestingBeforeDeployment", "Automated testing before deployment"],
  ["cicdDeploymentProcess", "CI/CD deployment process"],
  [
    "productionDeploymentApprovalRequired",
    "Production deployment approval required",
  ],
] as const

export const DevelopmentSecurityPanel = ({
  isMutationPending,
  needsAttention,
  security,
  onSave,
}: {
  isMutationPending: boolean
  needsAttention?: boolean
  security: SecurityProfile
  onSave: (patch: DevelopmentSecurityDraft, onSuccess?: () => void) => void
}) => {
  const [isEditing, setIsEditing] = useState(false)
  const draft = developmentSecuritySchema.parse(security)
  const form = useForm<DevelopmentSecurityDraft>({
    defaultValues: draft,
    mode: "onBlur",
    resolver: zodResolver(
      developmentSecuritySchema
    ) as Resolver<DevelopmentSecurityDraft>,
    values: draft,
  })
  const rows: ProfilePanelDetailRow[] = fields.map(([name, label]) => [
    label,
    boolText(draft[name]),
    securityHelperText[name],
  ])

  return (
    <ProfilePanelShell
      description="Secure development and production deployment controls."
      isEditing={isEditing}
      isMutationPending={isMutationPending}
      needsAttention={needsAttention}
      readOnlyContent={<ProfilePanelDetailGrid rows={rows} />}
      saveLabel="Save"
      title="Development Security"
      onCancel={() => {
        form.reset(draft)
        setIsEditing(false)
      }}
      onEdit={() => setIsEditing(true)}
      onSave={form.handleSubmit((next) =>
        onSave(next, () => setIsEditing(false))
      )}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        {fields.map(([name, label]) => (
          <ToggleField
            key={name}
            control={form.control}
            helperText={securityHelperText[name]}
            label={label}
            name={name}
          />
        ))}
      </div>
    </ProfilePanelShell>
  )
}
