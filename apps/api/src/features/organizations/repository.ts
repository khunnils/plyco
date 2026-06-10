import {
  type AccessProfile,
  type CompanyProfile,
  type DataHandlingProfile,
  type InfrastructureProfile,
  type OrganizationSecurityProfile,
  type PrivacyProfile,
  type Provider,
  type ServiceProfileInput,
} from "@plyco/shared";

export type SecurityProfileInput = {
  company: CompanyProfile;
  services: ServiceProfileInput[];
  privacy: PrivacyProfile;
  infrastructure: InfrastructureProfile;
  dataHandling: DataHandlingProfile;
  access: AccessProfile;
};

export interface OrganizationRepository {
  getOrganization(
    organizationId: string,
  ): Promise<OrganizationSecurityProfile | null>;
  upsertProfile(
    organizationId: string,
    input: SecurityProfileInput,
    providerCatalog: Provider[],
  ): Promise<OrganizationSecurityProfile>;
  listDataTypeNames(organizationId: string): Promise<string[]>;
  listDataTypeIds(organizationId: string): Promise<string[]>;
  listServiceIds(organizationId: string): Promise<string[]>;
  listBusinessActivityIds(organizationId: string): Promise<string[]>;
  listOrganizationProviderIds(organizationId: string): Promise<string[]>;
  reorderServices(organizationId: string, ids: string[]): Promise<void>;
  reorderDataTypes(organizationId: string, ids: string[]): Promise<void>;
}
