export interface RuleSuppressionRepository {
  listSuppressedRuleIds(organizationId: string): Promise<string[]>
  suppressRule(organizationId: string, ruleId: string): Promise<void>
  restoreRule(organizationId: string, ruleId: string): Promise<void>
}
