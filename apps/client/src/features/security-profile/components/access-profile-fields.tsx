import { type UseFormReturn } from "react-hook-form"

import { ToggleField } from "@/components/form/toggle-field"
import { type ProfileDraft } from "@/features/security-profile/types/security-profile"

export const AccessProfileFields = ({
  form,
}: {
  form: UseFormReturn<ProfileDraft>
}) => (
  <div className="grid gap-4 md:grid-cols-2">
    <ToggleField
      control={form.control}
      label="MFA required"
      name="access.mfaRequired"
    />
    <ToggleField
      control={form.control}
      label="SSO enabled"
      name="access.ssoEnabled"
    />
    <ToggleField
      control={form.control}
      label="Shared accounts exist"
      name="access.sharedAccountsExist"
    />
    <ToggleField
      control={form.control}
      label="Offboarding process exists"
      name="access.offboardingProcessExists"
    />
    <ToggleField
      control={form.control}
      label="Access reviews performed"
      name="access.accessReviewsPerformed"
    />
    <ToggleField
      control={form.control}
      label="Privileged access restricted"
      name="access.privilegedAccessRestricted"
    />
  </div>
)
