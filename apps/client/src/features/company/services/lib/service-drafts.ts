import {
  serviceProfileInputSchema,
  servicePrivacyProfileSchema,
  type ServiceProfileInput,
} from "@plyco/shared"
import { type FieldPath } from "react-hook-form"
import { z } from "zod"

export const serviceBasicsSchema = serviceProfileInputSchema
  .pick({
    serviceName: true,
    serviceDescription: true,
    serviceUrl: true,
  })
  .extend({
    usesCookiesOrTrackingTechnologies: z.boolean().nullable(),
  })

export const serviceAudienceSchema = serviceProfileInputSchema.pick({
  userTypes: true,
  customerTypes: true,
  availabilityRegions: true,
  childrenDirected: true,
  minimumUserAge: true,
})

export const servicePrivacyDraftSchema = z.object({
  privacy: servicePrivacyProfileSchema,
})

export type ServiceBasicsDraft = z.infer<typeof serviceBasicsSchema>
export type ServiceAudienceDraft = z.infer<typeof serviceAudienceSchema>
export type ServicePrivacyDraft = z.infer<typeof servicePrivacyDraftSchema>

export const basicsPath = (field: string) =>
  field as FieldPath<ServiceBasicsDraft>
export const audiencePath = (field: string) =>
  field as FieldPath<ServiceAudienceDraft>
export const privacyPath = (field: string) =>
  `privacy.${field}` as FieldPath<ServicePrivacyDraft>

export const serviceBasicsDraft = (
  service: ServiceProfileInput
): ServiceBasicsDraft => ({
  serviceName: service.serviceName,
  serviceDescription: service.serviceDescription,
  serviceUrl: service.serviceUrl,
  usesCookiesOrTrackingTechnologies:
    service.privacy.usesCookiesOrTrackingTechnologies,
})

export const serviceAudienceDraft = (
  service: ServiceProfileInput
): ServiceAudienceDraft => ({
  userTypes: service.userTypes,
  customerTypes: service.customerTypes,
  availabilityRegions: service.availabilityRegions,
  childrenDirected: service.childrenDirected,
  minimumUserAge: service.minimumUserAge,
})

export const servicePrivacyDraft = (
  service: ServiceProfileInput
): ServicePrivacyDraft => ({
  privacy: service.privacy,
})

export const serviceProviderPurpose = (service: ServiceProfileInput) =>
  `Used by ${service.serviceName?.trim() || "this service"}`
