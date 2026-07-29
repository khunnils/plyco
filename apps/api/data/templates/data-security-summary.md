' slug: data-security-summary
' name: Data Security Summary
' description: A concise customer-facing overview of data handling and security safeguards for early customer security conversations.

# {{ organization.name }} Data Security Summary

{% if policy.version %}_Version {{ policy.version }}_{% endif %}
{% if policy.lastUpdatedDate %}_Last updated: {{ policy.lastUpdatedDate }}_{% endif %}

This summary provides a concise overview of the safeguards {{ organization.legalEntityName or organization.name }} applies to the services and customer data described below. It is intended for early security conversations and is not a substitute for contractual terms, a full security assessment, or a certification. Security safeguards reduce risk but do not guarantee that incidents cannot occur.

## Service and data scope

{% if services.all.length %}
The following services are covered by this summary:

{% for service in services.all -%}
- **{{ service.name }}**{% if service.description %}: {{ service.description }}{% endif %}{% if service.privacy.primaryHostingRegionLabel %} — primarily hosted in {{ service.privacy.primaryHostingRegionLabel }}{% endif %}.
{% endfor %}
{% endif %}

{% if dataHandling.dataTypesStoredHasValue %}
The services process the following data categories:

{% for dataType in dataHandling.dataTypesStored -%}
- **{{ dataType.name }}**{% if dataType.description %}: {{ dataType.description }}{% endif %}{% if dataType.isSensitive %} _(sensitive)_{% endif %}
{% endfor %}
{% endif %}

{% if security.accessControl.leastPrivilegeHasValue or security.accessControl.roleBasedAccessHasValue or security.accessControl.adminApprovalRequiredHasValue or security.accessControl.accessReviewCadenceLabel or access.offboardingProcessExistsHasValue or security.authentication.mfaRequiredHasValue or security.authentication.ssoSupportedHasValue or security.authentication.passwordManagerRequiredHasValue %}
## Access and identity

{% if security.accessControl.leastPrivilegeHasValue %}- Workforce access follows least-privilege principles.
{% endif %}{% if security.accessControl.roleBasedAccessHasValue %}- Access is assigned through defined roles.
{% endif %}{% if security.accessControl.adminApprovalRequiredHasValue %}- Administrative access requires explicit approval.
{% endif %}{% if security.authentication.mfaRequiredHasValue %}- Multi-factor authentication is required for workforce access to critical systems.
{% endif %}{% if security.authentication.ssoSupportedHasValue %}- Single sign-on is used to centralize workforce authentication where supported.
{% endif %}{% if security.authentication.passwordManagerRequiredHasValue %}- Personnel use an approved password manager for work credentials.
{% endif %}{% if security.accessControl.accessReviewCadenceLabel %}- Access rights are reviewed {{ security.accessControl.accessReviewCadenceLabel | lower }}.
{% endif %}{% if access.offboardingProcessExistsHasValue %}- A defined offboarding process removes access when personnel leave or change roles.
{% endif %}
{% endif %}

{% if security.encryption.atRestAlgorithmLabel or infrastructure.encryptionAtRestHasValue or security.encryption.inTransitMinimumTlsVersionLabel or infrastructure.encryptionInTransitHasValue or infrastructure.encryptedDevicesRequiredHasValue or (privacy.productionDataInDevelopmentAnswered and not privacy.productionDataInDevelopment) or privacy.retentionPolicyExistsHasValue %}
## Encryption and data handling

{% if security.encryption.atRestAlgorithmLabel %}- Data at rest is encrypted using {{ security.encryption.atRestAlgorithmLabel }}.
{% elif infrastructure.encryptionAtRestHasValue %}- Data at rest is encrypted.
{% endif %}{% if security.encryption.inTransitMinimumTlsVersionLabel %}- Data in transit is protected using {{ security.encryption.inTransitMinimumTlsVersionLabel }} or higher.
{% elif infrastructure.encryptionInTransitHasValue %}- Data in transit is protected using industry-standard transport encryption.
{% endif %}{% if infrastructure.encryptedDevicesRequiredHasValue %}- Company devices used to access customer data use full-disk encryption.
{% endif %}{% if privacy.productionDataInDevelopmentAnswered and not privacy.productionDataInDevelopment %}- Production customer data is not used in development or test environments.
{% endif %}{% if privacy.retentionPolicyExistsHasValue %}- Data-retention practices delete or anonymize data when it is no longer needed, subject to legal and contractual requirements.
{% endif %}
{% endif %}

{% if security.developmentSecurity.codeReviewRequiredHasValue or security.developmentSecurity.dependencySecurityMonitoringHasValue or security.developmentSecurity.secretScanningHasValue or security.developmentSecurity.automatedTestingBeforeDeploymentHasValue or security.developmentSecurity.cicdDeploymentProcessHasValue or security.developmentSecurity.productionDeploymentApprovalRequiredHasValue or security.logging.centralizedLoggingHasValue or (security.logging.securityMonitoringHasValue and security.logging.securityMonitoring != "none") or (security.vulnerabilityManagement.scanningCadence and security.vulnerabilityManagement.scanningCadence != "none" and security.vulnerabilityManagement.scanningCadence != "not_defined") or (security.vulnerabilityManagement.penetrationTestingStrategy == "external" and security.vulnerabilityManagement.penetrationTestingCadenceLabel) %}
## Secure development and monitoring

{% if security.developmentSecurity.codeReviewRequiredHasValue %}- Code changes require review before they are merged.
{% endif %}{% if security.developmentSecurity.dependencySecurityMonitoringHasValue %}- Software dependencies are monitored for known vulnerabilities.
{% endif %}{% if security.developmentSecurity.secretScanningHasValue %}- Source code is scanned for exposed credentials and secrets.
{% endif %}{% if security.developmentSecurity.automatedTestingBeforeDeploymentHasValue %}- Automated tests must pass before deployment.
{% endif %}{% if security.developmentSecurity.cicdDeploymentProcessHasValue %}- Production deployments use a defined CI/CD process.
{% endif %}{% if security.developmentSecurity.productionDeploymentApprovalRequiredHasValue %}- Production deployments require approval before release.
{% endif %}{% if security.logging.centralizedLoggingHasValue %}- Security-relevant logs are centralized to support review and investigation.
{% endif %}{% if security.logging.securityMonitoringHasValue and security.logging.securityMonitoring != "none" %}- Security events are monitored using {{ security.logging.securityMonitoringLabel | lower }} processes.
{% endif %}{% if security.vulnerabilityManagement.scanningCadence and security.vulnerabilityManagement.scanningCadence != "none" and security.vulnerabilityManagement.scanningCadence != "not_defined" %}- Applications, dependencies, and infrastructure are scanned for known vulnerabilities {{ security.vulnerabilityManagement.scanningCadenceLabel | lower }}.
{% endif %}{% if security.vulnerabilityManagement.penetrationTestingStrategy == "external" and security.vulnerabilityManagement.penetrationTestingCadenceLabel %}- Independent third parties perform penetration testing {{ security.vulnerabilityManagement.penetrationTestingCadenceLabel | lower }}.
{% endif %}
{% endif %}

{% if infrastructure.backupsEnabledHasValue or security.incidentResponse.planExistsHasValue %}
## Resilience and incident management

{% if infrastructure.backupsEnabledHasValue %}- Critical production data is backed up{% if security.backups.backupCadenceLabel %} {{ security.backups.backupCadenceLabel | lower }}{% endif %}.
{% if security.backups.restoreTestingCadence and security.backups.restoreTestingCadence != "none" and security.backups.restoreTestingCadence != "not_defined" %}- Backup restoration is tested {{ security.backups.restoreTestingCadenceLabel | lower }}.
{% endif %}{% endif %}{% if security.incidentResponse.planExistsHasValue %}- A documented incident response process covers identification, containment, investigation, remediation, and follow-up.
{% if security.incidentResponse.notificationTimelineLabel %}- When an incident requires customer notification, affected customers are notified {{ security.incidentResponse.notificationTimelineLabel | lower }}.
{% endif %}{% if security.incidentResponse.customerNotificationProcessLabels.length %}- Customer notifications are delivered via {{ security.incidentResponse.customerNotificationProcessLabels | join(", ") | lower }}.
{% endif %}{% endif %}
{% endif %}

{% if security.vendorRisk.vendorReviewRequiredHasValue or security.vendorRisk.dpaRequiredForProcessorsHasValue or vendors.dataProcessorsHasValue %}
## Supplier safeguards

{% if security.vendorRisk.vendorReviewRequiredHasValue %}- Vendors with access to critical systems or customer data are assessed before use{% if security.vendorRisk.vendorReviewCadenceLabel %} and reviewed {{ security.vendorRisk.vendorReviewCadenceLabel | lower }}{% endif %}.
{% elif vendors.dataProcessorsHasValue %}- Vendors that process customer data are assessed before use.
{% endif %}{% if security.vendorRisk.dpaRequiredForProcessorsHasValue %}- Data processing agreements are required for vendors that process personal data on our behalf.
{% endif %}{% if vendors.dataProcessorsHasValue %}- Current data processors and subprocessors are maintained in a separate customer-facing list.
{% endif %}
{% endif %}

## Security contact

{% if organization.securityContactEmail %}For security questions or to report a concern, contact {{ organization.securityContactEmail }}.{% elif organization.contactEmail %}For security questions or to report a concern, contact {{ organization.contactEmail }}.{% else %}Please contact us promptly if you have a security question or discover a potential vulnerability.{% endif %}
