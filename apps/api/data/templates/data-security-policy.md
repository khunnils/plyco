' slug: data-security-policy
' name: Data Security Policy
' description: A customer-facing security policy for SaaS services, covering governance, secure development, access, protection, detection, response, recovery, and vendor risk.

# {{ organization.name }} Data Security Policy

{% if policy.version %}_Version {{ policy.version }}_{% endif %}
{% if policy.lastUpdatedDate %}_Last updated: {{ policy.lastUpdatedDate }}_{% endif %}

{{ organization.legalEntityName or organization.name }} maintains administrative, technical, and organizational safeguards designed to protect the services we provide and the customer data we process. This policy describes our current security practices. It does not represent a certification or guarantee that security incidents cannot occur.

## Governance and scope

This policy applies to the people, processes, systems, and infrastructure used to develop, operate, and support our services.

{% if services.all.length > 1 %}
The services covered by this policy are:

{% for service in services.all -%}
{% if service.name %}- {{ service.name }}
{% endif %}
{% endfor %}
{% elif service.name %}
This policy covers {{ service.name }}.
{% endif %}

We review and update this policy when our services, security practices, or material risks change.

{% if services.hasHostingRegion or infrastructure.organizationProviders.length %}
## Infrastructure and hosting

{% for service in services.all %}
{% if service.privacy.primaryHostingRegionLabel %}
{% if services.all.length > 1 %}{{ service.name }} is{% else %}The service is{% endif %} primarily hosted in {{ service.privacy.primaryHostingRegionLabel }}.
{% endif %}
{% endfor %}
{% if infrastructure.organizationProviders.length %}
We use established infrastructure and platform providers to operate critical systems, including:

{% for provider in infrastructure.organizationProviders -%}
- {{ provider.name or provider.providerId }}{% if provider.systemType %} ({{ provider.systemType | replace("_", " ") | replace("-", " ") }}){% endif %}
{% endfor %}
{% endif %}
{% endif %}

{% if security.developmentSecurity.codeReviewRequiredHasValue or security.developmentSecurity.dependencySecurityMonitoringHasValue or security.developmentSecurity.secretScanningHasValue or security.developmentSecurity.automatedTestingBeforeDeploymentHasValue or security.developmentSecurity.cicdDeploymentProcessHasValue or security.developmentSecurity.productionDeploymentApprovalRequiredHasValue %}
## Secure development and change management

We integrate security checks into software development and production changes.

{% if security.developmentSecurity.codeReviewRequiredHasValue %}- Code changes require review before they are merged.
{% endif %}
{% if security.developmentSecurity.dependencySecurityMonitoringHasValue %}- Software dependencies are monitored for known security vulnerabilities.
{% endif %}
{% if security.developmentSecurity.secretScanningHasValue %}- Source code is scanned for exposed credentials and secrets.
{% endif %}
{% if security.developmentSecurity.automatedTestingBeforeDeploymentHasValue %}- Automated tests must pass before changes are deployed.
{% endif %}
{% if security.developmentSecurity.cicdDeploymentProcessHasValue %}- Production deployments use a defined CI/CD process.
{% endif %}
{% if security.developmentSecurity.productionDeploymentApprovalRequiredHasValue %}- Production deployments require approval before release.
{% endif %}
{% endif %}

{% if security.accessControl.leastPrivilegeHasValue or security.accessControl.roleBasedAccessHasValue or security.accessControl.adminApprovalRequiredHasValue or security.accessControl.accessReviewCadenceLabel or access.accessReviewsPerformedHasValue or access.offboardingProcessExistsHasValue or (access.sharedAccountsExistAnswered and not access.sharedAccountsExist) %}
## Access control

{% if security.accessControl.leastPrivilegeHasValue %}We apply least-privilege principles so personnel receive only the access needed for their responsibilities.
{% endif %}
{% if security.accessControl.roleBasedAccessHasValue %}Access is assigned through defined roles.
{% endif %}
{% if security.accessControl.adminApprovalRequiredHasValue %}Administrative and other privileged access requires explicit approval.
{% endif %}
{% if security.accessControl.accessReviewCadenceLabel %}Access rights are reviewed on a {{ security.accessControl.accessReviewCadenceLabel | lower }} basis.
{% elif access.accessReviewsPerformedHasValue %}Access rights to critical systems are reviewed periodically.
{% endif %}
{% if access.offboardingProcessExistsHasValue %}A defined offboarding process removes access promptly when personnel leave or change roles.
{% endif %}
{% if access.sharedAccountsExistAnswered and not access.sharedAccountsExist %}Shared user accounts are not permitted on critical systems.
{% endif %}
{% endif %}

{% if security.authentication.mfaRequiredHasValue or security.authentication.ssoSupportedHasValue or security.authentication.passwordManagerRequiredHasValue %}
## Authentication

{% if security.authentication.mfaRequiredHasValue %}Multi-factor authentication is required for workforce access to critical systems.
{% endif %}
{% if security.authentication.ssoSupportedHasValue %}Single sign-on is used to centralize workforce authentication where supported.
{% endif %}
{% if security.authentication.passwordManagerRequiredHasValue %}Personnel are required to use an approved password manager for work credentials.
{% endif %}
{% endif %}

{% if access.securityTrainingRequiredHasValue or access.confidentialityAgreementsRequiredHasValue %}
## Personnel security

{% if access.securityTrainingRequiredHasValue %}Personnel complete security awareness training when they join and on a recurring basis thereafter.
{% endif %}
{% if access.confidentialityAgreementsRequiredHasValue %}Personnel are bound by confidentiality obligations covering customer and company data.
{% endif %}
{% endif %}

{% if security.encryption.atRestAlgorithmLabel or infrastructure.encryptionAtRestHasValue or security.encryption.inTransitMinimumTlsVersionLabel or infrastructure.encryptionInTransitHasValue or security.encryption.keyManagementProviderLabel or infrastructure.encryptedDevicesRequiredHasValue or (privacy.productionDataInDevelopmentAnswered and not privacy.productionDataInDevelopment) or privacy.retentionPolicyExistsHasValue %}
## Encryption and data protection

{% if security.encryption.atRestAlgorithmLabel %}Data at rest is encrypted using {{ security.encryption.atRestAlgorithmLabel }}.
{% elif infrastructure.encryptionAtRestHasValue %}Data at rest is encrypted.
{% endif %}
{% if security.encryption.inTransitMinimumTlsVersionLabel %}Data in transit is protected using {{ security.encryption.inTransitMinimumTlsVersionLabel }} or higher.
{% elif infrastructure.encryptionInTransitHasValue %}Data in transit is protected using industry-standard transport encryption.
{% endif %}
{% if security.encryption.keyManagementProvider == "none" %}Encryption keys are managed using controls provided by our infrastructure providers.
{% elif security.encryption.keyManagementProviderLabel %}Encryption keys are managed using {{ security.encryption.keyManagementProviderLabel }}.
{% endif %}
{% if infrastructure.encryptedDevicesRequiredHasValue %}Company devices used to access customer data are required to use full-disk encryption.
{% endif %}
{% if privacy.productionDataInDevelopmentAnswered and not privacy.productionDataInDevelopment %}Production customer data is not used in development or test environments.
{% endif %}
{% if privacy.retentionPolicyExistsHasValue %}We maintain data-retention practices intended to delete or anonymize data when it is no longer needed.
{% endif %}
{% endif %}

{% if dataHandling.dataTypesStoredHasValue %}
## Data categories

We process the following categories of data:

{% for dataType in dataHandling.dataTypesStored %}
- **{{ dataType.name }}**{% if dataType.description %}: {{ dataType.description }}{% endif %}{% if dataType.isSensitive %} _(sensitive)_{% endif %}

{% endfor %}
{% endif %}

{% if security.logging.centralizedLoggingHasValue or (security.logging.securityMonitoringHasValue and security.logging.securityMonitoring != "none") %}
## Monitoring and detection

{% if security.logging.centralizedLoggingHasValue %}Security-relevant logs are centralized to support investigation and operational review.
{% endif %}
{% if security.logging.securityMonitoringHasValue and security.logging.securityMonitoring != "none" %}Security events are monitored using {{ security.logging.securityMonitoringLabel | lower }} processes to identify suspicious activity and operational issues.
{% endif %}
{% endif %}

{% if (security.vulnerabilityManagement.scanningCadence and security.vulnerabilityManagement.scanningCadence != "none" and security.vulnerabilityManagement.scanningCadence != "not_defined") or security.vulnerabilityManagement.patchingSlaCriticalDaysHasValue or security.vulnerabilityManagement.patchingSlaHighDaysHasValue %}
## Vulnerability management

{% if security.vulnerabilityManagement.scanningCadence and security.vulnerabilityManagement.scanningCadence != "none" and security.vulnerabilityManagement.scanningCadence != "not_defined" %}Applications, dependencies, and infrastructure are scanned for known vulnerabilities on a {{ security.vulnerabilityManagement.scanningCadenceLabel | lower }} basis.
{% endif %}
{% if security.vulnerabilityManagement.patchingSlaCriticalDaysHasValue %}We target remediation of critical vulnerabilities within {{ security.vulnerabilityManagement.patchingSlaCriticalDays }} days.
{% endif %}
{% if security.vulnerabilityManagement.patchingSlaHighDaysHasValue %}We target remediation of high-severity vulnerabilities within {{ security.vulnerabilityManagement.patchingSlaHighDays }} days.
{% endif %}
{% endif %}

{% if security.vulnerabilityManagement.penetrationTestingStrategy == "external" and (security.vulnerabilityManagement.penetrationTestingCadenceLabel or security.vulnerabilityManagement.penetrationTestLastDate) %}
## Independent security testing

{% if security.vulnerabilityManagement.penetrationTestingCadenceLabel %}Independent third parties perform penetration testing on a {{ security.vulnerabilityManagement.penetrationTestingCadenceLabel | lower }} basis.
{% endif %}
{% if security.vulnerabilityManagement.penetrationTestLastDate %}The most recent penetration test was completed on {{ security.vulnerabilityManagement.penetrationTestLastDate }}.
{% endif %}
{% endif %}

{% if security.incidentResponse.planExistsHasValue %}
## Incident response

We maintain a documented process for identifying, containing, investigating, remediating, and learning from security incidents.
{% if security.incidentResponse.notificationTimelineLabel %}When an incident requires customer notification, affected customers are notified {{ security.incidentResponse.notificationTimelineLabel | lower }}.
{% endif %}
{% if security.incidentResponse.customerNotificationProcessLabel %}Customer notifications are delivered via {{ security.incidentResponse.customerNotificationProcessLabel | lower }}.
{% endif %}
{% if security.incidentResponse.lastTestedDate %}Our incident response process was last tested on {{ security.incidentResponse.lastTestedDate }}.
{% endif %}
{% endif %}

{% if infrastructure.backupsEnabledHasValue %}
## Backup and recovery

Critical production data is backed up{% if security.backups.backupCadenceLabel %} on a {{ security.backups.backupCadenceLabel | lower }} basis{% endif %}.
{% if security.backups.backupRetentionDaysHasValue %}Backups are retained for {{ security.backups.backupRetentionDays }} days.
{% endif %}
{% if security.backups.restoreTestingCadence and security.backups.restoreTestingCadence != "none" %}Backup restoration is tested on a {{ security.backups.restoreTestingCadenceLabel | lower }} basis.
{% endif %}
{% endif %}

{% if security.vendorRisk.vendorReviewRequiredHasValue or security.vendorRisk.dpaRequiredForProcessorsHasValue or vendors.dataProcessorsHasValue %}
## Vendor risk management

{% if security.vendorRisk.vendorReviewRequiredHasValue %}Vendors with access to critical systems or customer data are assessed before use{% if security.vendorRisk.vendorReviewCadenceLabel %} and reviewed on a {{ security.vendorRisk.vendorReviewCadenceLabel | lower }} basis{% endif %}.
{% elif vendors.dataProcessorsHasValue %}We assess vendors that process customer data on our behalf.
{% endif %}
{% if security.vendorRisk.dpaRequiredForProcessorsHasValue %}Data processing agreements are required for vendors that process personal data on our behalf.
{% endif %}
Our current data processors and subprocessors are described in our dedicated subprocessors document.
{% endif %}

{% if security.vulnerabilityManagement.vulnerabilityDisclosureProgramExistsHasValue %}
## Responsible disclosure

We welcome good-faith vulnerability reports and ask researchers to provide a reasonable opportunity to investigate and remediate an issue before public disclosure.
{% if security.vulnerabilityManagement.vulnerabilityDisclosureUrl %}Instructions for reporting vulnerabilities are available at {{ security.vulnerabilityManagement.vulnerabilityDisclosureUrl }}.
{% endif %}
{% endif %}

## Shared responsibility

Customers are responsible for protecting their account credentials, managing authorized users, configuring available security settings appropriately, and notifying us promptly of suspected unauthorized access. Security also depends on the safeguards provided by the infrastructure and service providers used to deliver our services.

## Reporting a security concern

{% if organization.securityContactEmail %}To report a vulnerability or security concern, contact {{ organization.securityContactEmail }}.{% elif organization.contactEmail %}To report a vulnerability or security concern, contact {{ organization.contactEmail }}.{% else %}Please contact us promptly if you discover a vulnerability or security concern.{% endif %}
