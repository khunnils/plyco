' slug: security-questionnaire-response-pack
' name: Security Questionnaire Response Pack
' description: A concise customer diligence response pack covering organization, hosting, access, encryption, development, monitoring, vulnerabilities, incidents, resilience, privacy, and vendors.

# {{ organization.name }} Security Questionnaire Response Pack

{% if policy.version %}_Version {{ policy.version }}_{% endif %}
{% if policy.lastUpdatedDate %}_Last updated: {{ policy.lastUpdatedDate }}_{% endif %}

This response pack summarizes security and privacy practices recorded by {{ organization.legalEntityName or organization.name }} for common customer diligence questions. “Not recorded” means the workspace does not contain an answer and should not be interpreted as either yes or no.

## Organization and service scope

| Question | Response |
| --- | --- |
| Legal entity | {{ organization.legalEntityName or organization.name }} |
| Headquarters or primary country | {{ organization.country or "Not recorded" }} |
| Employee count | {{ organization.employeeCount or "Not recorded" }} |
| Compliance goals | {{ organization.complianceGoals | join(", ") or "Not recorded" }} |
| Handles personally identifiable information | {% if organization.handlesPii == true %}Yes{% elif organization.handlesPii == false %}No{% else %}Not recorded{% endif %} |
| Handles sensitive data | {% if organization.handlesSensitiveData == true %}Yes{% elif organization.handlesSensitiveData == false %}No{% else %}Not recorded{% endif %} |

{% if services.all.length %}
### Services

| Service | Description | Processes customer data | Primary hosting region |
| --- | --- | --- | --- |
{% for service in services.all -%}
| {{ service.name }} | {{ service.description or "Not recorded" }} | {% if service.processesCustomerData %}Yes{% else %}No{% endif %} | {{ service.privacy.primaryHostingRegionLabel or "Not recorded" }} |
{% endfor %}
{% endif %}

## Identity and access management

| Question | Response |
| --- | --- |
| Is least privilege required? | {% if security.accessControl.leastPrivilege == true %}Yes{% elif security.accessControl.leastPrivilege == false %}No{% else %}Not recorded{% endif %} |
| Is role-based access used? | {% if security.accessControl.roleBasedAccess == true %}Yes{% elif security.accessControl.roleBasedAccess == false %}No{% else %}Not recorded{% endif %} |
| Does privileged access require approval? | {% if security.accessControl.adminApprovalRequired == true %}Yes{% elif security.accessControl.adminApprovalRequired == false %}No{% else %}Not recorded{% endif %} |
| Is MFA required? | {% if security.authentication.mfaRequired == true %}Yes{% elif security.authentication.mfaRequired == false %}No{% else %}Not recorded{% endif %} |
| Is SSO used? | {% if security.authentication.ssoSupported == true %}Yes{% elif security.authentication.ssoSupported == false %}No{% else %}Not recorded{% endif %} |
| Are shared accounts present? | {% if access.sharedAccountsExist == true %}Yes{% elif access.sharedAccountsExist == false %}No{% else %}Not recorded{% endif %} |
| Are access reviews performed? | {% if access.accessReviewsPerformed == true %}Yes{% elif access.accessReviewsPerformed == false %}No{% else %}Not recorded{% endif %}{% if security.accessControl.accessReviewCadenceLabel %}; {{ security.accessControl.accessReviewCadenceLabel }}{% endif %} |
| Is there a defined offboarding process? | {% if access.offboardingProcessExists == true %}Yes{% elif access.offboardingProcessExists == false %}No{% else %}Not recorded{% endif %} |
| Is security training required? | {% if access.securityTrainingRequired == true %}Yes{% elif access.securityTrainingRequired == false %}No{% else %}Not recorded{% endif %} |
| Are confidentiality agreements required? | {% if access.confidentialityAgreementsRequired == true %}Yes{% elif access.confidentialityAgreementsRequired == false %}No{% else %}Not recorded{% endif %} |

## Data protection and infrastructure

| Question | Response |
| --- | --- |
| Is data encrypted at rest? | {% if infrastructure.encryptionAtRest == true %}Yes{% elif infrastructure.encryptionAtRest == false %}No{% else %}Not recorded{% endif %}{% if security.encryption.atRestAlgorithmLabel %}; {{ security.encryption.atRestAlgorithmLabel }}{% endif %} |
| Is data encrypted in transit? | {% if infrastructure.encryptionInTransit == true %}Yes{% elif infrastructure.encryptionInTransit == false %}No{% else %}Not recorded{% endif %}{% if security.encryption.inTransitMinimumTlsVersionLabel %}; minimum {{ security.encryption.inTransitMinimumTlsVersionLabel }}{% endif %} |
| Are company devices encrypted? | {% if infrastructure.encryptedDevicesRequired == true %}Yes{% elif infrastructure.encryptedDevicesRequired == false %}No{% else %}Not recorded{% endif %} |
| Is centralized logging enabled? | {% if infrastructure.centralizedLoggingEnabled == true %}Yes{% elif infrastructure.centralizedLoggingEnabled == false %}No{% else %}Not recorded{% endif %} |
| Security monitoring approach | {{ security.logging.securityMonitoringLabel or "Not recorded" }} |
| Is production data used in development? | {% if privacy.productionDataInDevelopment == true %}Yes{% elif privacy.productionDataInDevelopment == false %}No{% else %}Not recorded{% endif %} |

## Secure development and vulnerability management

| Question | Response |
| --- | --- |
| Is code review required? | {% if security.developmentSecurity.codeReviewRequired == true %}Yes{% elif security.developmentSecurity.codeReviewRequired == false %}No{% else %}Not recorded{% endif %} |
| Are dependencies monitored for vulnerabilities? | {% if security.developmentSecurity.dependencySecurityMonitoring == true %}Yes{% elif security.developmentSecurity.dependencySecurityMonitoring == false %}No{% else %}Not recorded{% endif %} |
| Is secret scanning used? | {% if security.developmentSecurity.secretScanning == true %}Yes{% elif security.developmentSecurity.secretScanning == false %}No{% else %}Not recorded{% endif %} |
| Are automated tests required before deployment? | {% if security.developmentSecurity.automatedTestingBeforeDeployment == true %}Yes{% elif security.developmentSecurity.automatedTestingBeforeDeployment == false %}No{% else %}Not recorded{% endif %} |
| Is a CI/CD deployment process used? | {% if security.developmentSecurity.cicdDeploymentProcess == true %}Yes{% elif security.developmentSecurity.cicdDeploymentProcess == false %}No{% else %}Not recorded{% endif %} |
| Is production deployment approval required? | {% if security.developmentSecurity.productionDeploymentApprovalRequired == true %}Yes{% elif security.developmentSecurity.productionDeploymentApprovalRequired == false %}No{% else %}Not recorded{% endif %} |
| Vulnerability scanning cadence | {{ security.vulnerabilityManagement.scanningCadenceLabel or "Not recorded" }} |
| Critical vulnerability patching SLA | {% if security.vulnerabilityManagement.patchingSlaCriticalDaysHasValue %}{{ security.vulnerabilityManagement.patchingSlaCriticalDays }} days{% else %}Not recorded{% endif %} |
| High vulnerability patching SLA | {% if security.vulnerabilityManagement.patchingSlaHighDaysHasValue %}{{ security.vulnerabilityManagement.patchingSlaHighDays }} days{% else %}Not recorded{% endif %} |
| Penetration testing approach | {{ security.vulnerabilityManagement.penetrationTestingStrategyLabel or "Not recorded" }}{% if security.vulnerabilityManagement.penetrationTestingCadenceLabel %}; {{ security.vulnerabilityManagement.penetrationTestingCadenceLabel }}{% endif %} |
| Vulnerability disclosure program | {% if security.vulnerabilityManagement.vulnerabilityDisclosureProgramExists == true %}Yes{% if security.vulnerabilityManagement.vulnerabilityDisclosureUrl %}; {{ security.vulnerabilityManagement.vulnerabilityDisclosureUrl }}{% endif %}{% elif security.vulnerabilityManagement.vulnerabilityDisclosureProgramExists == false %}No{% else %}Not recorded{% endif %} |

## Incident response and resilience

| Question | Response |
| --- | --- |
| Is there an incident response plan? | {% if security.incidentResponse.planExists == true %}Yes{% elif security.incidentResponse.planExists == false %}No{% else %}Not recorded{% endif %} |
| Customer notification timeline | {{ security.incidentResponse.notificationTimelineLabel or "Not recorded" }} |
| Incident response last tested | {{ security.incidentResponse.lastTestedDate or "Not recorded" }} |
| Are backups enabled? | {% if infrastructure.backupsEnabled == true %}Yes{% elif infrastructure.backupsEnabled == false %}No{% else %}Not recorded{% endif %} |
| Backup cadence | {{ security.backups.backupCadenceLabel or "Not recorded" }} |
| Backup retention | {% if security.backups.backupRetentionDaysHasValue %}{{ security.backups.backupRetentionDays }} days{% else %}Not recorded{% endif %} |
| Restore testing cadence | {{ security.backups.restoreTestingCadenceLabel or "Not recorded" }} |

## Vendor and privacy management

| Question | Response |
| --- | --- |
| Are vendor security reviews required? | {% if security.vendorRisk.vendorReviewRequired == true %}Yes{% elif security.vendorRisk.vendorReviewRequired == false %}No{% else %}Not recorded{% endif %} |
| Vendor review cadence | {{ security.vendorRisk.vendorReviewCadenceLabel or "Not recorded" }} |
| Are DPAs required for processors? | {% if security.vendorRisk.dpaRequiredForProcessors == true %}Yes{% elif security.vendorRisk.dpaRequiredForProcessors == false %}No{% else %}Not recorded{% endif %} |
| Does a retention policy exist? | {% if privacy.retentionPolicyExists == true %}Yes{% elif privacy.retentionPolicyExists == false %}No{% else %}Not recorded{% endif %} |
| Are cross-border transfers recorded? | {% if privacy.crossBorderTransfers == true %}Yes; {{ privacy.transferMechanismLabels | join(", ") or "mechanism not recorded" }}{% elif privacy.crossBorderTransfers == false %}No{% else %}Not recorded{% endif %} |
| Are AI-enabled activities recorded? | {% if services.usesAi %}Yes{% else %}No{% endif %} |

{% if vendors.dataProcessorsHasValue %}
Recorded processors and subprocessors are available in the organization’s Subprocessors document and DPA Processing Details Annex.
{% endif %}

## Contact

Security questions may be sent to {% if organization.securityContactEmail %}{{ organization.securityContactEmail }}{% elif organization.contactEmail %}{{ organization.contactEmail }}{% else %}the organization’s security contact{% endif %}.

