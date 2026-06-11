export const infrastructureHelperText = {
  cloudProviders:
    "The cloud platforms that host your product, databases, storage, or infrastructure.",
  sourceControlProvider: "Where your team stores and reviews source code.",
  authProvider:
    "The identity provider your team uses to sign in to work systems.",
  passwordManager:
    "The tool your team uses to store and share work passwords safely.",
  mfaEnabled:
    "Team members must use multi-factor authentication for core infrastructure tools.",
  encryptedDevicesRequired: "Team laptops or work devices use disk encryption.",
  atRestAlgorithm:
    "How stored data is encrypted in databases, disks, backups, or object storage.",
  inTransitMinimumTlsVersion:
    "The oldest TLS version your services allow for encrypted network traffic.",
  keyManagementProvider:
    "How encryption keys are managed, such as a cloud KMS or provider-managed keys.",
  centralizedLoggingEnabled:
    "Important system and application logs are collected in one place.",
  securityMonitoring:
    "Whether security monitoring is absent, performed manually, or automated.",
  scanningCadence:
    "How often you scan your app, dependencies, or infrastructure for known issues.",
  patchingSlaCriticalDaysStatus:
    "Whether you have a defined fix timeline for critical vulnerabilities.",
  patchingSlaCriticalDays:
    "How quickly critical vulnerabilities should be fixed.",
  patchingSlaHighDaysStatus:
    "Whether you have a defined fix timeline for high-severity vulnerabilities.",
  patchingSlaHighDays:
    "How quickly high-severity vulnerabilities should be fixed.",
  penetrationTestingStrategy:
    "The approach your organization takes for penetration testing (internal, external, etc).",
  penetrationTestingCadence:
    "How often an independent third party performs penetration testing.",
  penetrationTestLastDate:
    "The date of your most recent third-party penetration test.",
  vulnerabilityDisclosureProgramExists:
    "You offer a way for security researchers to report vulnerabilities responsibly.",
  vulnerabilityDisclosureUrl:
    "Where researchers can find your responsible disclosure or security.txt policy.",
  incidentResponsePlanExists:
    "You have a written plan for handling security incidents.",
  incidentNotificationTimeline:
    "How quickly you notify customers or stakeholders when notification is required.",
  customerNotificationProcess:
    "How customers are notified during a security incident.",
  incidentResponseLastTestedDate:
    "The last date you practiced or reviewed the incident response process.",
  backupsEnabled: "Important production data is backed up.",
  backupCadence: "How often backups are created.",
  backupRetentionDaysStatus:
    "Whether you have a defined retention period for backups.",
  backupRetentionDays: "How long backups are kept before deletion.",
  restoreTestingCadence:
    "How often you test that backups can actually be restored.",
  vendorReviewRequired:
    "You review vendors before using them for important systems or customer data.",
  vendorReviewCadence:
    "How often important vendors are reviewed after onboarding.",
  dpaRequiredForProcessors:
    "Processors that handle personal data need a signed data processing agreement.",
} as const
