import { type DuplicateServiceInput } from "@plyco/contracts";

export interface ServiceDuplicationRepository {
  duplicateService(
    organizationId: string,
    sourceServiceId: string,
    input: DuplicateServiceInput,
  ): Promise<string>;
}
