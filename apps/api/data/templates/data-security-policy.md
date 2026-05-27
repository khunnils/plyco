' slug: data-security-policy
' name: Data Security Policy
' description: A customer-facing data security policy based on access control, encryption, monitoring, incident response, backup, and vendor risk data.

# {{ organization.name }} Data Security Policy

This policy summarizes the security controls {{ organization.name }} uses to protect {{ service.name }} and related customer data.

## Security Contact

Security inquiries may be sent to {{ organization.securityContactEmail }}.

## Access Control

{{ organization.name }} applies least-privilege access controls: {{ security.accessControl.leastPrivilege }}.

Role-based access: {{ security.accessControl.roleBasedAccess }}.

Access review cadence: {{ security.accessControl.accessReviewCadenceLabel }}.

Administrative approval required: {{ security.accessControl.adminApprovalRequired }}.

## Authentication

Multi-factor authentication required: {{ security.authentication.mfaRequired }}.

Single sign-on supported: {{ security.authentication.ssoSupported }}.

Password manager required: {{ security.authentication.passwordManagerRequired }}.

## Encryption and Key Management

Data at rest is protected with: {{ security.encryption.atRestAlgorithmLabel }}.

Minimum TLS version for data in transit: {{ security.encryption.inTransitMinimumTlsVersionLabel }}.

Key management provider: {{ security.encryption.keyManagementProviderLabel }}.

## Logging and Monitoring

Centralized logging enabled: {{ security.logging.centralizedLogging }}.

{% if security.logging.logRetentionDaysHasValue %}
Security logs are retained for {{ security.logging.logRetentionDays }} days.
{% else %}
Security log retention is not currently defined.
{% endif %}

Security monitoring owner: {{ security.logging.securityMonitoringOwnerLabel }}.

## Vulnerability Management

Vulnerability scanning cadence: {{ security.vulnerabilityManagement.scanningCadenceLabel }}.

{% if security.vulnerabilityManagement.patchingSlaCriticalDaysHasValue %}
Critical vulnerability patching SLA: {{ security.vulnerabilityManagement.patchingSlaCriticalDays }} days.
{% endif %}

{% if security.vulnerabilityManagement.patchingSlaHighDaysHasValue %}
High vulnerability patching SLA: {{ security.vulnerabilityManagement.patchingSlaHighDays }} days.
{% endif %}

## Incident Response

Incident response plan exists: {{ security.incidentResponse.planExists }}.

Customer notification timeline: {{ security.incidentResponse.notificationTimelineLabel }}.

Customer notification process: {{ security.incidentResponse.customerNotificationProcessLabel }}.

{% if security.incidentResponse.lastTestedDate %}
Last tested: {{ security.incidentResponse.lastTestedDate }}.
{% endif %}

## Backups and Recovery

Backup cadence: {{ security.backups.backupCadenceLabel }}.

{% if security.backups.backupRetentionDaysHasValue %}
Backups are retained for {{ security.backups.backupRetentionDays }} days.
{% else %}
Backup retention is not currently defined.
{% endif %}

Restore testing cadence: {{ security.backups.restoreTestingCadenceLabel }}.

## Vendor Risk Management

Vendor review required: {{ security.vendorRisk.vendorReviewRequired }}.

Vendor review cadence: {{ security.vendorRisk.vendorReviewCadenceLabel }}.

DPA required for processors: {{ security.vendorRisk.dpaRequiredForProcessors }}.

{% if vendors.dataProcessorsHasValue %}
Data processors are tracked in the vendor inventory:

| Vendor | Service | Processing level | DPA status |
| --- | --- | --- | --- |
{% for vendor in vendors.dataProcessors -%}
| {{ vendor.name }} | {{ vendor.serviceName }} | {{ vendor.dataProcessingLevel }} | {{ vendor.dpaStatus }} |
{% endfor %}
{% endif %}
