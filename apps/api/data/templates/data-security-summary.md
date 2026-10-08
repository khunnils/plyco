' slug: data-security-summary
' name: Data Security Summary
' description: A concise customer-facing overview of data handling and security safeguards for early customer security conversations.

# {{ organization.name }} Data Security Summary

{% if organization.customerNotes.name %} {{ organization.customerNotes.name }}{% endif %}

{% if policy.version %}_Version {{ policy.version }}_{% endif %}
{% if policy.lastUpdatedDate %}_Last updated: {{ policy.lastUpdatedDate }}_{% endif %}

This summary provides a concise overview of the safeguards {{ organization.legalEntityName or organization.name }}{% if organization.legalEntityName %}{% if organization.customerNotes.legalEntityName %} {{ organization.customerNotes.legalEntityName }}{% endif %}{% endif %}{% if not organization.legalEntityName %}{% if organization.customerNotes.name %} {{ organization.customerNotes.name }}{% endif %}{% endif %} applies to the services and customer data described below. It is intended for early security conversations and is not a substitute for contractual terms, a full security assessment, or a certification. Security safeguards reduce risk but do not guarantee that incidents cannot occur.

## Service and data scope

{% if services.all.length %}
The following services are covered by this summary:

{% for service in services.all -%}
- **{{ service.name }}{% if service.customerNotes.name %} {{ service.customerNotes.name }}{% endif %}**{% if service.description %}: {{ service.description }}{% if service.customerNotes.description %} {{ service.customerNotes.description }}{% endif %}{% endif %}{% if service.privacy.primaryHostingRegionLabel %} — primarily hosted in {{ service.privacy.primaryHostingRegionLabel }}{% if service.privacy.customerNotes.primaryHostingRegion %} {{ service.privacy.customerNotes.primaryHostingRegion }}{% endif %}{% endif %}.
{% endfor %}
{% endif %}

{% if dataHandling.dataTypesStoredHasValue %}
The services process the following data categories:

{% for dataType in dataHandling.dataTypesStored -%}
- **{{ dataType.name }}{% if dataType.customerNotes.name %} {{ dataType.customerNotes.name }}{% endif %}**{% if dataType.description %}: {{ dataType.description }}{% if dataType.customerNotes.description %} {{ dataType.customerNotes.description }}{% endif %}{% endif %}{% if dataType.isSensitive %} _(sensitive)_{% if dataType.customerNotes.isSensitive %} {{ dataType.customerNotes.isSensitive }}{% endif %}{% endif %}
{% endfor %}
{% endif %}

{% if security.accessControl.leastPrivilegeHasValue or security.accessControl.roleBasedAccessHasValue or security.accessControl.adminApprovalRequiredHasValue or security.accessControl.accessReviewCadenceLabel or access.offboardingProcessExistsHasValue or security.authentication.mfaRequiredHasValue or security.authentication.ssoSupportedHasValue or security.authentication.passwordManagerRequiredHasValue %}
## Access and identity

{% if security.accessControl.leastPrivilegeHasValue %}- Workforce access follows least-privilege principles.{% if security.accessControl.customerNotes.leastPrivilege %} {{ security.accessControl.customerNotes.leastPrivilege }}{% endif %}
{% if security.accessControl.customerNotes.leastPrivilege %} {{ security.accessControl.customerNotes.leastPrivilege }}{% endif %}{% endif %}{% if security.accessControl.roleBasedAccessHasValue %}- Access is assigned through defined roles.{% if security.accessControl.customerNotes.roleBasedAccess %} {{ security.accessControl.customerNotes.roleBasedAccess }}{% endif %}
{% if security.accessControl.customerNotes.roleBasedAccess %} {{ security.accessControl.customerNotes.roleBasedAccess }}{% endif %}{% endif %}{% if security.accessControl.adminApprovalRequiredHasValue %}- Administrative access requires explicit approval.{% if security.accessControl.customerNotes.adminApprovalRequired %} {{ security.accessControl.customerNotes.adminApprovalRequired }}{% endif %}
{% if security.accessControl.customerNotes.adminApprovalRequired %} {{ security.accessControl.customerNotes.adminApprovalRequired }}{% endif %}{% endif %}{% if security.authentication.mfaRequiredHasValue %}- Multi-factor authentication is required for workforce access to critical systems.{% if security.authentication.customerNotes.mfaRequired %} {{ security.authentication.customerNotes.mfaRequired }}{% endif %}
{% if security.authentication.customerNotes.mfaRequired %} {{ security.authentication.customerNotes.mfaRequired }}{% endif %}{% endif %}{% if security.authentication.ssoSupportedHasValue %}- Single sign-on is used to centralize workforce authentication where supported.{% if security.authentication.customerNotes.ssoSupported %} {{ security.authentication.customerNotes.ssoSupported }}{% endif %}
{% if security.authentication.customerNotes.ssoSupported %} {{ security.authentication.customerNotes.ssoSupported }}{% endif %}{% endif %}{% if security.authentication.passwordManagerRequiredHasValue %}- Personnel use an approved password manager for work credentials.{% if security.authentication.customerNotes.passwordManagerRequired %} {{ security.authentication.customerNotes.passwordManagerRequired }}{% endif %}
{% if security.authentication.customerNotes.passwordManagerRequired %} {{ security.authentication.customerNotes.passwordManagerRequired }}{% endif %}{% endif %}{% if security.accessControl.accessReviewCadenceLabel %}- Access rights are reviewed {{ security.accessControl.accessReviewCadenceLabel | lower }}{% if security.accessControl.customerNotes.accessReviewCadence %} {{ security.accessControl.customerNotes.accessReviewCadence }}{% endif %}.
{% endif %}{% if access.offboardingProcessExistsHasValue %}- A defined offboarding process removes access when personnel leave or change roles.{% if access.customerNotes.offboardingProcessExists %} {{ access.customerNotes.offboardingProcessExists }}{% endif %}
{% if access.customerNotes.offboardingProcessExists %} {{ access.customerNotes.offboardingProcessExists }}{% endif %}{% endif %}
{% endif %}

{% if security.encryption.atRestAlgorithmLabel or infrastructure.encryptionAtRestHasValue or security.encryption.inTransitMinimumTlsVersionLabel or infrastructure.encryptionInTransitHasValue or infrastructure.encryptedDevicesRequiredHasValue or (privacy.productionDataInDevelopmentAnswered and not privacy.productionDataInDevelopment) or privacy.retentionPolicyExistsHasValue %}
## Encryption and data handling

{% if security.encryption.atRestAlgorithmLabel %}- Data at rest is encrypted using {{ security.encryption.atRestAlgorithmLabel }}{% if security.encryption.customerNotes.atRestAlgorithm %} {{ security.encryption.customerNotes.atRestAlgorithm }}{% endif %}{% if infrastructure.customerNotes.encryptionAtRest %} {{ infrastructure.customerNotes.encryptionAtRest }}{% endif %}.
{% elif infrastructure.encryptionAtRestHasValue %}- Data at rest is encrypted.{% if infrastructure.customerNotes.encryptionAtRest %} {{ infrastructure.customerNotes.encryptionAtRest }}{% endif %}
{% endif %}{% if security.encryption.inTransitMinimumTlsVersionLabel %}- Data in transit is protected using {{ security.encryption.inTransitMinimumTlsVersionLabel }}{% if security.encryption.customerNotes.inTransitMinimumTlsVersion %} {{ security.encryption.customerNotes.inTransitMinimumTlsVersion }}{% endif %}{% if infrastructure.customerNotes.encryptionInTransit %} {{ infrastructure.customerNotes.encryptionInTransit }}{% endif %} or higher.
{% elif infrastructure.encryptionInTransitHasValue %}- Data in transit is protected using industry-standard transport encryption.{% if infrastructure.customerNotes.encryptionInTransit %} {{ infrastructure.customerNotes.encryptionInTransit }}{% endif %}
{% endif %}{% if infrastructure.encryptedDevicesRequiredHasValue %}- Company devices used to access customer data use full-disk encryption.{% if infrastructure.customerNotes.encryptedDevicesRequired %} {{ infrastructure.customerNotes.encryptedDevicesRequired }}{% endif %}
{% if infrastructure.customerNotes.encryptedDevicesRequired %} {{ infrastructure.customerNotes.encryptedDevicesRequired }}{% endif %}{% endif %}{% if privacy.productionDataInDevelopmentAnswered and not privacy.productionDataInDevelopment %}- Production customer data is not used in development or test environments.{% if privacy.customerNotes.productionDataInDevelopment %} {{ privacy.customerNotes.productionDataInDevelopment }}{% endif %}
{% if privacy.customerNotes.productionDataInDevelopment %} {{ privacy.customerNotes.productionDataInDevelopment }}{% endif %}{% endif %}{% if privacy.retentionPolicyExistsHasValue %}- Data-retention practices delete or anonymize data when it is no longer needed, subject to legal and contractual requirements.{% if privacy.customerNotes.retentionPolicyExists %} {{ privacy.customerNotes.retentionPolicyExists }}{% endif %}
{% if privacy.customerNotes.retentionPolicyExists %} {{ privacy.customerNotes.retentionPolicyExists }}{% endif %}{% endif %}
{% endif %}

{% if security.developmentSecurity.codeReviewRequiredHasValue or security.developmentSecurity.dependencySecurityMonitoringHasValue or security.developmentSecurity.secretScanningHasValue or security.developmentSecurity.automatedTestingBeforeDeploymentHasValue or security.developmentSecurity.cicdDeploymentProcessHasValue or security.developmentSecurity.productionDeploymentApprovalRequiredHasValue or security.logging.centralizedLoggingHasValue or (security.logging.securityMonitoringHasValue and security.logging.securityMonitoring != "none") or (security.vulnerabilityManagement.scanningCadence and security.vulnerabilityManagement.scanningCadence != "none" and security.vulnerabilityManagement.scanningCadence != "not_defined") or (security.vulnerabilityManagement.penetrationTestingStrategy == "external" and security.vulnerabilityManagement.penetrationTestingCadenceLabel) %}
## Secure development and monitoring

{% if security.developmentSecurity.codeReviewRequiredHasValue %}- Code changes require review before they are merged.{% if security.developmentSecurity.customerNotes.codeReviewRequired %} {{ security.developmentSecurity.customerNotes.codeReviewRequired }}{% endif %}
{% if security.developmentSecurity.customerNotes.codeReviewRequired %} {{ security.developmentSecurity.customerNotes.codeReviewRequired }}{% endif %}{% endif %}{% if security.developmentSecurity.dependencySecurityMonitoringHasValue %}- Software dependencies are monitored for known vulnerabilities.{% if security.developmentSecurity.customerNotes.dependencySecurityMonitoring %} {{ security.developmentSecurity.customerNotes.dependencySecurityMonitoring }}{% endif %}
{% if security.developmentSecurity.customerNotes.dependencySecurityMonitoring %} {{ security.developmentSecurity.customerNotes.dependencySecurityMonitoring }}{% endif %}{% endif %}{% if security.developmentSecurity.secretScanningHasValue %}- Source code is scanned for exposed credentials and secrets.{% if security.developmentSecurity.customerNotes.secretScanning %} {{ security.developmentSecurity.customerNotes.secretScanning }}{% endif %}
{% if security.developmentSecurity.customerNotes.secretScanning %} {{ security.developmentSecurity.customerNotes.secretScanning }}{% endif %}{% endif %}{% if security.developmentSecurity.automatedTestingBeforeDeploymentHasValue %}- Automated tests must pass before deployment.{% if security.developmentSecurity.customerNotes.automatedTestingBeforeDeployment %} {{ security.developmentSecurity.customerNotes.automatedTestingBeforeDeployment }}{% endif %}
{% if security.developmentSecurity.customerNotes.automatedTestingBeforeDeployment %} {{ security.developmentSecurity.customerNotes.automatedTestingBeforeDeployment }}{% endif %}{% endif %}{% if security.developmentSecurity.cicdDeploymentProcessHasValue %}- Production deployments use a defined CI/CD process.{% if security.developmentSecurity.customerNotes.cicdDeploymentProcess %} {{ security.developmentSecurity.customerNotes.cicdDeploymentProcess }}{% endif %}
{% if security.developmentSecurity.customerNotes.cicdDeploymentProcess %} {{ security.developmentSecurity.customerNotes.cicdDeploymentProcess }}{% endif %}{% endif %}{% if security.developmentSecurity.productionDeploymentApprovalRequiredHasValue %}- Production deployments require approval before release.{% if security.developmentSecurity.customerNotes.productionDeploymentApprovalRequired %} {{ security.developmentSecurity.customerNotes.productionDeploymentApprovalRequired }}{% endif %}
{% if security.developmentSecurity.customerNotes.productionDeploymentApprovalRequired %} {{ security.developmentSecurity.customerNotes.productionDeploymentApprovalRequired }}{% endif %}{% endif %}{% if security.logging.centralizedLoggingHasValue %}- Security-relevant logs are centralized to support review and investigation.{% if security.logging.customerNotes.centralizedLogging %} {{ security.logging.customerNotes.centralizedLogging }}{% endif %}
{% endif %}{% if security.logging.securityMonitoringHasValue and security.logging.securityMonitoring != "none" %}- Security events are monitored using {{ security.logging.securityMonitoringLabel | lower }}{% if security.logging.customerNotes.securityMonitoring %} {{ security.logging.customerNotes.securityMonitoring }}{% endif %} processes.
{% if security.logging.customerNotes.securityMonitoring %} {{ security.logging.customerNotes.securityMonitoring }}{% endif %}{% endif %}{% if security.vulnerabilityManagement.scanningCadence and security.vulnerabilityManagement.scanningCadence != "none" and security.vulnerabilityManagement.scanningCadence != "not_defined" %}- Applications, dependencies, and infrastructure are scanned for known vulnerabilities {{ security.vulnerabilityManagement.scanningCadenceLabel | lower }}{% if security.vulnerabilityManagement.customerNotes.scanningCadence %} {{ security.vulnerabilityManagement.customerNotes.scanningCadence }}{% endif %}.
{% endif %}{% if security.vulnerabilityManagement.penetrationTestingStrategy == "external" and security.vulnerabilityManagement.penetrationTestingCadenceLabel %}- Independent third parties perform penetration testing {{ security.vulnerabilityManagement.penetrationTestingCadenceLabel | lower }}{% if security.vulnerabilityManagement.customerNotes.penetrationTestingCadence %} {{ security.vulnerabilityManagement.customerNotes.penetrationTestingCadence }}{% endif %}.
{% endif %}
{% endif %}

{% if infrastructure.backupsEnabledHasValue or security.incidentResponse.planExistsHasValue %}
## Resilience and incident management

{% if infrastructure.backupsEnabledHasValue %}- Critical production data is backed up{% if security.backups.backupCadenceLabel %} {{ security.backups.backupCadenceLabel | lower }}{% if security.backups.customerNotes.backupCadence %} {{ security.backups.customerNotes.backupCadence }}{% endif %}{% endif %}.{% if infrastructure.customerNotes.backupsEnabled %} {{ infrastructure.customerNotes.backupsEnabled }}{% endif %}
{% if security.backups.restoreTestingCadence and security.backups.restoreTestingCadence != "none" and security.backups.restoreTestingCadence != "not_defined" %}- Backup restoration is tested {{ security.backups.restoreTestingCadenceLabel | lower }}{% if security.backups.customerNotes.restoreTestingCadence %} {{ security.backups.customerNotes.restoreTestingCadence }}{% endif %}.
{% endif %}{% if infrastructure.customerNotes.backupsEnabled %} {{ infrastructure.customerNotes.backupsEnabled }}{% endif %}{% endif %}{% if security.incidentResponse.planExistsHasValue %}- A documented incident response process covers identification, containment, investigation, remediation, and follow-up.{% if security.incidentResponse.customerNotes.planExists %} {{ security.incidentResponse.customerNotes.planExists }}{% endif %}
{% if security.incidentResponse.notificationTimelineLabel %}- When an incident requires customer notification, affected customers are notified {{ security.incidentResponse.notificationTimelineLabel | lower }}{% if security.incidentResponse.customerNotes.notificationTimeline %} {{ security.incidentResponse.customerNotes.notificationTimeline }}{% endif %}.
{% endif %}{% if security.incidentResponse.customerNotificationProcessLabels.length %}- Customer notifications are delivered via {{ security.incidentResponse.customerNotificationProcessLabels | join(", ") | lower }}{% if security.incidentResponse.customerNotes.customerNotificationProcess %} {{ security.incidentResponse.customerNotes.customerNotificationProcess }}{% endif %}.
{% if security.incidentResponse.customerNotes.customerNotificationProcess %} {{ security.incidentResponse.customerNotes.customerNotificationProcess }}{% endif %}{% endif %}{% if security.incidentResponse.customerNotes.planExists %} {{ security.incidentResponse.customerNotes.planExists }}{% endif %}{% endif %}
{% endif %}

{% if security.vendorRisk.vendorReviewRequiredHasValue or security.vendorRisk.dpaRequiredForProcessorsHasValue or vendors.dataProcessorsHasValue %}
## Supplier safeguards

{% if security.vendorRisk.vendorReviewRequiredHasValue %}- Vendors with access to critical systems or customer data are assessed before use{% if security.vendorRisk.vendorReviewCadenceLabel %} and reviewed {{ security.vendorRisk.vendorReviewCadenceLabel | lower }}{% if security.vendorRisk.customerNotes.vendorReviewCadence %} {{ security.vendorRisk.customerNotes.vendorReviewCadence }}{% endif %}{% endif %}.{% if security.vendorRisk.customerNotes.vendorReviewRequired %} {{ security.vendorRisk.customerNotes.vendorReviewRequired }}{% endif %}
{% if security.vendorRisk.customerNotes.vendorReviewRequired %} {{ security.vendorRisk.customerNotes.vendorReviewRequired }}{% endif %}{% elif vendors.dataProcessorsHasValue %}- Vendors that process customer data are assessed before use.{% if security.vendorRisk.customerNotes.vendorReviewRequired %} {{ security.vendorRisk.customerNotes.vendorReviewRequired }}{% endif %}
{% endif %}{% if security.vendorRisk.dpaRequiredForProcessorsHasValue %}- Data processing agreements are required for vendors that process personal data on our behalf.{% if security.vendorRisk.customerNotes.dpaRequiredForProcessors %} {{ security.vendorRisk.customerNotes.dpaRequiredForProcessors }}{% endif %}
{% endif %}{% if vendors.dataProcessorsHasValue %}- Current data processors and subprocessors are maintained in a separate customer-facing list.
{% endif %}
{% endif %}

## Security contact

{% if organization.securityContactEmail %}For security questions or to report a concern, contact {{ organization.securityContactEmail }}{% if organization.customerNotes.securityContactEmail %} {{ organization.customerNotes.securityContactEmail }}{% endif %}.{% elif organization.contactEmail %}For security questions or to report a concern, contact {{ organization.contactEmail }}{% if organization.customerNotes.contactEmail %} {{ organization.customerNotes.contactEmail }}{% endif %}.{% else %}Please contact us promptly if you have a security question or discover a potential vulnerability.{% endif %}
