' slug: data-security-policy
' name: Data Security Policy
' description: A customer-facing data security policy based on access control, encryption, monitoring, incident response, backup, and vendor risk data.

# {{ organization.name }} Data Security Policy

{% if policy.version %}_Version {{ policy.version }}_{% endif %}
{% if policy.lastUpdatedDate %}_Last updated: {{ policy.lastUpdatedDate }}_{% endif %}

{{ organization.legalEntityName or organization.name }} maintains administrative, technical, and organizational safeguards designed to protect {{ service.name }} and the customer data we process. This policy summarizes the security controls we have in place.

## Scope

This policy applies to {{ service.name }} and the systems, infrastructure, and personnel involved in operating and supporting it.

{% if services.hasHostingRegion or infrastructure.organizationProviders.length %}
## Hosting and data residency

{% for service in services.all %}
{% if service.privacy.primaryHostingRegionLabel %}
{% if services.all.length > 1 %}{{ service.name }} is{% else %}Our service is{% endif %} primarily hosted in {{ service.privacy.primaryHostingRegionLabel }}.
{% endif %}
{% endfor %}
{% if infrastructure.organizationProviders.length %}
We build on established infrastructure and platform providers, including:

{% for provider in infrastructure.organizationProviders -%}
- {{ provider.name or provider.providerId }}{% if provider.systemType %} ({{ provider.systemType | replace("_", " ") | replace("-", " ") }}){% endif %}
{% endfor %}
{% endif %}
{% endif %}

{% if security.accessControl.leastPrivilegeHasValue or security.accessControl.roleBasedAccessHasValue or security.accessControl.adminApprovalRequiredHasValue or security.accessControl.accessReviewCadenceLabel or access.accessReviewsPerformedHasValue or access.offboardingProcessExistsHasValue or (access.sharedAccountsExistAnswered and not access.sharedAccountsExist) %}
## Access control

{% if security.accessControl.leastPrivilegeHasValue %}We apply least-privilege principles, granting access only to the systems and data each person needs.
{% endif %}
{% if security.accessControl.roleBasedAccessHasValue %}Access is granted through defined roles.
{% endif %}
{% if security.accessControl.adminApprovalRequiredHasValue %}Administrative and other privileged access requires explicit approval.
{% endif %}
{% if security.accessControl.accessReviewCadenceLabel %}We review access rights on a {{ security.accessControl.accessReviewCadenceLabel | lower }} basis.
{% endif %}
{% if access.accessReviewsPerformedHasValue %}Periodic access reviews are performed for critical systems.
{% endif %}
{% if access.offboardingProcessExistsHasValue %}We follow a defined offboarding process to remove access promptly when personnel leave or change roles.
{% endif %}
{% if access.sharedAccountsExistAnswered and not access.sharedAccountsExist %}We do not permit shared user accounts on critical systems.
{% endif %}
{% endif %}

{% if security.authentication.mfaRequiredHasValue or security.authentication.ssoSupportedHasValue or security.authentication.passwordManagerRequiredHasValue %}
## Authentication

{% if security.authentication.mfaRequiredHasValue %}Multi-factor authentication is required for workforce access to critical systems.
{% endif %}
{% if security.authentication.ssoSupportedHasValue %}Single sign-on is supported for workforce access.
{% endif %}
{% if security.authentication.passwordManagerRequiredHasValue %}Team members are required to use a password manager.
{% endif %}
{% endif %}

{% if access.securityTrainingRequiredHasValue or access.confidentialityAgreementsRequiredHasValue %}
## Personnel security

{% if access.securityTrainingRequiredHasValue %}All team members complete security awareness training when they join and on a recurring basis thereafter.
{% endif %}
{% if access.confidentialityAgreementsRequiredHasValue %}All team members are bound by confidentiality or non-disclosure agreements covering customer data.
{% endif %}
{% endif %}

{% if security.encryption.atRestAlgorithmLabel or dataHandling.encryptionAtRestHasValue or security.encryption.inTransitMinimumTlsVersionLabel or dataHandling.encryptionInTransitHasValue or security.encryption.keyManagementProviderLabel or infrastructure.encryptedDevicesRequiredHasValue %}
## Encryption and key management

{% if security.encryption.atRestAlgorithmLabel %}Data at rest is encrypted using {{ security.encryption.atRestAlgorithmLabel }}.
{% elif dataHandling.encryptionAtRestHasValue %}Data at rest is encrypted.
{% endif %}
{% if security.encryption.inTransitMinimumTlsVersionLabel %}Data in transit is protected using {{ security.encryption.inTransitMinimumTlsVersionLabel }} or higher.
{% elif dataHandling.encryptionInTransitHasValue %}Data in transit is encrypted using industry-standard transport encryption.
{% endif %}
{% if security.encryption.keyManagementProviderLabel %}Encryption keys are managed using {{ security.encryption.keyManagementProviderLabel }}.
{% endif %}
{% if infrastructure.encryptedDevicesRequiredHasValue %}Company devices used to access customer data are required to use full-disk encryption.
{% endif %}
{% endif %}

{% if security.logging.centralizedLoggingHasValue or security.logging.logRetentionDaysHasValue or security.logging.securityMonitoringOwnerLabel %}
## Logging and monitoring

{% if security.logging.centralizedLoggingHasValue %}Security-relevant logs are centralized to support monitoring and review.
{% endif %}
{% if security.logging.logRetentionDaysHasValue %}Security logs are retained for {{ security.logging.logRetentionDays }} days.
{% endif %}
{% if security.logging.securityMonitoringOwnerLabel %}Security monitoring is owned by {{ security.logging.securityMonitoringOwnerLabel }}.
{% endif %}
{% endif %}

{% if security.vulnerabilityManagement.scanningCadenceLabel or security.vulnerabilityManagement.patchingSlaCriticalDaysHasValue or security.vulnerabilityManagement.patchingSlaHighDaysHasValue %}
## Vulnerability management

{% if security.vulnerabilityManagement.scanningCadenceLabel %}We scan for vulnerabilities on a {{ security.vulnerabilityManagement.scanningCadenceLabel | lower }} basis.
{% endif %}
{% if security.vulnerabilityManagement.patchingSlaCriticalDaysHasValue %}We target remediation of critical vulnerabilities within {{ security.vulnerabilityManagement.patchingSlaCriticalDays }} days.
{% endif %}
{% if security.vulnerabilityManagement.patchingSlaHighDaysHasValue %}We target remediation of high-severity vulnerabilities within {{ security.vulnerabilityManagement.patchingSlaHighDays }} days.
{% endif %}
{% endif %}

{% if infrastructure.penetrationTestingCadenceLabel or infrastructure.penetrationTestLastDate %}
## Penetration testing

{% if infrastructure.penetrationTestingCadenceLabel %}We engage independent third parties to perform penetration testing on a {{ infrastructure.penetrationTestingCadenceLabel | lower }} basis.
{% endif %}
{% if infrastructure.penetrationTestLastDate %}Our most recent penetration test was completed on {{ infrastructure.penetrationTestLastDate }}.
{% endif %}
{% endif %}

{% if security.incidentResponse.planExistsHasValue or security.incidentResponse.notificationTimelineLabel or security.incidentResponse.customerNotificationProcessLabel or security.incidentResponse.lastTestedDate %}
## Incident response

{% if security.incidentResponse.planExistsHasValue %}We maintain a documented incident response plan.
{% endif %}
{% if security.incidentResponse.notificationTimelineLabel %}If an incident affects customer data, we notify affected customers {{ security.incidentResponse.notificationTimelineLabel | lower }}.
{% endif %}
{% if security.incidentResponse.customerNotificationProcessLabel %}Customer notifications are delivered via {{ security.incidentResponse.customerNotificationProcessLabel | lower }}.
{% endif %}
{% if security.incidentResponse.lastTestedDate %}Our incident response plan was last tested on {{ security.incidentResponse.lastTestedDate }}.
{% endif %}
{% endif %}

{% if infrastructure.backupsEnabledHasValue or security.backups.backupCadenceLabel or security.backups.backupRetentionDaysHasValue or security.backups.restoreTestingCadenceLabel %}
## Backups and recovery

{% if infrastructure.backupsEnabledHasValue or security.backups.backupCadenceLabel %}We back up critical data{% if security.backups.backupCadenceLabel %} on a {{ security.backups.backupCadenceLabel | lower }} basis{% endif %}.
{% endif %}
{% if security.backups.backupRetentionDaysHasValue %}Backups are retained for {{ security.backups.backupRetentionDays }} days.
{% endif %}
{% if security.backups.restoreTestingCadenceLabel %}We test our ability to restore from backups on a {{ security.backups.restoreTestingCadenceLabel | lower }} basis.
{% endif %}
{% endif %}

{% if (dataHandling.productionDataInDevelopmentAnswered and not dataHandling.productionDataInDevelopment) or dataHandling.retentionPolicyExistsHasValue %}
## Data protection

{% if dataHandling.productionDataInDevelopmentAnswered and not dataHandling.productionDataInDevelopment %}We do not use production customer data in development or test environments.
{% endif %}
{% if dataHandling.retentionPolicyExistsHasValue %}We maintain a data retention policy and delete or anonymize data when it is no longer needed.
{% endif %}
{% endif %}

{% if security.vendorRisk.vendorReviewRequiredHasValue or security.vendorRisk.dpaRequiredForProcessorsHasValue or vendors.dataProcessorsHasValue %}
## Vendor risk management

{% if security.vendorRisk.vendorReviewRequiredHasValue %}We assess the security practices of vendors that process customer data{% if security.vendorRisk.vendorReviewCadenceLabel %} on a {{ security.vendorRisk.vendorReviewCadenceLabel | lower }} basis{% endif %}.
{% endif %}
{% if security.vendorRisk.dpaRequiredForProcessorsHasValue %}We require data processing agreements with vendors that process personal data on our behalf.
{% endif %}

{% if vendors.dataProcessorsHasValue %}
The vendors that process customer data on our behalf are:

| Vendor | Purpose | Processing level | DPA status |
| --- | --- | --- | --- |
{% for vendor in vendors.dataProcessors -%}
| {{ vendor.name }} | {{ vendor.purpose or "—" }} | {{ vendor.dataProcessingLevel or "—" }} | {{ vendor.dpaStatus or "—" }} |
{% endfor %}
{% endif %}
{% endif %}

{% if infrastructure.vulnerabilityDisclosureProgramExistsHasValue %}
## Responsible disclosure

We welcome reports from security researchers and operate a responsible disclosure process. We ask that researchers give us a reasonable opportunity to investigate and remediate before any public disclosure.
{% if infrastructure.vulnerabilityDisclosureUrl %}Details of our disclosure program are available at {{ infrastructure.vulnerabilityDisclosureUrl }}.
{% endif %}
{% endif %}

## Reporting a security concern

{% if organization.securityContactEmail %}If you discover a security vulnerability or have a security concern, please contact us at {{ organization.securityContactEmail }}.{% elif organization.contactEmail %}If you discover a security vulnerability or have a security concern, please contact us at {{ organization.contactEmail }}.{% else %}If you discover a security vulnerability or have a security concern, please contact us so we can investigate promptly.{% endif %}
