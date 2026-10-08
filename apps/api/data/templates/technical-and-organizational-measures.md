' slug: technical-and-organizational-measures
' name: Technical and Organizational Measures (TOMs) Annex
' description: A contract-ready annex describing the technical and organizational safeguards applied to personal data processing.

# Annex: Technical and Organizational Measures

**Organization:** {{ organization.legalEntityName or organization.name }}{% if organization.legalEntityName %}{% if organization.customerNotes.legalEntityName %} {{ organization.customerNotes.legalEntityName }}{% endif %}{% endif %}{% if not organization.legalEntityName %}{% if organization.customerNotes.name %} {{ organization.customerNotes.name }}{% endif %}{% endif %}<br />
{% if policy.version %}**Version:** {{ policy.version }}<br />
{% endif %}{% if policy.lastUpdatedDate %}**Last updated:** {{ policy.lastUpdatedDate }}
{% endif %}

## 1. Purpose and scope

This Annex describes the technical and organizational measures maintained by {{ organization.legalEntityName or organization.name }}{% if organization.legalEntityName %}{% if organization.customerNotes.legalEntityName %} {{ organization.customerNotes.legalEntityName }}{% endif %}{% endif %}{% if not organization.legalEntityName %}{% if organization.customerNotes.name %} {{ organization.customerNotes.name }}{% endif %}{% endif %} to protect personal data processed in connection with the services below. The measures are designed to provide a level of security appropriate to the risk, taking into account the nature, scope, context, and purposes of processing.

{% if services.all.length > 1 %}
The measures apply to the following services:

{% for service in services.all -%}
- {{ service.name }}{% if service.customerNotes.name %} {{ service.customerNotes.name }}{% endif %}{% if service.description %}: {{ service.description }}{% if service.customerNotes.description %} {{ service.customerNotes.description }}{% endif %}{% endif %}
{% endfor %}
{% elif service.name %}
The measures apply to {{ service.name }}{% if service.customerNotes.name %} {{ service.customerNotes.name }}{% endif %}{% if service.description %}: {{ service.description }}{% if service.customerNotes.description %} {{ service.customerNotes.description }}{% endif %}{% endif %}.
{% endif %}

{% if dataHandling.dataTypesStoredHasValue %}
The categories of personal data in scope include:

{% for dataType in dataHandling.dataTypesStored -%}
- **{{ dataType.name }}{% if dataType.customerNotes.name %} {{ dataType.customerNotes.name }}{% endif %}**{% if dataType.description %}: {{ dataType.description }}{% if dataType.customerNotes.description %} {{ dataType.customerNotes.description }}{% endif %}{% endif %}{% if dataType.isSensitive %} _(sensitive)_{% if dataType.customerNotes.isSensitive %} {{ dataType.customerNotes.isSensitive }}{% endif %}{% endif %}
{% endfor %}
{% endif %}

## 2. Information security organization

{{ organization.legalEntityName or organization.name }}{% if organization.legalEntityName %}{% if organization.customerNotes.legalEntityName %} {{ organization.customerNotes.legalEntityName }}{% endif %}{% endif %}{% if not organization.legalEntityName %}{% if organization.customerNotes.name %} {{ organization.customerNotes.name }}{% endif %}{% endif %} applies the measures described in this Annex according to the sensitivity of the personal data and the risks presented by the applicable processing. Responsibilities for implementing and maintaining these measures are assigned within the organization, and the measures are reviewed as services, processing activities, and risks change.

{% if access.securityTrainingRequiredHasValue or access.confidentialityAgreementsRequiredHasValue %}
### Personnel security

{% if access.securityTrainingRequiredHasValue %}- Personnel complete security awareness training upon joining and on a recurring basis.{% if access.customerNotes.securityTrainingRequired %} {{ access.customerNotes.securityTrainingRequired }}{% endif %}
{% if access.customerNotes.securityTrainingRequired %} {{ access.customerNotes.securityTrainingRequired }}{% endif %}{% endif %}{% if access.confidentialityAgreementsRequiredHasValue %}- Personnel are bound by confidentiality obligations covering customer and company data.{% if access.customerNotes.confidentialityAgreementsRequired %} {{ access.customerNotes.confidentialityAgreementsRequired }}{% endif %}
{% if access.customerNotes.confidentialityAgreementsRequired %} {{ access.customerNotes.confidentialityAgreementsRequired }}{% endif %}{% endif %}
{% endif %}

{% if security.accessControl.leastPrivilegeHasValue or security.accessControl.roleBasedAccessHasValue or security.accessControl.adminApprovalRequiredHasValue or security.accessControl.accessReviewCadenceLabel or access.accessReviewsPerformedHasValue or access.offboardingProcessExistsHasValue or (access.sharedAccountsExistAnswered and not access.sharedAccountsExist) or security.authentication.mfaRequiredHasValue or security.authentication.ssoSupportedHasValue or security.authentication.passwordManagerRequiredHasValue %}
## 3. Access control and authentication

{% if security.accessControl.leastPrivilegeHasValue %}- Access is granted according to least-privilege principles.{% if security.accessControl.customerNotes.leastPrivilege %} {{ security.accessControl.customerNotes.leastPrivilege }}{% endif %}
{% if security.accessControl.customerNotes.leastPrivilege %} {{ security.accessControl.customerNotes.leastPrivilege }}{% endif %}{% endif %}{% if security.accessControl.roleBasedAccessHasValue %}- Access is assigned through defined roles.{% if security.accessControl.customerNotes.roleBasedAccess %} {{ security.accessControl.customerNotes.roleBasedAccess }}{% endif %}
{% if security.accessControl.customerNotes.roleBasedAccess %} {{ security.accessControl.customerNotes.roleBasedAccess }}{% endif %}{% endif %}{% if security.accessControl.adminApprovalRequiredHasValue %}- Administrative and other privileged access requires explicit approval.{% if security.accessControl.customerNotes.adminApprovalRequired %} {{ security.accessControl.customerNotes.adminApprovalRequired }}{% endif %}
{% if security.accessControl.customerNotes.adminApprovalRequired %} {{ security.accessControl.customerNotes.adminApprovalRequired }}{% endif %}{% endif %}{% if security.accessControl.accessReviewCadenceLabel %}- Access rights are reviewed on a {{ security.accessControl.accessReviewCadenceLabel | lower }}{% if security.accessControl.customerNotes.accessReviewCadence %} {{ security.accessControl.customerNotes.accessReviewCadence }}{% endif %} basis.
{% elif access.accessReviewsPerformedHasValue %}- Access rights to critical systems are reviewed periodically.{% if access.customerNotes.accessReviewsPerformed %} {{ access.customerNotes.accessReviewsPerformed }}{% endif %}
{% if access.customerNotes.accessReviewsPerformed %} {{ access.customerNotes.accessReviewsPerformed }}{% endif %}{% endif %}{% if access.offboardingProcessExistsHasValue %}- A defined offboarding process removes access promptly when personnel leave or change roles.{% if access.customerNotes.offboardingProcessExists %} {{ access.customerNotes.offboardingProcessExists }}{% endif %}
{% if access.customerNotes.offboardingProcessExists %} {{ access.customerNotes.offboardingProcessExists }}{% endif %}{% endif %}{% if access.sharedAccountsExistAnswered and not access.sharedAccountsExist %}- Shared user accounts are not permitted on critical systems.{% if access.customerNotes.sharedAccountsExist %} {{ access.customerNotes.sharedAccountsExist }}{% endif %}
{% endif %}{% if security.authentication.mfaRequiredHasValue %}- Multi-factor authentication is required for workforce access to critical systems.{% if security.authentication.customerNotes.mfaRequired %} {{ security.authentication.customerNotes.mfaRequired }}{% endif %}
{% if security.authentication.customerNotes.mfaRequired %} {{ security.authentication.customerNotes.mfaRequired }}{% endif %}{% endif %}{% if security.authentication.ssoSupportedHasValue %}- Single sign-on is used to centralize workforce authentication where supported.{% if security.authentication.customerNotes.ssoSupported %} {{ security.authentication.customerNotes.ssoSupported }}{% endif %}
{% if security.authentication.customerNotes.ssoSupported %} {{ security.authentication.customerNotes.ssoSupported }}{% endif %}{% endif %}{% if security.authentication.passwordManagerRequiredHasValue %}- Personnel must use an approved password manager for work credentials.{% if security.authentication.customerNotes.passwordManagerRequired %} {{ security.authentication.customerNotes.passwordManagerRequired }}{% endif %}
{% if security.authentication.customerNotes.passwordManagerRequired %} {{ security.authentication.customerNotes.passwordManagerRequired }}{% endif %}{% endif %}
{% endif %}

{% if security.encryption.atRestAlgorithmLabel or infrastructure.encryptionAtRestHasValue or security.encryption.inTransitMinimumTlsVersionLabel or infrastructure.encryptionInTransitHasValue or security.encryption.keyManagementProviderLabel or security.encryption.keyManagementProvider == "none" or infrastructure.encryptedDevicesRequiredHasValue or (privacy.productionDataInDevelopmentAnswered and not privacy.productionDataInDevelopment) %}
## 4. Data protection and encryption

{% if security.encryption.atRestAlgorithmLabel %}- Data at rest is encrypted using {{ security.encryption.atRestAlgorithmLabel }}{% if security.encryption.customerNotes.atRestAlgorithm %} {{ security.encryption.customerNotes.atRestAlgorithm }}{% endif %}{% if infrastructure.customerNotes.encryptionAtRest %} {{ infrastructure.customerNotes.encryptionAtRest }}{% endif %}.
{% elif infrastructure.encryptionAtRestHasValue %}- Data at rest is encrypted.{% if infrastructure.customerNotes.encryptionAtRest %} {{ infrastructure.customerNotes.encryptionAtRest }}{% endif %}
{% endif %}{% if security.encryption.inTransitMinimumTlsVersionLabel %}- Data in transit is protected using {{ security.encryption.inTransitMinimumTlsVersionLabel }}{% if security.encryption.customerNotes.inTransitMinimumTlsVersion %} {{ security.encryption.customerNotes.inTransitMinimumTlsVersion }}{% endif %}{% if infrastructure.customerNotes.encryptionInTransit %} {{ infrastructure.customerNotes.encryptionInTransit }}{% endif %} or higher.
{% elif infrastructure.encryptionInTransitHasValue %}- Data in transit is protected using industry-standard transport encryption.{% if infrastructure.customerNotes.encryptionInTransit %} {{ infrastructure.customerNotes.encryptionInTransit }}{% endif %}
{% endif %}{% if security.encryption.keyManagementProvider == "none" %}- Encryption keys are managed using controls provided by the relevant infrastructure providers.{% if security.encryption.customerNotes.keyManagementProvider %} {{ security.encryption.customerNotes.keyManagementProvider }}{% endif %}
{% elif security.encryption.keyManagementProviderLabel %}- Encryption keys are managed using {{ security.encryption.keyManagementProviderLabel }}{% if security.encryption.customerNotes.keyManagementProvider %} {{ security.encryption.customerNotes.keyManagementProvider }}{% endif %}.
{% endif %}{% if infrastructure.encryptedDevicesRequiredHasValue %}- Company devices used to access customer data must use full-disk encryption.{% if infrastructure.customerNotes.encryptedDevicesRequired %} {{ infrastructure.customerNotes.encryptedDevicesRequired }}{% endif %}
{% if infrastructure.customerNotes.encryptedDevicesRequired %} {{ infrastructure.customerNotes.encryptedDevicesRequired }}{% endif %}{% endif %}{% if privacy.productionDataInDevelopmentAnswered and not privacy.productionDataInDevelopment %}- Production customer data is not used in development or test environments.{% if privacy.customerNotes.productionDataInDevelopment %} {{ privacy.customerNotes.productionDataInDevelopment }}{% endif %}
{% if privacy.customerNotes.productionDataInDevelopment %} {{ privacy.customerNotes.productionDataInDevelopment }}{% endif %}{% endif %}
{% endif %}

{% if services.hasHostingRegion or infrastructure.organizationProviders.length %}
## 5. Infrastructure and processing locations

{% for service in services.all %}
{% if service.privacy.primaryHostingRegionLabel %}- {% if services.all.length > 1 %}{{ service.name }}{% if service.customerNotes.name %} {{ service.customerNotes.name }}{% endif %} is{% else %}The service is{% endif %} primarily hosted in {{ service.privacy.primaryHostingRegionLabel }}{% if service.privacy.customerNotes.primaryHostingRegion %} {{ service.privacy.customerNotes.primaryHostingRegion }}{% endif %}.
{% endif %}{% endfor %}
{% if infrastructure.organizationProviders.length %}Critical infrastructure and platform services are operated using established providers selected through the organization's vendor-management process.{% if infrastructure.customerNotes.organizationProviders %} {{ infrastructure.customerNotes.organizationProviders }}{% endif %}
{% if infrastructure.customerNotes.organizationProviders %} {{ infrastructure.customerNotes.organizationProviders }}{% endif %}{% endif %}
{% if infrastructure.customerNotes.organizationProviders %} {{ infrastructure.customerNotes.organizationProviders }}{% endif %}{% endif %}

{% if security.developmentSecurity.codeReviewRequiredHasValue or security.developmentSecurity.dependencySecurityMonitoringHasValue or security.developmentSecurity.secretScanningHasValue or security.developmentSecurity.automatedTestingBeforeDeploymentHasValue or security.developmentSecurity.cicdDeploymentProcessHasValue or security.developmentSecurity.productionDeploymentApprovalRequiredHasValue or (security.vulnerabilityManagement.scanningCadence and security.vulnerabilityManagement.scanningCadence != "none" and security.vulnerabilityManagement.scanningCadence != "not_defined") or security.vulnerabilityManagement.patchingSlaCriticalDaysHasValue or security.vulnerabilityManagement.patchingSlaHighDaysHasValue or (security.vulnerabilityManagement.penetrationTestingStrategy == "external" and (security.vulnerabilityManagement.penetrationTestingCadenceLabel or security.vulnerabilityManagement.penetrationTestLastDate)) %}
## 6. Secure development and vulnerability management

{% if security.developmentSecurity.codeReviewRequiredHasValue %}- Code changes require review before they are merged.{% if security.developmentSecurity.customerNotes.codeReviewRequired %} {{ security.developmentSecurity.customerNotes.codeReviewRequired }}{% endif %}
{% if security.developmentSecurity.customerNotes.codeReviewRequired %} {{ security.developmentSecurity.customerNotes.codeReviewRequired }}{% endif %}{% endif %}{% if security.developmentSecurity.dependencySecurityMonitoringHasValue %}- Software dependencies are monitored for known security vulnerabilities.{% if security.developmentSecurity.customerNotes.dependencySecurityMonitoring %} {{ security.developmentSecurity.customerNotes.dependencySecurityMonitoring }}{% endif %}
{% if security.developmentSecurity.customerNotes.dependencySecurityMonitoring %} {{ security.developmentSecurity.customerNotes.dependencySecurityMonitoring }}{% endif %}{% endif %}{% if security.developmentSecurity.secretScanningHasValue %}- Source code is scanned for exposed credentials and secrets.{% if security.developmentSecurity.customerNotes.secretScanning %} {{ security.developmentSecurity.customerNotes.secretScanning }}{% endif %}
{% if security.developmentSecurity.customerNotes.secretScanning %} {{ security.developmentSecurity.customerNotes.secretScanning }}{% endif %}{% endif %}{% if security.developmentSecurity.automatedTestingBeforeDeploymentHasValue %}- Automated tests must pass before changes are deployed.{% if security.developmentSecurity.customerNotes.automatedTestingBeforeDeployment %} {{ security.developmentSecurity.customerNotes.automatedTestingBeforeDeployment }}{% endif %}
{% if security.developmentSecurity.customerNotes.automatedTestingBeforeDeployment %} {{ security.developmentSecurity.customerNotes.automatedTestingBeforeDeployment }}{% endif %}{% endif %}{% if security.developmentSecurity.cicdDeploymentProcessHasValue %}- Production deployments use a defined CI/CD process.{% if security.developmentSecurity.customerNotes.cicdDeploymentProcess %} {{ security.developmentSecurity.customerNotes.cicdDeploymentProcess }}{% endif %}
{% if security.developmentSecurity.customerNotes.cicdDeploymentProcess %} {{ security.developmentSecurity.customerNotes.cicdDeploymentProcess }}{% endif %}{% endif %}{% if security.developmentSecurity.productionDeploymentApprovalRequiredHasValue %}- Production deployments require approval before release.{% if security.developmentSecurity.customerNotes.productionDeploymentApprovalRequired %} {{ security.developmentSecurity.customerNotes.productionDeploymentApprovalRequired }}{% endif %}
{% if security.developmentSecurity.customerNotes.productionDeploymentApprovalRequired %} {{ security.developmentSecurity.customerNotes.productionDeploymentApprovalRequired }}{% endif %}{% endif %}{% if security.vulnerabilityManagement.scanningCadence and security.vulnerabilityManagement.scanningCadence != "none" and security.vulnerabilityManagement.scanningCadence != "not_defined" %}- Applications, dependencies, and infrastructure are scanned for known vulnerabilities on a {{ security.vulnerabilityManagement.scanningCadenceLabel | lower }}{% if security.vulnerabilityManagement.customerNotes.scanningCadence %} {{ security.vulnerabilityManagement.customerNotes.scanningCadence }}{% endif %} basis.
{% endif %}{% if security.vulnerabilityManagement.patchingSlaCriticalDaysHasValue %}- Critical vulnerabilities have a target remediation period of {{ security.vulnerabilityManagement.patchingSlaCriticalDays }}{% if security.vulnerabilityManagement.customerNotes.patchingSlaCriticalDays %} {{ security.vulnerabilityManagement.customerNotes.patchingSlaCriticalDays }}{% endif %} days.
{% endif %}{% if security.vulnerabilityManagement.patchingSlaHighDaysHasValue %}- High-severity vulnerabilities have a target remediation period of {{ security.vulnerabilityManagement.patchingSlaHighDays }}{% if security.vulnerabilityManagement.customerNotes.patchingSlaHighDays %} {{ security.vulnerabilityManagement.customerNotes.patchingSlaHighDays }}{% endif %} days.
{% endif %}{% if security.vulnerabilityManagement.penetrationTestingStrategy == "external" and security.vulnerabilityManagement.penetrationTestingCadenceLabel %}- Independent third parties perform penetration testing on a {{ security.vulnerabilityManagement.penetrationTestingCadenceLabel | lower }}{% if security.vulnerabilityManagement.customerNotes.penetrationTestingCadence %} {{ security.vulnerabilityManagement.customerNotes.penetrationTestingCadence }}{% endif %} basis.
{% endif %}{% if security.vulnerabilityManagement.penetrationTestingStrategy == "external" and security.vulnerabilityManagement.penetrationTestLastDate %}- The most recent independent penetration test was completed on {{ security.vulnerabilityManagement.penetrationTestLastDate }}{% if security.vulnerabilityManagement.customerNotes.penetrationTestLastDate %} {{ security.vulnerabilityManagement.customerNotes.penetrationTestLastDate }}{% endif %}.
{% endif %}
{% endif %}

{% if security.logging.centralizedLoggingHasValue or (security.logging.securityMonitoringHasValue and security.logging.securityMonitoring != "none") %}
## 7. Logging and security monitoring

{% if security.logging.centralizedLoggingHasValue %}- Security-relevant logs are centralized to support investigation and operational review.{% if security.logging.customerNotes.centralizedLogging %} {{ security.logging.customerNotes.centralizedLogging }}{% endif %}
{% endif %}{% if security.logging.securityMonitoringHasValue and security.logging.securityMonitoring != "none" %}- Security events are monitored using {{ security.logging.securityMonitoringLabel | lower }}{% if security.logging.customerNotes.securityMonitoring %} {{ security.logging.customerNotes.securityMonitoring }}{% endif %} processes to identify suspicious activity and operational issues.
{% if security.logging.customerNotes.securityMonitoring %} {{ security.logging.customerNotes.securityMonitoring }}{% endif %}{% endif %}
{% endif %}

{% if infrastructure.backupsEnabledHasValue %}
## 8. Availability, resilience, and recovery

- Critical production data is backed up{% if security.backups.backupCadenceLabel %} on a {{ security.backups.backupCadenceLabel | lower }}{% if security.backups.customerNotes.backupCadence %} {{ security.backups.customerNotes.backupCadence }}{% endif %} basis{% endif %}.{% if infrastructure.customerNotes.backupsEnabled %} {{ infrastructure.customerNotes.backupsEnabled }}{% endif %}
{% if security.backups.backupRetentionDaysHasValue %}- Backups are retained for {{ security.backups.backupRetentionDays }}{% if security.backups.customerNotes.backupRetentionDays %} {{ security.backups.customerNotes.backupRetentionDays }}{% endif %} days.
{% endif %}{% if security.backups.restoreTestingCadence and security.backups.restoreTestingCadence != "none" %}- Backup restoration is tested on a {{ security.backups.restoreTestingCadenceLabel | lower }}{% if security.backups.customerNotes.restoreTestingCadence %} {{ security.backups.customerNotes.restoreTestingCadence }}{% endif %} basis.
{% endif %}
{% if infrastructure.customerNotes.backupsEnabled %} {{ infrastructure.customerNotes.backupsEnabled }}{% endif %}{% endif %}

{% if security.incidentResponse.planExistsHasValue %}
## 9. Security incident management

- A documented process is maintained for identifying, containing, investigating, remediating, and learning from security incidents.{% if security.incidentResponse.customerNotes.planExists %} {{ security.incidentResponse.customerNotes.planExists }}{% endif %}
{% if security.incidentResponse.notificationTimelineLabel %}- When an incident requires customer notification, affected customers are notified {{ security.incidentResponse.notificationTimelineLabel | lower }}{% if security.incidentResponse.customerNotes.notificationTimeline %} {{ security.incidentResponse.customerNotes.notificationTimeline }}{% endif %}.
{% endif %}{% if security.incidentResponse.customerNotificationProcessLabels.length %}- Customer notifications are delivered via {{ security.incidentResponse.customerNotificationProcessLabels | join(", ") | lower }}{% if security.incidentResponse.customerNotes.customerNotificationProcess %} {{ security.incidentResponse.customerNotes.customerNotificationProcess }}{% endif %}.
{% if security.incidentResponse.customerNotes.customerNotificationProcess %} {{ security.incidentResponse.customerNotes.customerNotificationProcess }}{% endif %}{% endif %}{% if security.incidentResponse.lastTestedDate %}- The incident response process was last tested on {{ security.incidentResponse.lastTestedDate }}{% if security.incidentResponse.customerNotes.lastTestedDate %} {{ security.incidentResponse.customerNotes.lastTestedDate }}{% endif %}.
{% endif %}
{% if security.incidentResponse.customerNotes.planExists %} {{ security.incidentResponse.customerNotes.planExists }}{% endif %}{% endif %}

{% if security.vendorRisk.vendorReviewRequiredHasValue or security.vendorRisk.dpaRequiredForProcessorsHasValue or vendors.dataProcessorsHasValue %}
## 10. Supplier and subprocessor security

{% if security.vendorRisk.vendorReviewRequiredHasValue %}- Vendors with access to critical systems or customer data are assessed before use{% if security.vendorRisk.vendorReviewCadenceLabel %} and reviewed on a {{ security.vendorRisk.vendorReviewCadenceLabel | lower }}{% if security.vendorRisk.customerNotes.vendorReviewCadence %} {{ security.vendorRisk.customerNotes.vendorReviewCadence }}{% endif %} basis{% endif %}.{% if security.vendorRisk.customerNotes.vendorReviewRequired %} {{ security.vendorRisk.customerNotes.vendorReviewRequired }}{% endif %}
{% if security.vendorRisk.customerNotes.vendorReviewRequired %} {{ security.vendorRisk.customerNotes.vendorReviewRequired }}{% endif %}{% elif vendors.dataProcessorsHasValue %}- Vendors that process customer data are assessed before use.{% if security.vendorRisk.customerNotes.vendorReviewRequired %} {{ security.vendorRisk.customerNotes.vendorReviewRequired }}{% endif %}
{% endif %}{% if security.vendorRisk.dpaRequiredForProcessorsHasValue %}- Data processing agreements are required for vendors that process personal data on the organization's behalf.{% if security.vendorRisk.customerNotes.dpaRequiredForProcessors %} {{ security.vendorRisk.customerNotes.dpaRequiredForProcessors }}{% endif %}
{% endif %}- Current data processors and subprocessors are maintained in the organization's dedicated subprocessors document.
{% endif %}

{% if privacy.retentionPolicyExistsHasValue %}
## 11. Retention and disposal

Data-retention practices are maintained to delete or anonymize personal data when it is no longer required for the purposes for which it was processed, subject to applicable legal and contractual retention requirements.{% if privacy.customerNotes.retentionPolicyExists %} {{ privacy.customerNotes.retentionPolicyExists }}{% endif %}
{% if privacy.customerNotes.retentionPolicyExists %} {{ privacy.customerNotes.retentionPolicyExists }}{% endif %}{% endif %}

## 12. Review of measures

{{ organization.legalEntityName or organization.name }}{% if organization.legalEntityName %}{% if organization.customerNotes.legalEntityName %} {{ organization.customerNotes.legalEntityName }}{% endif %}{% endif %}{% if not organization.legalEntityName %}{% if organization.customerNotes.name %} {{ organization.customerNotes.name }}{% endif %}{% endif %} may update these measures as technologies, risks, and services evolve, provided that updates do not materially reduce the overall protection of personal data during the applicable processing term.

{% if organization.securityContactEmail %}Security questions concerning these measures may be directed to {{ organization.securityContactEmail }}{% if organization.customerNotes.securityContactEmail %} {{ organization.customerNotes.securityContactEmail }}{% endif %}.{% elif organization.contactEmail %}Questions concerning these measures may be directed to {{ organization.contactEmail }}{% if organization.customerNotes.contactEmail %} {{ organization.customerNotes.contactEmail }}{% endif %}.{% endif %}
