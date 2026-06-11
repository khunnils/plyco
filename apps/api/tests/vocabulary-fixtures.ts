import { type VocabularyCodeSet } from "@plyco/shared";

const codeSet = (
  codeSetId: string,
  name: string,
  isSystem: boolean,
  codes: Array<[string, string]>,
): VocabularyCodeSet => ({
  id: codeSetId,
  codeSetId,
  name,
  description: "",
  usesHints: codeSetId === "industries",
  isSystem,
  codes: codes.map(([codeId, codeName], index) => ({
    id: `${codeSetId}:${codeId}`,
    codeId,
    name: codeName,
    description:
      codeId === "artificial_intelligence"
        ? "Products built around machine learning."
        : "",
    sortOrder: index,
    active: true,
    isSystem,
  })),
});

export const testVocabularyCodeSets: VocabularyCodeSet[] = [
  codeSet("industries", "Industries", false, [
    ["artificial_intelligence", "Artificial Intelligence"],
    ["technology_saas", "Technology / SaaS"],
    ["edtech", "EdTech"],
  ]),
  codeSet("regions", "Regions", true, [
    ["us", "United States"],
    ["eu", "European Union"],
    ["global", "Global"],
  ]),
  codeSet("compliance_goals", "Compliance Goals", false, [
    ["soc_2", "SOC 2"],
    ["gdpr", "GDPR"],
  ]),
  codeSet("service_user_types", "Service user types", false, [
    ["workspace_admins", "Workspace admins"],
    ["end_users", "End users"],
  ]),
  codeSet("service_customer_types", "Service customer types", false, [
    ["smb", "SMB"],
    ["mid_market", "Mid-market"],
  ]),
  codeSet("privacy_supported_rights", "Privacy supported rights", false, [
    ["access", "Access"],
    ["deletion", "Deletion"],
    ["correction", "Correction"],
    ["opt_out", "Opt-out"],
  ]),
  codeSet("privacy_request_methods", "Privacy request methods", false, [
    ["email", "Email"],
    ["web_form", "Web form"],
  ]),
  codeSet("privacy_marketing_opt_out_methods", "Privacy marketing opt-out methods", false, [
    ["unsubscribe_link", "Unsubscribe link"],
  ]),
  codeSet("privacy_transfer_mechanisms", "Privacy transfer mechanisms", false, [
    ["sccs", "SCCs"],
    ["dpf", "Data Privacy Framework"],
  ]),
  codeSet("privacy_dpo_statuses", "Privacy DPO statuses", false, [
    ["not_appointed", "Not appointed"],
    ["not_required", "Not required"],
  ]),
  codeSet("privacy_eu_representative_statuses", "Privacy EU representative statuses", false, [
    ["not_appointed", "Not appointed"],
    ["not_required", "Not required"],
  ]),
  codeSet("cookie_tracking_categories", "Cookie / tracking categories", false, [
    ["necessary", "Necessary"],
    ["analytics", "Analytics"],
    ["preference", "Preference"],
  ]),
  codeSet("privacy_cookie_consent_mechanisms", "Privacy cookie consent mechanisms", false, [
    ["cookie_banner", "Cookie banner"],
  ]),
  codeSet("subject_types", "Subject types", false, [
    ["administrator", "Administrator"],
    ["customer", "Customer"],
    ["end_user", "End User"],
  ]),
  codeSet("collection_methods", "Collection methods", false, [
    ["account_signup", "Account signup"],
    ["product_usage", "Product usage"],
  ]),
  codeSet("activity_role", "Activity role", false, [
    ["controller", "Controller"],
    ["processor", "Processor"],
  ]),
  codeSet("legal_basis", "Legal basis", false, [
    ["contract", "Contract"],
    ["consent", "Consent"],
  ]),
  codeSet("activity_retention_policies", "Activity retention policies", true, [
    ["fixed", "Fixed"],
    ["not_defined", "Not defined"],
  ]),
  codeSet("defined_statuses", "Defined statuses", true, [
    ["defined", "Defined"],
    ["not_defined", "Not defined"],
  ]),
  codeSet("dpa_status", "DPA status", true, [
    ["signed", "Signed"],
    ["under_review", "Under review"],
    ["not_required", "Not required"],
  ]),
  codeSet("provider_categories", "Provider categories", false, [
    ["source_control", "Source control"],
    ["payments", "Payments"],
  ]),
  codeSet("vendor_criticality", "Vendor criticality", true, [
    ["low", "Low"],
    ["medium", "Medium"],
    ["high", "High"],
    ["critical", "Critical"],
  ]),
  codeSet("data_processing_level", "Data processing level", true, [
    ["none", "None"],
    ["limited", "Limited"],
    ["subprocessor", "Subprocessor"],
  ]),
  codeSet("provider_system_types", "Provider system types", true, [
    ["auth", "Auth"],
    ["source_control", "Source control"],
    ["cloud", "Cloud"],
    ["password_manager", "Password manager"],
    ["analytics", "Analytics"],
    ["advertising", "Advertising"],
    ["issue_tracking", "Issue tracking"],
    ["newsletter", "Newsletter"],
  ]),
  codeSet("security_cadences", "Security cadences", false, [
    ["daily", "Daily"],
    ["weekly", "Weekly"],
    ["quarterly", "Quarterly"],
    ["annually", "Annually"],
  ]),
  codeSet("security_encryption_algorithms", "Security encryption algorithms", false, [
    ["aes_256", "AES-256"],
  ]),
  codeSet("security_tls_versions", "Security TLS versions", false, [
    ["tls_1_2", "TLS 1.2"],
  ]),
  codeSet("security_key_management_providers", "Security key management providers", false, [
    ["aws_kms", "AWS KMS"],
  ]),
  codeSet("security_monitoring_modes", "Security monitoring modes", false, [
    ["none", "None"],
    ["manual", "Manual"],
    ["automated", "Automated"],
  ]),
  codeSet("security_notification_timelines", "Security notification timelines", false, [
    ["within_72_hours", "Within 72 hours"],
  ]),
  codeSet("security_customer_notification_processes", "Security customer notification processes", false, [
    ["email_notice", "Email notice"],
  ]),
  codeSet("security_penetration_testing_strategies", "Security penetration testing strategies", false, [
    ["none", "None"],
    ["external", "External"],
  ]),
];
