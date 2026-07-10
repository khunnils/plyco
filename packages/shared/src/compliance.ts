export const complianceFieldVisibility = {
  "businessActivity.legalBasis": ["gdpr"],
  "privacy.dpoStatus": ["gdpr"],
  "privacy.dpoName": ["gdpr"],
  "privacy.dpoEmail": ["gdpr"],
  "privacy.euRepresentativeStatus": ["gdpr"],
  "privacy.euRepresentativeName": ["gdpr"],
  "privacy.euRepresentativeAddress": ["gdpr"],
  "infrastructure.dpaRequiredForProcessors": ["gdpr"],
} as const;

export type ComplianceFieldKey = keyof typeof complianceFieldVisibility;

export const isComplianceFieldVisible = (
  fieldKey: ComplianceFieldKey | string,
  complianceGoals: string[] | null | undefined,
) => {
  const requiredGoals =
    complianceFieldVisibility[fieldKey as ComplianceFieldKey];

  return (
    !requiredGoals ||
    requiredGoals.some((goal) => complianceGoals?.includes(goal))
  );
};
