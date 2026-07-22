' slug: technical-and-organizational-measures
' name: Technical and Organizational Measures (TOMs) Annex
' description: A contract-ready annex describing the technical and organizational safeguards applied to personal data processing.

# Annex: Technical and Organizational Measures

**Organization:** {{ organization.legalEntityName or organization.name }}  
{% if policy.version %}**Version:** {{ policy.version }}  
{% endif %}{% if policy.lastUpdatedDate %}**Last updated:** {{ policy.lastUpdatedDate }}
{% endif %}

## 1. Purpose and scope

This Annex describes the technical and organizational measures maintained by {{ organization.legalEntityName or organization.name }} to protect personal data processed in connection with the services below. The measures are designed to provide a level of security appropriate to the risk, taking into account the nature, scope, context, and purposes of processing.

{% if services.all.length > 1 %}
The measures apply to the following services:

{% for service in services.all -%}
- {{ service.name }}{% if service.description %}: {{ service.description }}{% endif %}
{% endfor %}
{% elif service.name %}
The measures apply to {{ service.name }}{% if service.description %}: {{ service.description }}{% endif %}.
{% endif %}

{% if dataHandling.dataTypesStoredHasValue %}
The categories of personal data in scope include:

{% for dataType in dataHandling.dataTypesStored -%}
- **{{ dataType.name }}**{% if dataType.description %}: {{ dataType.description }}{% endif %}{% if dataType.isSensitive %} _(sensitive)_{% endif %}
{% endfor %}
{% endif %}

## 2. Information security organization

{{ organization.legalEntityName or organization.name }} applies the measures described in this Annex according to the sensitivity of the personal data and the risks presented by the applicable processing. Responsibilities for implementing and maintaining these measures are assigned within the organization, and the measures are reviewed as services, processing activities, and risks change.

{% if access.securityTrainingRequiredHasValue or access.confidentialityAgreementsRequiredHasValue %}
### Personnel security

{% if access.securityTrainingRequiredHasValue %}- Personnel complete security awareness training upon joining and on a recurring basis.
{% endif %}{% if access.confidentialityAgreementsRequiredHasValue %}- Personnel are bound by confidentiality obligations covering customer and company data.
{% endif %}
{% endif %}

{% if security.accessControl.leastPrivilegeHasValue or security.accessControl.roleBasedAccessHasValue or security.accessControl.adminApprovalRequiredHasValue or security.accessControl.accessReviewCadenceLabel or access.accessReviewsPerformedHasValue or access.offboardingProcessExistsHasValue or (access.sharedAccountsExistAnswered and not access.sharedAccountsExist) or security.authentication.mfaRequiredHasValue or security.authentication.ssoSupportedHasValue or security.authentication.passwordManagerRequiredHasValue %}
## 3. Access control and authentication

{% if security.accessControl.leastPrivilegeHasValue %}- Access is granted according to least-privilege principles.
{% endif %}{% if security.accessControl.roleBasedAccessHasValue %}- Access is assigned through defined roles.
{% endif %}{% if security.accessControl.adminApprovalRequiredHasValue %}- Administrative and other privileged access requires explicit approval.
{% endif %}{% if security.accessControl.accessReviewCadenceLabel %}- Access rights are reviewed on a {{ security.accessControl.accessReviewCadenceLabel | lower }} basis.
{% elif access.accessReviewsPerformedHasValue %}- Access rights to critical systems are reviewed periodically.
{% endif %}{% if access.offboardingProcessExistsHasValue %}- A defined offboarding process removes access promptly when personnel leave or change roles.
{% endif %}{% if access.sharedAccountsExistAnswered and not access.sharedAccountsExist %}- Shared user accounts are not permitted on critical systems.
{% endif %}{% if security.authentication.mfaRequiredHasValue %}- Multi-factor authentication is required for workforce access to critical systems.
{% endif %}{% if security.authentication.ssoSupportedHasValue %}- Single sign-on is used to centralize workforce authentication where supported.
{% endif %}{% if security.authentication.passwordManagerRequiredHasValue %}- Personnel must use an approved password manager for work credentials.
{% endif %}
{% endif %}

{% if security.encryption.atRestAlgorithmLabel or infrastructure.encryptionAtRestHasValue or security.encryption.inTransitMinimumTlsVersionLabel or infrastructure.encryptionInTransitHasValue or security.encryption.keyManagementProviderLabel or security.encryption.keyManagementProvider == "none" or infrastructure.encryptedDevicesRequiredHasValue or (privacy.productionDataInDevelopmentAnswered and not privacy.productionDataInDevelopment) %}
## 4. Data protection and encryption

{% if security.encryption.atRestAlgorithmLabel %}- Data at rest is encrypted using {{ security.encryption.atRestAlgorithmLabel }}.
{% elif infrastructure.encryptionAtRestHasValue %}- Data at rest is encrypted.
{% endif %}{% if security.encryption.inTransitMinimumTlsVersionLabel %}- Data in transit is protected using {{ security.encryption.inTransitMinimumTlsVersionLabel }} or higher.
{% elif infrastructure.encryptionInTransitHasValue %}- Data in transit is protected using industry-standard transport encryption.
{% endif %}{% if security.encryption.keyManagementProvider == "none" %}- Encryption keys are managed using controls provided by the relevant infrastructure providers.
{% elif security.encryption.keyManagementProviderLabel %}- Encryption keys are managed using {{ security.encryption.keyManagementProviderLabel }}.
{% endif %}{% if infrastructure.encryptedDevicesRequiredHasValue %}- Company devices used to access customer data must use full-disk encryption.
{% endif %}{% if privacy.productionDataInDevelopmentAnswered and not privacy.productionDataInDevelopment %}- Production customer data is not used in development or test environments.
{% endif %}
{% endif %}

{% if services.hasHostingRegion or infrastructure.organizationProviders.length %}
## 5. Infrastructure and processing locations

{% for service in services.all %}
{% if service.privacy.primaryHostingRegionLabel %}- {% if services.all.length > 1 %}{{ service.name }} is{% else %}The service is{% endif %} primarily hosted in {{ service.privacy.primaryHostingRegionLabel }}.
{% endif %}{% endfor %}
{% if infrastructure.organizationProviders.length %}Critical infrastructure and platform services are operated using established providers selected through the organization's vendor-management process.
{% endif %}
{% endif %}

{% if security.developmentSecurity.codeReviewRequiredHasValue or security.developmentSecurity.dependencySecurityMonitoringHasValue or security.developmentSecurity.secretScanningHasValue or security.developmentSecurity.automatedTestingBeforeDeploymentHasValue or security.developmentSecurity.cicdDeploymentProcessHasValue or security.developmentSecurity.productionDeploymentApprovalRequiredHasValue or (security.vulnerabilityManagement.scanningCadence and security.vulnerabilityManagement.scanningCadence != "none" and security.vulnerabilityManagement.scanningCadence != "not_defined") or security.vulnerabilityManagement.patchingSlaCriticalDaysHasValue or security.vulnerabilityManagement.patchingSlaHighDaysHasValue or (security.vulnerabilityManagement.penetrationTestingStrategy == "external" and (security.vulnerabilityManagement.penetrationTestingCadenceLabel or security.vulnerabilityManagement.penetrationTestLastDate)) %}
## 6. Secure development and vulnerability management

{% if security.developmentSecurity.codeReviewRequiredHasValue %}- Code changes require review before they are merged.
{% endif %}{% if security.developmentSecurity.dependencySecurityMonitoringHasValue %}- Software dependencies are monitored for known security vulnerabilities.
{% endif %}{% if security.developmentSecurity.secretScanningHasValue %}- Source code is scanned for exposed credentials and secrets.
{% endif %}{% if security.developmentSecurity.automatedTestingBeforeDeploymentHasValue %}- Automated tests must pass before changes are deployed.
{% endif %}{% if security.developmentSecurity.cicdDeploymentProcessHasValue %}- Production deployments use a defined CI/CD process.
{% endif %}{% if security.developmentSecurity.productionDeploymentApprovalRequiredHasValue %}- Production deployments require approval before release.
{% endif %}{% if security.vulnerabilityManagement.scanningCadence and security.vulnerabilityManagement.scanningCadence != "none" and security.vulnerabilityManagement.scanningCadence != "not_defined" %}- Applications, dependencies, and infrastructure are scanned for known vulnerabilities on a {{ security.vulnerabilityManagement.scanningCadenceLabel | lower }} basis.
{% endif %}{% if security.vulnerabilityManagement.patchingSlaCriticalDaysHasValue %}- Critical vulnerabilities have a target remediation period of {{ security.vulnerabilityManagement.patchingSlaCriticalDays }} days.
{% endif %}{% if security.vulnerabilityManagement.patchingSlaHighDaysHasValue %}- High-severity vulnerabilities have a target remediation period of {{ security.vulnerabilityManagement.patchingSlaHighDays }} days.
{% endif %}{% if security.vulnerabilityManagement.penetrationTestingStrategy == "external" and security.vulnerabilityManagement.penetrationTestingCadenceLabel %}- Independent third parties perform penetration testing on a {{ security.vulnerabilityManagement.penetrationTestingCadenceLabel | lower }} basis.
{% endif %}{% if security.vulnerabilityManagement.penetrationTestingStrategy == "external" and security.vulnerabilityManagement.penetrationTestLastDate %}- The most recent independent penetration test was completed on {{ security.vulnerabilityManagement.penetrationTestLastDate }}.
{% endif %}
{% endif %}

{% if security.logging.centralizedLoggingHasValue or (security.logging.securityMonitoringHasValue and security.logging.securityMonitoring != "none") %}
## 7. Logging and security monitoring

{% if security.logging.centralizedLoggingHasValue %}- Security-relevant logs are centralized to support investigation and operational review.
{% endif %}{% if security.logging.securityMonitoringHasValue and security.logging.securityMonitoring != "none" %}- Security events are monitored using {{ security.logging.securityMonitoringLabel | lower }} processes to identify suspicious activity and operational issues.
{% endif %}
{% endif %}

{% if infrastructure.backupsEnabledHasValue %}
## 8. Availability, resilience, and recovery

- Critical production data is backed up{% if security.backups.backupCadenceLabel %} on a {{ security.backups.backupCadenceLabel | lower }} basis{% endif %}.
{% if security.backups.backupRetentionDaysHasValue %}- Backups are retained for {{ security.backups.backupRetentionDays }} days.
{% endif %}{% if security.backups.restoreTestingCadence and security.backups.restoreTestingCadence != "none" %}- Backup restoration is tested on a {{ security.backups.restoreTestingCadenceLabel | lower }} basis.
{% endif %}
{% endif %}

{% if security.incidentResponse.planExistsHasValue %}
## 9. Security incident management

- A documented process is maintained for identifying, containing, investigating, remediating, and learning from security incidents.
{% if security.incidentResponse.notificationTimelineLabel %}- When an incident requires customer notification, affected customers are notified {{ security.incidentResponse.notificationTimelineLabel | lower }}.
{% endif %}{% if security.incidentResponse.customerNotificationProcessLabel %}- Customer notifications are delivered via {{ security.incidentResponse.customerNotificationProcessLabel | lower }}.
{% endif %}{% if security.incidentResponse.lastTestedDate %}- The incident response process was last tested on {{ security.incidentResponse.lastTestedDate }}.
{% endif %}
{% endif %}

{% if security.vendorRisk.vendorReviewRequiredHasValue or security.vendorRisk.dpaRequiredForProcessorsHasValue or vendors.dataProcessorsHasValue %}
## 10. Supplier and subprocessor security

{% if security.vendorRisk.vendorReviewRequiredHasValue %}- Vendors with access to critical systems or customer data are assessed before use{% if security.vendorRisk.vendorReviewCadenceLabel %} and reviewed on a {{ security.vendorRisk.vendorReviewCadenceLabel | lower }} basis{% endif %}.
{% elif vendors.dataProcessorsHasValue %}- Vendors that process customer data are assessed before use.
{% endif %}{% if security.vendorRisk.dpaRequiredForProcessorsHasValue %}- Data processing agreements are required for vendors that process personal data on the organization's behalf.
{% endif %}- Current data processors and subprocessors are maintained in the organization's dedicated subprocessors document.
{% endif %}

{% if privacy.retentionPolicyExistsHasValue %}
## 11. Retention and disposal

Data-retention practices are maintained to delete or anonymize personal data when it is no longer required for the purposes for which it was processed, subject to applicable legal and contractual retention requirements.
{% endif %}

## 12. Review of measures

{{ organization.legalEntityName or organization.name }} may update these measures as technologies, risks, and services evolve, provided that updates do not materially reduce the overall protection of personal data during the applicable processing term.

{% if organization.securityContactEmail %}Security questions concerning these measures may be directed to {{ organization.securityContactEmail }}.{% elif organization.contactEmail %}Questions concerning these measures may be directed to {{ organization.contactEmail }}.{% endif %}
