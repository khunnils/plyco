import { zodResolver } from "@hookform/resolvers/zod"
import {
  accessProfileSchema,
  companyProfileSchema,
  dataHandlingProfileSchema,
  infrastructureProfileSchema,
} from "@complyflow/shared"
import { type ReactNode } from "react"
import {
  type FieldErrors,
  type Resolver,
  type UseFormReturn,
  useForm,
} from "react-hook-form"
import { z } from "zod"

import { AccessProfileFields } from "@/features/security-profile/components/access-profile-fields"
import { CompanyProfileFields } from "@/features/security-profile/components/company-profile-fields"
import { DataHandlingProfileFields } from "@/features/security-profile/components/data-handling-profile-fields"
import { InfrastructureProfileFields } from "@/features/security-profile/components/infrastructure-profile-fields"
import { type ProfileDraft } from "@/features/security-profile/types/security-profile"

const profileDraftSchema = z.object({
  company: companyProfileSchema,
  infrastructure: infrastructureProfileSchema,
  dataHandling: dataHandlingProfileSchema,
  access: accessProfileSchema,
})

export type ProfileFormReturn = UseFormReturn<ProfileDraft>

export const ProfileForm = ({
  defaultValues,
  children,
  onInvalid,
  onSubmit,
}: {
  defaultValues: ProfileDraft
  children: (form: ProfileFormReturn) => ReactNode
  onInvalid?: (errors: FieldErrors<ProfileDraft>) => void
  onSubmit: (profile: ProfileDraft) => void
}) => {
  const form = useForm<ProfileDraft>({
    defaultValues,
    mode: "onBlur",
    resolver: zodResolver(profileDraftSchema) as Resolver<ProfileDraft>,
    values: defaultValues,
  })

  return (
    <form
      className="grid gap-5"
      onSubmit={form.handleSubmit(onSubmit, onInvalid)}
    >
      {children(form)}
    </form>
  )
}

export const ProfileCompanyFields = CompanyProfileFields
export const ProfileInfrastructureFields = InfrastructureProfileFields
export const ProfileDataHandlingFields = DataHandlingProfileFields
export const ProfileAccessFields = AccessProfileFields
