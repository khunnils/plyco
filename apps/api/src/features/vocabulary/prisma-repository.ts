import {
  countrySchema,
  vocabularyCodeSchema,
  vocabularyCodeSetSchema,
  type Country,
  type Vocabulary,
  type VocabularyCode,
  type VocabularyCodeInput,
} from "@plyco/shared";
import { prisma, type PrismaClient } from "@plyco/db";

import { countries } from "./reference-data.js";
import { type VocabularyRepository } from "./repository.js";

export class PrismaVocabularyRepository implements VocabularyRepository {
  constructor(private readonly client: PrismaClient = prisma) {}

  async listCountries(): Promise<Country[]> {
    await this.seedCountries();
    const records = await this.client.country.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
    });

    return records.map((record) => countrySchema.parse(record));
  }

  async listVocabulary(organizationId: string): Promise<Vocabulary> {
    await this.cloneOrganizationVocabulary(organizationId);
    const [systemCodeSets, organizationCodeSets] = await Promise.all([
      this.client.systemCodeSet.findMany({
        where: { isSystem: true },
        include: {
          codes: { orderBy: [{ sortOrder: "asc" }, { name: "asc" }] },
        },
        orderBy: { name: "asc" },
      }),
      this.client.organizationCodeSet.findMany({
        where: { organizationId },
        include: {
          codes: {
            where: { deletedAt: null },
            orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
          },
        },
        orderBy: { name: "asc" },
      }),
    ]);

    return {
      codeSets: [
        ...systemCodeSets.map((codeSet) =>
          vocabularyCodeSetSchema.parse({
            id: codeSet.id,
            codeSetId: codeSet.id,
            name: codeSet.name,
            description: codeSet.description,
            isSystem: true,
            codes: codeSet.codes.map((code) =>
              vocabularyCodeSchema.parse({
                id: code.id,
                codeId: code.codeId,
                name: code.name,
                sortOrder: code.sortOrder,
                active: code.active,
                isSystem: true,
              }),
            ),
          }),
        ),
        ...organizationCodeSets.map((codeSet) =>
          vocabularyCodeSetSchema.parse({
            id: codeSet.id,
            codeSetId: codeSet.systemCodeSetId,
            name: codeSet.name,
            description: codeSet.description,
            isSystem: false,
            codes: codeSet.codes.map((code) =>
              vocabularyCodeSchema.parse({
                id: code.id,
                codeId: code.codeId,
                name: code.name,
                sortOrder: code.sortOrder,
                active: code.active,
                isSystem: false,
              }),
            ),
          }),
        ),
      ],
    };
  }

  async cloneOrganizationVocabulary(organizationId: string): Promise<void> {
    const systemCodeSets = await this.client.systemCodeSet.findMany({
      where: { isSystem: false },
      include: {
        codes: { orderBy: [{ sortOrder: "asc" }, { name: "asc" }] },
      },
    });

    const existingCodeSets = await this.client.organizationCodeSet.findMany({
      where: { organizationId },
      select: {
        id: true,
        systemCodeSetId: true,
        codes: { select: { codeId: true } },
      },
    });
    const existingBySystemId = new Map(
      existingCodeSets.map((record) => [record.systemCodeSetId, record]),
    );

    await this.client.$transaction(async (tx) => {
      for (const codeSet of systemCodeSets) {
        const existingCodeSet = existingBySystemId.get(codeSet.id);
        let organizationCodeSetId = existingCodeSet?.id;

        if (!organizationCodeSetId) {
          const created = await tx.organizationCodeSet.create({
            data: {
              organizationId,
              systemCodeSetId: codeSet.id,
              name: codeSet.name,
              description: codeSet.description,
              codes: {
                create: codeSet.codes.map((code) => ({
                  systemCodeId: code.id,
                  codeId: code.codeId,
                  name: code.name,
                  sortOrder: code.sortOrder,
                  active: code.active,
                })),
              },
            },
          });
          organizationCodeSetId = created.id;
          existingBySystemId.set(codeSet.id, {
            id: organizationCodeSetId,
            systemCodeSetId: codeSet.id,
            codes: codeSet.codes.map((code) => ({ codeId: code.codeId })),
          });
          continue;
        }

        const existingCodeIds = new Set(
          (existingCodeSet?.codes ?? []).map((code) => code.codeId),
        );
        const missingCodes = codeSet.codes.filter(
          (code) => !existingCodeIds.has(code.codeId),
        );

        if (missingCodes.length > 0) {
          await tx.organizationCode.createMany({
            data: missingCodes.map((code) => ({
              organizationCodeSetId,
              systemCodeId: code.id,
              codeId: code.codeId,
              name: code.name,
              sortOrder: code.sortOrder,
              active: code.active,
            })),
          });
        }

        const existingCodesToUpdate = codeSet.codes.filter(
          (code) => existingCodeIds.has(code.codeId),
        );
        for (const code of existingCodesToUpdate) {
          await tx.organizationCode.updateMany({
            where: {
              organizationCodeSetId,
              codeId: code.codeId,
              systemCodeId: code.id,
            },
            data: {
              sortOrder: code.sortOrder,
            },
          });
        }
      }
    });
  }

  async createOrganizationCode(
    organizationId: string,
    codeSetId: string,
    input: VocabularyCodeInput,
  ): Promise<VocabularyCode | null> {
    const codeSet = await this.organizationCodeSet(organizationId, codeSetId);

    if (!codeSet) {
      return null;
    }

    const existing = await this.client.organizationCode.findFirst({
      where: { organizationCodeSetId: codeSet.id, codeId: input.codeId },
      select: { id: true },
    });

    if (existing) {
      return null;
    }

    const count = await this.client.organizationCode.count({
      where: { organizationCodeSetId: codeSet.id },
    });
    const code = await this.client.organizationCode.create({
      data: {
        organizationCodeSetId: codeSet.id,
        codeId: input.codeId,
        name: input.name,
        active: input.active,
        sortOrder: count,
      },
    });

    return vocabularyCodeSchema.parse({
      id: code.id,
      codeId: code.codeId,
      name: code.name,
      sortOrder: code.sortOrder,
      active: code.active,
      isSystem: false,
    });
  }

  async updateOrganizationCode(
    organizationId: string,
    codeSetId: string,
    codeId: string,
    input: VocabularyCodeInput,
  ): Promise<VocabularyCode | null> {
    const codeSet = await this.organizationCodeSet(organizationId, codeSetId);

    if (!codeSet) {
      return null;
    }

    const current = await this.client.organizationCode.findFirst({
      where: { organizationCodeSetId: codeSet.id, codeId, deletedAt: null },
    });

    if (!current) {
      return null;
    }

    if (input.codeId !== codeId) {
      const duplicate = await this.client.organizationCode.findFirst({
        where: { organizationCodeSetId: codeSet.id, codeId: input.codeId },
        select: { id: true },
      });

      if (duplicate) {
        return null;
      }
    }

    const code = await this.client.organizationCode.update({
      where: { id: current.id },
      data: {
        codeId: input.codeId,
        name: input.name,
        active: input.active,
      },
    });

    return vocabularyCodeSchema.parse({
      id: code.id,
      codeId: code.codeId,
      name: code.name,
      sortOrder: code.sortOrder,
      active: code.active,
      isSystem: false,
    });
  }

  async deleteOrganizationCode(
    organizationId: string,
    codeSetId: string,
    codeId: string,
  ): Promise<boolean> {
    const codeSet = await this.organizationCodeSet(organizationId, codeSetId);

    if (!codeSet) {
      return false;
    }

    const code = await this.client.organizationCode.findFirst({
      where: { organizationCodeSetId: codeSet.id, codeId, deletedAt: null },
      select: { id: true },
    });

    if (!code) {
      return false;
    }

    await this.client.organizationCode.update({
      where: { id: code.id },
      data: { deletedAt: new Date() },
    });
    return true;
  }

  async codeExists(
    organizationId: string,
    codeSetId: string,
    codeId: string,
  ): Promise<boolean> {
    if (codeId === "none") {
      return true;
    }

    const systemCode = await this.client.systemCode.findFirst({
      where: { codeSetId, codeId, active: true, codeSet: { isSystem: true } },
      select: { id: true },
    });

    if (systemCode) {
      return true;
    }

    const organizationCode = await this.client.organizationCode.findFirst({
      where: {
        codeId,
        active: true,
        deletedAt: null,
        organizationCodeSet: { organizationId, systemCodeSetId: codeSetId },
      },
      select: { id: true },
    });

    return Boolean(organizationCode);
  }

  async countryExists(code: string): Promise<boolean> {
    await this.seedCountries();
    const country = await this.client.country.findUnique({
      where: { code },
      select: { active: true },
    });

    return country?.active ?? false;
  }

  private async seedCountries() {
    await Promise.all(
      countries.map((country) =>
        this.client.country.upsert({
          where: { code: country.code },
          create: country,
          update: { name: country.name, active: country.active },
        }),
      ),
    );
  }

  private async organizationCodeSet(organizationId: string, codeSetId: string) {
    await this.cloneOrganizationVocabulary(organizationId);
    return this.client.organizationCodeSet.findUnique({
      where: {
        organizationId_systemCodeSetId: {
          organizationId,
          systemCodeSetId: codeSetId,
        },
      },
      select: { id: true },
    });
  }
}
