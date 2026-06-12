' slug: record-of-processing-activities
' name: Record of Processing Activities (RoPA)
' description: An internal GDPR Article 30 processing register covering purposes, roles, data categories, recipients, transfers, retention, and safeguards.

# {{ organization.name }} Record of Processing Activities

{% if policy.version %}_Version {{ policy.version }}_{% endif %}
{% if policy.lastUpdatedDate %}_Last updated: {{ policy.lastUpdatedDate }}_{% endif %}

This record documents the personal-data processing activities carried out by {{ organization.legalEntityName or organization.name }}. It is intended to support the record-keeping requirements in Article 30 of the GDPR and should be reviewed whenever processing operations materially change.

## Organization and privacy contacts

| Field | Details |
| --- | --- |
| Organization | {{ organization.legalEntityName or organization.name }} |
| Address | {{ organization.address or "Not recorded" }} |
| Country | {{ organization.country or "Not recorded" }} |
| Privacy contact | {{ organization.privacyContactEmail or organization.contactEmail or "Not recorded" }} |
| Data Protection Officer | {% if privacy.dpoName %}{{ privacy.dpoName }}{% if privacy.dpoEmail %} ({{ privacy.dpoEmail }}){% endif %}{% elif privacy.dpoStatusLabel %}{{ privacy.dpoStatusLabel }}{% else %}Not recorded{% endif %} |
| EU representative | {% if privacy.euRepresentativeName %}{{ privacy.euRepresentativeName }}{% if privacy.euRepresentativeAddress %}, {{ privacy.euRepresentativeAddress }}{% endif %}{% elif privacy.euRepresentativeStatusLabel %}{{ privacy.euRepresentativeStatusLabel }}{% else %}Not recorded{% endif %} |

## Processing activities

{% if services.hasActivities %}
{% for service in services.all %}
{% if service.activities.length %}
### {{ service.name or "Unnamed service" }}

{% if service.description %}{{ service.description }}
{% endif %}
{% for activity in service.activities %}
#### {{ activity.name }}

| Field | Details |
| --- | --- |
| Purpose of processing | {{ activity.purpose or "Not recorded" }} |
| GDPR role | {{ activity.roleLabel or activity.role or "Not recorded" }} |
| Legal basis | {{ activity.legalBasisLabels | join(", ") or "Not recorded" }} |
| Retention period | {{ activity.retentionLabel or "Not recorded" }} |
| Primary hosting region | {{ service.privacy.primaryHostingRegionLabel or "Not recorded" }} |

**Categories of personal data and data subjects**

{% if activity.dataTypes.length %}
| Personal data category | Data subjects | Sensitive | Collection method |
| --- | --- | --- | --- |
{% for dataType in activity.dataTypes -%}
| {{ dataType.name }}{% if dataType.description %}: {{ dataType.description }}{% endif %} | {{ dataType.subjectTypes | join(", ") or "Not recorded" }} | {% if dataType.isSensitive %}Yes{% elif dataType.isSensitive == false %}No{% else %}Not recorded{% endif %} | {{ dataType.collectionMethods | join(", ") or "Not recorded" }} |
{% endfor %}
{% else %}
No personal data categories are mapped to this activity.
{% endif %}

**Recipients and processors used by this service**

{% if service.vendors.length %}
| Recipient / processor | Processing role | Purpose | Data processed | Processing regions |
| --- | --- | --- | --- | --- |
{% for vendor in service.vendors -%}
| {{ vendor.name or "Not recorded" }} | {{ vendor.dataProcessingLevel or "Not recorded" }} | {{ vendor.purpose or "Not recorded" }} | {{ vendor.dataProcessed | join(", ") or "Not recorded" }} | {{ vendor.dataRegions | join(", ") or "Not recorded" }} |
{% endfor %}
{% else %}
No recipients or processors are recorded for this service.
{% endif %}

{% endfor %}
{% endif %}
{% endfor %}
{% else %}
No processing activities are recorded. Add each processing purpose, GDPR role, legal basis, data category, and retention period before relying on this register.
{% endif %}

## International transfers

{% if privacy.crossBorderTransfers %}
Cross-border transfers are recorded. The safeguards in use are: {{ privacy.transferMechanismLabels | join(", ") or "Not recorded" }}.
{% elif privacy.crossBorderTransfersAnswered %}
No cross-border transfers are currently recorded.
{% else %}
Cross-border transfer status is not recorded.
{% endif %}

Processing and hosting locations for individual services and recipients are listed above where available.

## Technical and organizational security measures

The following safeguards are recorded for the processing covered by this register:

{% if security.accessControl.leastPrivilege %}- Least-privilege access controls
{% endif %}
{% if security.accessControl.roleBasedAccess %}- Role-based access controls
{% endif %}
{% if security.authentication.mfaRequired %}- Multi-factor authentication
{% endif %}
{% if security.encryption.atRestAlgorithmLabel %}- Encryption at rest using {{ security.encryption.atRestAlgorithmLabel }}
{% endif %}
{% if security.encryption.inTransitMinimumTlsVersionLabel %}- Encryption in transit using {{ security.encryption.inTransitMinimumTlsVersionLabel }} or later
{% endif %}
{% if security.logging.centralizedLogging %}- Centralized logging
{% endif %}
{% if security.logging.securityMonitoringLabel %}- {{ security.logging.securityMonitoringLabel }} security monitoring
{% endif %}
{% if security.vulnerabilityManagement.scanningCadenceLabel %}- Vulnerability scanning on a {{ security.vulnerabilityManagement.scanningCadenceLabel | lower }} basis
{% endif %}
{% if security.incidentResponse.planExists %}- A documented incident response plan
{% endif %}
{% if security.backups.backupCadenceLabel %}- Backups performed on a {{ security.backups.backupCadenceLabel | lower }} basis
{% endif %}
{% if security.vendorRisk.vendorReviewRequired %}- Security review of relevant vendors
{% endif %}

{% if not security.accessControl.leastPrivilege and not security.accessControl.roleBasedAccess and not security.authentication.mfaRequired and not security.encryption.atRestAlgorithmLabel and not security.encryption.inTransitMinimumTlsVersionLabel and not security.logging.centralizedLogging and not security.logging.securityMonitoringLabel and not security.vulnerabilityManagement.scanningCadenceLabel and not security.incidentResponse.planExists and not security.backups.backupCadenceLabel and not security.vendorRisk.vendorReviewRequired %}
No technical or organizational security measures are recorded.
{% endif %}

## Review notes

Review this register for completeness, including any joint controllers, controller customers for processor activities, recipient categories not represented by vendors, and transfer-specific safeguards that are not yet captured in the workspace.
