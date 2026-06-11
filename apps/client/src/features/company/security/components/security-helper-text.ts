export const securityHelperText = {
  codeReviewRequired: "Changes are reviewed by another person before they are merged.",
  dependencySecurityMonitoring:
    "Dependencies are monitored for known security vulnerabilities.",
  secretScanning: "Source code is scanned for exposed credentials and secrets.",
  automatedTestingBeforeDeployment:
    "Automated tests must pass before changes can be deployed.",
  cicdDeploymentProcess:
    "Production deployments run through a defined CI/CD process.",
  productionDeploymentApprovalRequired:
    "A person must approve changes before they are deployed to production.",
  scanningCadence:
    "How often you scan your app, dependencies, or infrastructure for known issues.",
  patchingSlaCriticalDaysStatus:
    "Whether you have a defined fix timeline for critical vulnerabilities.",
  patchingSlaCriticalDays: "How quickly critical vulnerabilities should be fixed.",
  patchingSlaHighDaysStatus:
    "Whether you have a defined fix timeline for high-severity vulnerabilities.",
  patchingSlaHighDays:
    "How quickly high-severity vulnerabilities should be fixed.",
  penetrationTestingStrategy:
    "The approach your organization takes for penetration testing.",
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
} as const
