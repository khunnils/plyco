import { type RuleSuppressionRepository } from "./repository.js"

export class InMemoryRuleSuppressionRepository implements RuleSuppressionRepository {
  private readonly suppressions = new Map<string, Set<string>>()

  async listSuppressedRuleIds(organizationId: string): Promise<string[]> {
    return [...(this.suppressions.get(organizationId) ?? [])].sort()
  }

  async suppressRule(organizationId: string, ruleId: string): Promise<void> {
    const organizationSuppressions =
      this.suppressions.get(organizationId) ?? new Set<string>()
    organizationSuppressions.add(ruleId)
    this.suppressions.set(organizationId, organizationSuppressions)
  }

  async restoreRule(organizationId: string, ruleId: string): Promise<void> {
    this.suppressions.get(organizationId)?.delete(ruleId)
  }
}
