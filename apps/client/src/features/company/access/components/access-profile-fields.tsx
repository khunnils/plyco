import { type UseFormReturn } from "react-hook-form"

import { SelectField } from "@/components/form/select-field"
import { ToggleField } from "@/components/form/toggle-field"
import { type ProfileDraft } from "@/features/company/types/company"
import { type Option } from "@/features/vocabulary/lib/vocabulary"

export const AccessProfileFields = ({
  form,
  securityCadenceOptions = [],
}: {
  form: UseFormReturn<ProfileDraft>
  securityCadenceOptions?: Option[]
}) => (
  <div className="grid gap-6">
    <section className="grid gap-4">
      <h3 className="text-sm font-semibold text-slate-900">Access Control</h3>
      <div className="grid gap-4 md:grid-cols-2">
        <ToggleField
          control={form.control}
          label="Least privilege"
          name="access.leastPrivilege"
        />
        <ToggleField
          control={form.control}
          label="Role-based access"
          name="access.roleBasedAccess"
        />
        <SelectField
          control={form.control}
          label="Access review cadence"
          name="access.accessReviewCadence"
          options={[{ value: "", label: "Not set" }, ...securityCadenceOptions]}
          placeholder="Not set"
        />
        <ToggleField
          control={form.control}
          label="Admin approval required"
          name="access.adminApprovalRequired"
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
    </section>
    <section className="grid gap-4">
      <h3 className="text-sm font-semibold text-slate-900">Authentication</h3>
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
          label="Password manager required"
          name="access.passwordManagerRequired"
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
      </div>
    </section>
  </div>
)
