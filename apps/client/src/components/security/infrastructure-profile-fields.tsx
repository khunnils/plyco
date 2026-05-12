import { type UseFormReturn } from "react-hook-form"

import { ListField } from "@/components/form/list-field"
import { TextField } from "@/components/form/text-field"
import { ToggleField } from "@/components/form/toggle-field"
import { type ProfileDraft } from "@/types/security-profile"

export const InfrastructureProfileFields = ({
  form,
}: {
  form: UseFormReturn<ProfileDraft>
}) => (
  <div className="grid gap-4 md:grid-cols-2">
    <ListField
      control={form.control}
      error={form.formState.errors.infrastructure?.cloudProviders?.root}
      label="Cloud providers"
      name="infrastructure.cloudProviders"
      placeholder="AWS, GCP, Azure"
    />
    <TextField
      error={form.formState.errors.infrastructure?.sourceControlProvider}
      label="Source control provider"
      name="infrastructure.sourceControlProvider"
      placeholder="GitHub"
      register={form.register}
    />
    <TextField
      error={form.formState.errors.infrastructure?.authProvider}
      label="Auth provider"
      name="infrastructure.authProvider"
      placeholder="Google Workspace, Okta"
      register={form.register}
    />
    <TextField
      error={form.formState.errors.infrastructure?.passwordManager}
      label="Password manager"
      name="infrastructure.passwordManager"
      placeholder="1Password"
      register={form.register}
    />
    <ToggleField
      control={form.control}
      label="MFA enabled"
      name="infrastructure.mfaEnabled"
    />
    <ToggleField
      control={form.control}
      label="Encrypted devices required"
      name="infrastructure.encryptedDevicesRequired"
    />
    <ToggleField
      control={form.control}
      label="Backups enabled"
      name="infrastructure.backupsEnabled"
    />
    <ToggleField
      control={form.control}
      label="Centralized logging enabled"
      name="infrastructure.centralizedLoggingEnabled"
    />
  </div>
)
