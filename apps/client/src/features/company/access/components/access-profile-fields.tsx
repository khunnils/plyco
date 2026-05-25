import { useEffect } from "react"
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
}) => {
  const accessReviewsPerformed = form.watch("access.accessReviewsPerformed")

  useEffect(() => {
    if (accessReviewsPerformed !== true) {
      form.setValue("access.accessReviewCadence", null)
    }
  }, [accessReviewsPerformed, form])

  return (
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
          <ToggleField
            control={form.control}
            label="Admin approval required"
            name="access.adminApprovalRequired"
          />
          <ToggleField
            control={form.control}
            label="Periodic access reviews are performed"
            name="access.accessReviewsPerformed"
          />
          {accessReviewsPerformed === true && (
            <SelectField
              control={form.control}
              label="Access review cadence"
              name="access.accessReviewCadence"
              options={[{ value: "", label: "Not set" }, ...securityCadenceOptions]}
              placeholder="Not set"
            />
          )}
        </div>
      </section>
      <section className="grid gap-4">
        <h3 className="text-sm font-semibold text-slate-900">Authentication</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <ToggleField
            control={form.control}
            label="Multi-factor authentication (MFA) required"
            name="access.mfaRequired"
          />
          <ToggleField
            control={form.control}
            label="Single sign-on supported"
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
            label="Employee offboarding process exists"
            name="access.offboardingProcessExists"
          />
        </div>
      </section>
    </div>
  )
}
