import {
  type BusinessActivity,
  type BusinessActivityInput,
  type ServiceProviderUsage,
  type ServiceProviderUsageInput,
  type OrganizationProvider,
  type OrganizationProviderInput,
} from "@plyco/shared"

export interface ProviderRepository {
  listBusinessActivities(organizationId: string): Promise<BusinessActivity[]>
  createBusinessActivity(
    organizationId: string,
    input: BusinessActivityInput,
  ): Promise<BusinessActivity>
  updateBusinessActivity(
    organizationId: string,
    id: string,
    input: BusinessActivityInput,
  ): Promise<BusinessActivity | null>
  deleteBusinessActivity(organizationId: string, id: string): Promise<boolean>
  listOrganizationProviders(organizationId: string): Promise<OrganizationProvider[]>
  createOrganizationProvider(organizationId: string, input: OrganizationProviderInput): Promise<OrganizationProvider>
  updateOrganizationProvider(
    organizationId: string,
    id: string,
    input: OrganizationProviderInput,
  ): Promise<OrganizationProvider | null>
  deleteOrganizationProvider(organizationId: string, id: string): Promise<boolean>
  listServiceProviderUsage(organizationId: string): Promise<ServiceProviderUsage[]>
  createServiceProviderUsage(
    organizationId: string,
    input: ServiceProviderUsageInput,
  ): Promise<ServiceProviderUsage>
  updateServiceProviderUsage(
    organizationId: string,
    id: string,
    input: ServiceProviderUsageInput,
  ): Promise<ServiceProviderUsage | null>
  deleteServiceProviderUsage(organizationId: string, id: string): Promise<boolean>
}
