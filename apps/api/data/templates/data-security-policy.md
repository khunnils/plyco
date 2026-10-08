' slug: data-security-policy
' name: Data Security Policy
' description: A customer-facing security policy for SaaS services, covering governance, secure development, access, protection, detection, response, recovery, and vendor risk.

# {{ organization.name }} Data Security Policy

{% if organization.customerNotes.name %} {{ organization.customerNotes.name }}{% endif %}

{% if policy.version %}_Version {{ policy.version }}_{% endif %}
{% if policy.lastUpdatedDate %}_Last updated: {{ policy.lastUpdatedDate }}_{% endif %}

{{ organization.legalEntityName or organization.name }}{% if organization.legalEntityName %}{% if organization.customerNotes.legalEntityName %} {{ organization.customerNotes.legalEntityName }}{% endif %}{% endif %}{% if not organization.legalEntityName %}{% if organization.customerNotes.name %} {{ organization.customerNotes.name }}{% endif %}{% endif %} maintains administrative, technical, and organizational safeguards designed to protect the services we provide and the customer data we process. This policy describes our current security practices. It does not represent a certification or guarantee that security incidents cannot occur.

## Governance and scope

This policy applies to the people, processes, systems, and infrastructure used to develop, operate, and support our services.

{% if services.all.length > 1 %}
The services covered by this policy are:

{% for service in services.all -%}
{% if service.name %}- {{ service.name }}{% if service.customerNotes.name %} {{ service.customerNotes.name }}{% endif %}
{% endif %}
{% endfor %}
{% elif service.name %}
This policy covers {{ service.name }}{% if service.customerNotes.name %} {{ service.customerNotes.name }}{% endif %}.
{% endif %}

We review and update this policy when our services, security practices, or material risks change.

{% if services.hasHostingRegion or services.hasAllSubprocessorsDataRegion or infrastructure.organizationProviders.length %}
## Infrastructure and hosting

{% for service in services.all %}
{% if service.privacy.primaryHostingRegionLabel %}
{% if services.all.length > 1 %}{{ service.name }}{% if service.customerNotes.name %} {{ service.customerNotes.name }}{% endif %} is{% else %}The service is{% endif %} primarily hosted in {{ service.privacy.primaryHostingRegionLabel }}{% if service.privacy.customerNotes.primaryHostingRegion %} {{ service.privacy.customerNotes.primaryHostingRegion }}{% endif %}.
{% endif %}
{% if service.privacy.allSubprocessorsDataRegionLabel %}
{% if services.all.length > 1 %}All recorded subprocessors for {{ service.name }}{% if service.customerNotes.name %} {{ service.customerNotes.name }}{% endif %} process service data in {{ service.privacy.allSubprocessorsDataRegionLabel }}.{% else %}All recorded subprocessors process service data in {{ service.privacy.allSubprocessorsDataRegionLabel }}.{% endif %}
{% endif %}
{% endfor %}
{% if infrastructure.organizationProviders.length %}
We use established infrastructure and platform providers to operate critical systems, including:{% if infrastructure.customerNotes.organizationProviders %} {{ infrastructure.customerNotes.organizationProviders }}{% endif %}

{% for provider in infrastructure.organizationProviders -%}
- {{ provider.name or provider.providerId }}{% if provider.systemType %} ({{ provider.systemType | replace("_", " ") | replace("-", " ") }}){% endif %}{% if provider.customerNotes.selection %} {{ provider.customerNotes.selection }}{% endif %}
{% endfor %}
{% if infrastructure.customerNotes.organizationProviders %} {{ infrastructure.customerNotes.organizationProviders }}{% endif %}{% endif %}
{% if infrastructure.customerNotes.organizationProviders %} {{ infrastructure.customerNotes.organizationProviders }}{% endif %}{% endif %}

{% if security.developmentSecurity.codeReviewRequiredHasValue or security.developmentSecurity.dependencySecurityMonitoringHasValue or security.developmentSecurity.secretScanningHasValue or security.developmentSecurity.automatedTestingBeforeDeploymentHasValue or security.developmentSecurity.cicdDeploymentProcessHasValue or security.developmentSecurity.productionDeploymentApprovalRequiredHasValue %}
## Secure development and change management

We integrate security checks into software development and production changes.

{% if security.developmentSecurity.codeReviewRequiredHasValue %}- Code changes require review before they are merged.{% if security.developmentSecurity.customerNotes.codeReviewRequired %} {{ security.developmentSecurity.customerNotes.codeReviewRequired }}{% endif %}
{% if security.developmentSecurity.customerNotes.codeReviewRequired %} {{ security.developmentSecurity.customerNotes.codeReviewRequired }}{% endif %}{% endif %}
{% if security.developmentSecurity.dependencySecurityMonitoringHasValue %}- Software dependencies are monitored for known security vulnerabilities.{% if security.developmentSecurity.customerNotes.dependencySecurityMonitoring %} {{ security.developmentSecurity.customerNotes.dependencySecurityMonitoring }}{% endif %}
{% if security.developmentSecurity.customerNotes.dependencySecurityMonitoring %} {{ security.developmentSecurity.customerNotes.dependencySecurityMonitoring }}{% endif %}{% endif %}
{% if security.developmentSecurity.secretScanningHasValue %}- Source code is scanned for exposed credentials and secrets.{% if security.developmentSecurity.customerNotes.secretScanning %} {{ security.developmentSecurity.customerNotes.secretScanning }}{% endif %}
{% if security.developmentSecurity.customerNotes.secretScanning %} {{ security.developmentSecurity.customerNotes.secretScanning }}{% endif %}{% endif %}
{% if security.developmentSecurity.automatedTestingBeforeDeploymentHasValue %}- Automated tests must pass before changes are deployed.{% if security.developmentSecurity.customerNotes.automatedTestingBeforeDeployment %} {{ security.developmentSecurity.customerNotes.automatedTestingBeforeDeployment }}{% endif %}
{% if security.developmentSecurity.customerNotes.automatedTestingBeforeDeployment %} {{ security.developmentSecurity.customerNotes.automatedTestingBeforeDeployment }}{% endif %}{% endif %}
{% if security.developmentSecurity.cicdDeploymentProcessHasValue %}- Production deployments use a defined CI/CD process.{% if security.developmentSecurity.customerNotes.cicdDeploymentProcess %} {{ security.developmentSecurity.customerNotes.cicdDeploymentProcess }}{% endif %}
{% if security.developmentSecurity.customerNotes.cicdDeploymentProcess %} {{ security.developmentSecurity.customerNotes.cicdDeploymentProcess }}{% endif %}{% endif %}
{% if security.developmentSecurity.productionDeploymentApprovalRequiredHasValue %}- Production deployments require approval before release.{% if security.developmentSecurity.customerNotes.productionDeploymentApprovalRequired %} {{ security.developmentSecurity.customerNotes.productionDeploymentApprovalRequired }}{% endif %}
{% if security.developmentSecurity.customerNotes.productionDeploymentApprovalRequired %} {{ security.developmentSecurity.customerNotes.productionDeploymentApprovalRequired }}{% endif %}{% endif %}
{% endif %}

{% if security.accessControl.leastPrivilegeHasValue or security.accessControl.roleBasedAccessHasValue or security.accessControl.adminApprovalRequiredHasValue or security.accessControl.accessReviewCadenceLabel or access.accessReviewsPerformedHasValue or access.offboardingProcessExistsHasValue or (access.sharedAccountsExistAnswered and not access.sharedAccountsExist) %}
## Access control

{% if security.accessControl.leastPrivilegeHasValue %}We apply least-privilege principles so personnel receive only the access needed for their responsibilities.{% if security.accessControl.customerNotes.leastPrivilege %} {{ security.accessControl.customerNotes.leastPrivilege }}{% endif %}
{% if security.accessControl.customerNotes.leastPrivilege %} {{ security.accessControl.customerNotes.leastPrivilege }}{% endif %}{% endif %}
{% if security.accessControl.roleBasedAccessHasValue %}Access is assigned through defined roles.{% if security.accessControl.customerNotes.roleBasedAccess %} {{ security.accessControl.customerNotes.roleBasedAccess }}{% endif %}
{% if security.accessControl.customerNotes.roleBasedAccess %} {{ security.accessControl.customerNotes.roleBasedAccess }}{% endif %}{% endif %}
{% if security.accessControl.adminApprovalRequiredHasValue %}Administrative and other privileged access requires explicit approval.{% if security.accessControl.customerNotes.adminApprovalRequired %} {{ security.accessControl.customerNotes.adminApprovalRequired }}{% endif %}
{% if security.accessControl.customerNotes.adminApprovalRequired %} {{ security.accessControl.customerNotes.adminApprovalRequired }}{% endif %}{% endif %}
{% if security.accessControl.accessReviewCadenceLabel %}Access rights are reviewed on a {{ security.accessControl.accessReviewCadenceLabel | lower }}{% if security.accessControl.customerNotes.accessReviewCadence %} {{ security.accessControl.customerNotes.accessReviewCadence }}{% endif %} basis.
{% elif access.accessReviewsPerformedHasValue %}Access rights to critical systems are reviewed periodically.{% if access.customerNotes.accessReviewsPerformed %} {{ access.customerNotes.accessReviewsPerformed }}{% endif %}
{% if access.customerNotes.accessReviewsPerformed %} {{ access.customerNotes.accessReviewsPerformed }}{% endif %}{% endif %}
{% if access.offboardingProcessExistsHasValue %}A defined offboarding process removes access promptly when personnel leave or change roles.{% if access.customerNotes.offboardingProcessExists %} {{ access.customerNotes.offboardingProcessExists }}{% endif %}
{% if access.customerNotes.offboardingProcessExists %} {{ access.customerNotes.offboardingProcessExists }}{% endif %}{% endif %}
{% if access.sharedAccountsExistAnswered and not access.sharedAccountsExist %}Shared user accounts are not permitted on critical systems.{% if access.customerNotes.sharedAccountsExist %} {{ access.customerNotes.sharedAccountsExist }}{% endif %}
{% endif %}
{% endif %}

{% if security.authentication.mfaRequiredHasValue or security.authentication.ssoSupportedHasValue or security.authentication.passwordManagerRequiredHasValue %}
## Authentication

{% if security.authentication.mfaRequiredHasValue %}Multi-factor authentication is required for workforce access to critical systems.{% if security.authentication.customerNotes.mfaRequired %} {{ security.authentication.customerNotes.mfaRequired }}{% endif %}
{% if security.authentication.customerNotes.mfaRequired %} {{ security.authentication.customerNotes.mfaRequired }}{% endif %}{% endif %}
{% if security.authentication.ssoSupportedHasValue %}Single sign-on is used to centralize workforce authentication where supported.{% if security.authentication.customerNotes.ssoSupported %} {{ security.authentication.customerNotes.ssoSupported }}{% endif %}
{% if security.authentication.customerNotes.ssoSupported %} {{ security.authentication.customerNotes.ssoSupported }}{% endif %}{% endif %}
{% if security.authentication.passwordManagerRequiredHasValue %}Personnel are required to use an approved password manager for work credentials.{% if security.authentication.customerNotes.passwordManagerRequired %} {{ security.authentication.customerNotes.passwordManagerRequired }}{% endif %}
{% if security.authentication.customerNotes.passwordManagerRequired %} {{ security.authentication.customerNotes.passwordManagerRequired }}{% endif %}{% endif %}
{% endif %}

{% if access.securityTrainingRequiredHasValue or access.confidentialityAgreementsRequiredHasValue %}
## Personnel security

{% if access.securityTrainingRequiredHasValue %}Personnel complete security awareness training when they join and on a recurring basis thereafter.{% if access.customerNotes.securityTrainingRequired %} {{ access.customerNotes.securityTrainingRequired }}{% endif %}
{% if access.customerNotes.securityTrainingRequired %} {{ access.customerNotes.securityTrainingRequired }}{% endif %}{% endif %}
{% if access.confidentialityAgreementsRequiredHasValue %}Personnel are bound by confidentiality obligations covering customer and company data.{% if access.customerNotes.confidentialityAgreementsRequired %} {{ access.customerNotes.confidentialityAgreementsRequired }}{% endif %}
{% if access.customerNotes.confidentialityAgreementsRequired %} {{ access.customerNotes.confidentialityAgreementsRequired }}{% endif %}{% endif %}
{% endif %}

{% if security.encryption.atRestAlgorithmLabel or infrastructure.encryptionAtRestHasValue or security.encryption.inTransitMinimumTlsVersionLabel or infrastructure.encryptionInTransitHasValue or security.encryption.keyManagementProviderLabel or infrastructure.encryptedDevicesRequiredHasValue or (privacy.productionDataInDevelopmentAnswered and not privacy.productionDataInDevelopment) or privacy.retentionPolicyExistsHasValue %}
## Encryption and data protection

{% if security.encryption.atRestAlgorithmLabel %}Data at rest is encrypted using {{ security.encryption.atRestAlgorithmLabel }}{% if security.encryption.customerNotes.atRestAlgorithm %} {{ security.encryption.customerNotes.atRestAlgorithm }}{% endif %}{% if infrastructure.customerNotes.encryptionAtRest %} {{ infrastructure.customerNotes.encryptionAtRest }}{% endif %}.
{% elif infrastructure.encryptionAtRestHasValue %}Data at rest is encrypted.{% if infrastructure.customerNotes.encryptionAtRest %} {{ infrastructure.customerNotes.encryptionAtRest }}{% endif %}
{% endif %}
{% if security.encryption.inTransitMinimumTlsVersionLabel %}Data in transit is protected using {{ security.encryption.inTransitMinimumTlsVersionLabel }}{% if security.encryption.customerNotes.inTransitMinimumTlsVersion %} {{ security.encryption.customerNotes.inTransitMinimumTlsVersion }}{% endif %}{% if infrastructure.customerNotes.encryptionInTransit %} {{ infrastructure.customerNotes.encryptionInTransit }}{% endif %} or higher.
{% elif infrastructure.encryptionInTransitHasValue %}Data in transit is protected using industry-standard transport encryption.{% if infrastructure.customerNotes.encryptionInTransit %} {{ infrastructure.customerNotes.encryptionInTransit }}{% endif %}
{% endif %}
{% if security.encryption.keyManagementProvider == "none" %}Encryption keys are managed using controls provided by our infrastructure providers.{% if security.encryption.customerNotes.keyManagementProvider %} {{ security.encryption.customerNotes.keyManagementProvider }}{% endif %}
{% elif security.encryption.keyManagementProviderLabel %}Encryption keys are managed using {{ security.encryption.keyManagementProviderLabel }}{% if security.encryption.customerNotes.keyManagementProvider %} {{ security.encryption.customerNotes.keyManagementProvider }}{% endif %}.
{% endif %}
{% if infrastructure.encryptedDevicesRequiredHasValue %}Company devices used to access customer data are required to use full-disk encryption.{% if infrastructure.customerNotes.encryptedDevicesRequired %} {{ infrastructure.customerNotes.encryptedDevicesRequired }}{% endif %}
{% if infrastructure.customerNotes.encryptedDevicesRequired %} {{ infrastructure.customerNotes.encryptedDevicesRequired }}{% endif %}{% endif %}
{% if privacy.productionDataInDevelopmentAnswered and not privacy.productionDataInDevelopment %}Production customer data is not used in development or test environments.{% if privacy.customerNotes.productionDataInDevelopment %} {{ privacy.customerNotes.productionDataInDevelopment }}{% endif %}
{% if privacy.customerNotes.productionDataInDevelopment %} {{ privacy.customerNotes.productionDataInDevelopment }}{% endif %}{% endif %}
{% if privacy.retentionPolicyExistsHasValue %}We maintain data-retention practices intended to delete or anonymize data when it is no longer needed.{% if privacy.customerNotes.retentionPolicyExists %} {{ privacy.customerNotes.retentionPolicyExists }}{% endif %}
{% if privacy.customerNotes.retentionPolicyExists %} {{ privacy.customerNotes.retentionPolicyExists }}{% endif %}{% endif %}
{% endif %}

{% if dataHandling.dataTypesStoredHasValue %}
## Data categories

We process the following categories of data:

{% for dataType in dataHandling.dataTypesStored %}
- **{{ dataType.name }}{% if dataType.customerNotes.name %} {{ dataType.customerNotes.name }}{% endif %}**{% if dataType.description %}: {{ dataType.description }}{% if dataType.customerNotes.description %} {{ dataType.customerNotes.description }}{% endif %}{% endif %}{% if dataType.isSensitive %} _(sensitive)_{% if dataType.customerNotes.isSensitive %} {{ dataType.customerNotes.isSensitive }}{% endif %}{% endif %}

{% endfor %}
{% endif %}

{% if security.logging.centralizedLoggingHasValue or (security.logging.securityMonitoringHasValue and security.logging.securityMonitoring != "none") %}
## Monitoring and detection

{% if security.logging.centralizedLoggingHasValue %}Security-relevant logs are centralized to support investigation and operational review.{% if security.logging.customerNotes.centralizedLogging %} {{ security.logging.customerNotes.centralizedLogging }}{% endif %}
{% endif %}
{% if security.logging.securityMonitoringHasValue and security.logging.securityMonitoring != "none" %}Security events are monitored using {{ security.logging.securityMonitoringLabel | lower }}{% if security.logging.customerNotes.securityMonitoring %} {{ security.logging.customerNotes.securityMonitoring }}{% endif %} processes to identify suspicious activity and operational issues.
{% if security.logging.customerNotes.securityMonitoring %} {{ security.logging.customerNotes.securityMonitoring }}{% endif %}{% endif %}
{% endif %}

{% if (security.vulnerabilityManagement.scanningCadence and security.vulnerabilityManagement.scanningCadence != "none" and security.vulnerabilityManagement.scanningCadence != "not_defined") or security.vulnerabilityManagement.patchingSlaCriticalDaysHasValue or security.vulnerabilityManagement.patchingSlaHighDaysHasValue %}
## Vulnerability management

{% if security.vulnerabilityManagement.scanningCadence and security.vulnerabilityManagement.scanningCadence != "none" and security.vulnerabilityManagement.scanningCadence != "not_defined" %}Applications, dependencies, and infrastructure are scanned for known vulnerabilities on a {{ security.vulnerabilityManagement.scanningCadenceLabel | lower }}{% if security.vulnerabilityManagement.customerNotes.scanningCadence %} {{ security.vulnerabilityManagement.customerNotes.scanningCadence }}{% endif %} basis.
{% endif %}
{% if security.vulnerabilityManagement.patchingSlaCriticalDaysHasValue %}We target remediation of critical vulnerabilities within {{ security.vulnerabilityManagement.patchingSlaCriticalDays }}{% if security.vulnerabilityManagement.customerNotes.patchingSlaCriticalDays %} {{ security.vulnerabilityManagement.customerNotes.patchingSlaCriticalDays }}{% endif %} days.
{% endif %}
{% if security.vulnerabilityManagement.patchingSlaHighDaysHasValue %}We target remediation of high-severity vulnerabilities within {{ security.vulnerabilityManagement.patchingSlaHighDays }}{% if security.vulnerabilityManagement.customerNotes.patchingSlaHighDays %} {{ security.vulnerabilityManagement.customerNotes.patchingSlaHighDays }}{% endif %} days.
{% endif %}
{% endif %}

{% if security.vulnerabilityManagement.penetrationTestingStrategy == "external" and (security.vulnerabilityManagement.penetrationTestingCadenceLabel or security.vulnerabilityManagement.penetrationTestLastDate) %}
## Independent security testing

{% if security.vulnerabilityManagement.penetrationTestingCadenceLabel %}Independent third parties perform penetration testing on a {{ security.vulnerabilityManagement.penetrationTestingCadenceLabel | lower }}{% if security.vulnerabilityManagement.customerNotes.penetrationTestingCadence %} {{ security.vulnerabilityManagement.customerNotes.penetrationTestingCadence }}{% endif %} basis.
{% endif %}
{% if security.vulnerabilityManagement.penetrationTestLastDate %}The most recent penetration test was completed on {{ security.vulnerabilityManagement.penetrationTestLastDate }}{% if security.vulnerabilityManagement.customerNotes.penetrationTestLastDate %} {{ security.vulnerabilityManagement.customerNotes.penetrationTestLastDate }}{% endif %}.
{% endif %}
{% endif %}

{% if security.incidentResponse.planExistsHasValue %}
## Incident response

We maintain a documented process for identifying, containing, investigating, remediating, and learning from security incidents.{% if security.incidentResponse.customerNotes.planExists %} {{ security.incidentResponse.customerNotes.planExists }}{% endif %}
{% if security.incidentResponse.notificationTimelineLabel %}When an incident requires customer notification, affected customers are notified {{ security.incidentResponse.notificationTimelineLabel | lower }}{% if security.incidentResponse.customerNotes.notificationTimeline %} {{ security.incidentResponse.customerNotes.notificationTimeline }}{% endif %}.
{% endif %}
{% if security.incidentResponse.customerNotificationProcessLabels.length %}Customer notifications are delivered via {{ security.incidentResponse.customerNotificationProcessLabels | join(", ") | lower }}{% if security.incidentResponse.customerNotes.customerNotificationProcess %} {{ security.incidentResponse.customerNotes.customerNotificationProcess }}{% endif %}.
{% if security.incidentResponse.customerNotes.customerNotificationProcess %} {{ security.incidentResponse.customerNotes.customerNotificationProcess }}{% endif %}{% endif %}
{% if security.incidentResponse.lastTestedDate %}Our incident response process was last tested on {{ security.incidentResponse.lastTestedDate }}{% if security.incidentResponse.customerNotes.lastTestedDate %} {{ security.incidentResponse.customerNotes.lastTestedDate }}{% endif %}.
{% endif %}
{% if security.incidentResponse.customerNotes.planExists %} {{ security.incidentResponse.customerNotes.planExists }}{% endif %}{% endif %}

{% if infrastructure.backupsEnabledHasValue %}
## Backup and recovery

Critical production data is backed up{% if security.backups.backupCadenceLabel %} on a {{ security.backups.backupCadenceLabel | lower }}{% if security.backups.customerNotes.backupCadence %} {{ security.backups.customerNotes.backupCadence }}{% endif %} basis{% endif %}.{% if infrastructure.customerNotes.backupsEnabled %} {{ infrastructure.customerNotes.backupsEnabled }}{% endif %}
{% if security.backups.backupRetentionDaysHasValue %}Backups are retained for {{ security.backups.backupRetentionDays }}{% if security.backups.customerNotes.backupRetentionDays %} {{ security.backups.customerNotes.backupRetentionDays }}{% endif %} days.
{% endif %}
{% if security.backups.restoreTestingCadence and security.backups.restoreTestingCadence != "none" %}Backup restoration is tested on a {{ security.backups.restoreTestingCadenceLabel | lower }}{% if security.backups.customerNotes.restoreTestingCadence %} {{ security.backups.customerNotes.restoreTestingCadence }}{% endif %} basis.
{% endif %}
{% if infrastructure.customerNotes.backupsEnabled %} {{ infrastructure.customerNotes.backupsEnabled }}{% endif %}{% endif %}

{% if security.vendorRisk.vendorReviewRequiredHasValue or security.vendorRisk.dpaRequiredForProcessorsHasValue or vendors.dataProcessorsHasValue %}
## Vendor risk management

{% if security.vendorRisk.vendorReviewRequiredHasValue %}Vendors with access to critical systems or customer data are assessed before use{% if security.vendorRisk.vendorReviewCadenceLabel %} and reviewed on a {{ security.vendorRisk.vendorReviewCadenceLabel | lower }}{% if security.vendorRisk.customerNotes.vendorReviewCadence %} {{ security.vendorRisk.customerNotes.vendorReviewCadence }}{% endif %} basis{% endif %}.{% if security.vendorRisk.customerNotes.vendorReviewRequired %} {{ security.vendorRisk.customerNotes.vendorReviewRequired }}{% endif %}
{% if security.vendorRisk.customerNotes.vendorReviewRequired %} {{ security.vendorRisk.customerNotes.vendorReviewRequired }}{% endif %}{% elif vendors.dataProcessorsHasValue %}We assess vendors that process customer data on our behalf.{% if security.vendorRisk.customerNotes.vendorReviewRequired %} {{ security.vendorRisk.customerNotes.vendorReviewRequired }}{% endif %}
{% endif %}
{% if security.vendorRisk.dpaRequiredForProcessorsHasValue %}Data processing agreements are required for vendors that process personal data on our behalf.{% if security.vendorRisk.customerNotes.dpaRequiredForProcessors %} {{ security.vendorRisk.customerNotes.dpaRequiredForProcessors }}{% endif %}
{% endif %}
Our current data processors and subprocessors are described in our dedicated subprocessors document.
{% endif %}

{% if security.vulnerabilityManagement.vulnerabilityDisclosureProgramExistsHasValue %}
## Responsible disclosure

We welcome good-faith vulnerability reports and ask researchers to provide a reasonable opportunity to investigate and remediate an issue before public disclosure.{% if security.vulnerabilityManagement.customerNotes.vulnerabilityDisclosureProgramExists %} {{ security.vulnerabilityManagement.customerNotes.vulnerabilityDisclosureProgramExists }}{% endif %}
{% if security.vulnerabilityManagement.vulnerabilityDisclosureUrl %}Instructions for reporting vulnerabilities are available at {{ security.vulnerabilityManagement.vulnerabilityDisclosureUrl }}{% if security.vulnerabilityManagement.customerNotes.vulnerabilityDisclosureUrl %} {{ security.vulnerabilityManagement.customerNotes.vulnerabilityDisclosureUrl }}{% endif %}.
{% endif %}
{% if security.vulnerabilityManagement.customerNotes.vulnerabilityDisclosureProgramExists %} {{ security.vulnerabilityManagement.customerNotes.vulnerabilityDisclosureProgramExists }}{% endif %}{% endif %}

## Shared responsibility

Customers are responsible for protecting their account credentials, managing authorized users, configuring available security settings appropriately, and notifying us promptly of suspected unauthorized access. Security also depends on the safeguards provided by the infrastructure and service providers used to deliver our services.

## Reporting a security concern

{% if organization.securityContactEmail %}To report a vulnerability or security concern, contact {{ organization.securityContactEmail }}{% if organization.customerNotes.securityContactEmail %} {{ organization.customerNotes.securityContactEmail }}{% endif %}.{% elif organization.contactEmail %}To report a vulnerability or security concern, contact {{ organization.contactEmail }}{% if organization.customerNotes.contactEmail %} {{ organization.customerNotes.contactEmail }}{% endif %}.{% else %}Please contact us promptly if you discover a vulnerability or security concern.{% endif %}
