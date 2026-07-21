import { prisma } from "@plyco/db"

import { type RuleSuppressionRepository } from "./repository.js"

export class PrismaRuleSuppressionRepository implements RuleSuppressionRepository {
  async listSuppressedRuleIds(organizationId: string): Promise<string[]> {
    const suppressions = await prisma.organizationRuleSuppression.findMany({
      where: { organizationId },
      orderBy: { ruleId: "asc" },
      select: { ruleId: true },
    })

    return suppressions.map(({ ruleId }) => ruleId)
  }

  async suppressRule(organizationId: string, ruleId: string): Promise<void> {
    await prisma.organizationRuleSuppression.upsert({
      where: { organizationId_ruleId: { organizationId, ruleId } },
      update: {},
      create: { organizationId, ruleId },
    })
  }

  async restoreRule(organizationId: string, ruleId: string): Promise<void> {
    await prisma.organizationRuleSuppression.deleteMany({
      where: { organizationId, ruleId },
    })
  }
}
