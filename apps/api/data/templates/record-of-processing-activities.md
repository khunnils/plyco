' slug: record-of-processing-activities
' name: Record of Processing Activities (RoPA)
' description: An internal GDPR Article 30 processing register covering purposes, roles, data categories, recipients, transfers, retention, and safeguards.

# {{ organization.name }} Record of Processing Activities

{% if organization.customerNotes.name %} {{ organization.customerNotes.name }}{% endif %}

{% if policy.version %}_Version {{ policy.version }}_{% endif %}
{% if policy.lastUpdatedDate %}_Last updated: {{ policy.lastUpdatedDate }}_{% endif %}

This record documents the personal-data processing activities carried out by {{ organization.legalEntityName or organization.name }}{% if organization.legalEntityName %}{% if organization.customerNotes.legalEntityName %} {{ organization.customerNotes.legalEntityName }}{% endif %}{% endif %}{% if not organization.legalEntityName %}{% if organization.customerNotes.name %} {{ organization.customerNotes.name }}{% endif %}{% endif %}. It is intended to support the record-keeping requirements in Article 30 of the GDPR and should be reviewed whenever processing operations materially change.

## Organization and privacy contacts

| Field | Details |
| --- | --- |
| Organization | {{ organization.legalEntityName or organization.name }}{% if organization.legalEntityName %}{% if organization.customerNotes.legalEntityName %}<br />{{ organization.customerNotes.legalEntityName }}{% endif %}{% endif %}{% if not organization.legalEntityName %}{% if organization.customerNotes.name %}<br />{{ organization.customerNotes.name }}{% endif %}{% endif %} |
| Address | {{ organization.address or "Not recorded" }}{% if organization.customerNotes.address %}<br />{{ organization.customerNotes.address }}{% endif %} |
| Country | {{ organization.countryLabel or "Not recorded" }}{% if organization.customerNotes.country %}<br />{{ organization.customerNotes.country }}{% endif %} |
| Privacy contact | {{ organization.privacyContactEmail or organization.contactEmail or "Not recorded" }}{% if organization.privacyContactEmail %}{% if organization.customerNotes.privacyContactEmail %}<br />{{ organization.customerNotes.privacyContactEmail }}{% endif %}{% endif %}{% if not organization.privacyContactEmail %}{% if organization.customerNotes.contactEmail %}<br />{{ organization.customerNotes.contactEmail }}{% endif %}{% endif %} |
| Data Protection Officer | {% if privacy.dpoName %}{{ privacy.dpoName }}{% if privacy.customerNotes.dpoName %}<br />{{ privacy.customerNotes.dpoName }}{% endif %}{% if privacy.dpoEmail %} ({{ privacy.dpoEmail }}{% if privacy.customerNotes.dpoEmail %}<br />{{ privacy.customerNotes.dpoEmail }}{% endif %}){% endif %}{% elif privacy.dpoStatusLabel %}{{ privacy.dpoStatusLabel }}{% if privacy.customerNotes.dpoStatus %}<br />{{ privacy.customerNotes.dpoStatus }}{% endif %}{% else %}Not recorded{% endif %} |
| EU representative | {% if privacy.euRepresentativeName %}{{ privacy.euRepresentativeName }}{% if privacy.customerNotes.euRepresentativeName %}<br />{{ privacy.customerNotes.euRepresentativeName }}{% endif %}{% if privacy.euRepresentativeAddress %}, {{ privacy.euRepresentativeAddress }}{% if privacy.customerNotes.euRepresentativeAddress %}<br />{{ privacy.customerNotes.euRepresentativeAddress }}{% endif %}{% endif %}{% elif privacy.euRepresentativeStatusLabel %}{{ privacy.euRepresentativeStatusLabel }}{% if privacy.customerNotes.euRepresentativeStatus %}<br />{{ privacy.customerNotes.euRepresentativeStatus }}{% endif %}{% else %}Not recorded{% endif %} |

## Processing activities

{% if services.hasActivities %}
{% for service in services.all %}
{% if service.activities.length %}
{% if service.customerNotes.businessActivityIds %}{{ service.customerNotes.businessActivityIds }}{% endif %}
### {{ service.name or "Unnamed service" }}

{% if service.customerNotes.name %} {{ service.customerNotes.name }}{% endif %}

{% if service.description %}{{ service.description }}{% if service.customerNotes.description %} {{ service.customerNotes.description }}{% endif %}
{% endif %}
{% for activity in service.activities %}
#### {{ activity.name }}

{% if activity.customerNotes.name %} {{ activity.customerNotes.name }}{% endif %}

| Field | Details |
| --- | --- |
| Purpose of processing | {{ activity.purpose or "Not recorded" }}{% if activity.customerNotes.purpose %}<br />{{ activity.customerNotes.purpose }}{% endif %} |
| GDPR role | {{ activity.roleLabel or "Not recorded" }}{% if activity.customerNotes.role %}<br />{{ activity.customerNotes.role }}{% endif %} |
| Legal basis | {{ activity.legalBasisLabels | join(", ") or "Not recorded" }}{% if activity.customerNotes.legalBasis %}<br />{{ activity.customerNotes.legalBasis }}{% endif %} |
| Retention period | {{ activity.retentionLabel or "Not recorded" }}{% if activity.customerNotes.retentionPolicy %}<br />{{ activity.customerNotes.retentionPolicy }}{% endif %} |
| Primary hosting region | {{ service.privacy.primaryHostingRegionLabel or "Not recorded" }}{% if service.privacy.customerNotes.primaryHostingRegion %}<br />{{ service.privacy.customerNotes.primaryHostingRegion }}{% endif %} |

**Categories of personal data and data subjects**

{% if activity.dataTypes.length %}
| Personal data category | Data subjects | Sensitive | Collection method |
| --- | --- | --- | --- |
{% for dataType in activity.dataTypes -%}
| {{ dataType.name }}{% if dataType.customerNotes.name %}<br />{{ dataType.customerNotes.name }}{% endif %}{% if dataType.description %}: {{ dataType.description }}{% if dataType.customerNotes.description %}<br />{{ dataType.customerNotes.description }}{% endif %}{% endif %} | {{ dataType.subjectTypeLabels | join(", ") or "Not recorded" }}{% if dataType.customerNotes.subjectTypes %}<br />{{ dataType.customerNotes.subjectTypes }}{% endif %} | {% if dataType.isSensitive %}Yes{% if dataType.customerNotes.isSensitive %}<br />{{ dataType.customerNotes.isSensitive }}{% endif %}{% elif dataType.isSensitive == false %}No{% if dataType.customerNotes.isSensitive %}<br />{{ dataType.customerNotes.isSensitive }}{% endif %}{% else %}Not recorded{% if dataType.customerNotes.isSensitive %}<br />{{ dataType.customerNotes.isSensitive }}{% endif %}{% endif %} | {{ dataType.collectionMethodLabels | join(", ") or "Not recorded" }}{% if dataType.customerNotes.collectionMethods %}<br />{{ dataType.customerNotes.collectionMethods }}{% endif %} |
{% endfor %}
{% else %}
No personal data categories are mapped to this activity.
{% endif %}

**Recipients and processors used by this service**

{% if service.vendors.length %}
| Recipient / processor | Processing role | Purpose | Data processed | Processing regions |
| --- | --- | --- | --- | --- |
{% for vendor in service.vendors -%}
| {{ vendor.name or "Not recorded" }}{% if vendor.customerNotes.name %}<br />{{ vendor.customerNotes.name }}{% endif %} | {{ vendor.dataProcessingLevelLabel or "Not recorded" }}{% if vendor.customerNotes.dataProcessingLevel %}<br />{{ vendor.customerNotes.dataProcessingLevel }}{% endif %} | {{ vendor.purpose or "Not recorded" }}{% if vendor.customerNotes.purpose %}<br />{{ vendor.customerNotes.purpose }}{% endif %} | {{ vendor.dataProcessed | join(", ") or "Not recorded" }}{% if vendor.customerNotes.dataProcessed %}<br />{{ vendor.customerNotes.dataProcessed }}{% endif %} | {{ vendor.dataRegionLabels | join(", ") or "Not recorded" }}{% if vendor.customerNotes.dataRegions %}<br />{{ vendor.customerNotes.dataRegions }}{% endif %} |
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
Cross-border transfers are recorded. The safeguards in use are: {{ privacy.transferMechanismLabels | join(", ") or "Not recorded" }}{% if privacy.customerNotes.transferMechanisms %} {{ privacy.customerNotes.transferMechanisms }}{% endif %}.{% if privacy.customerNotes.crossBorderTransfers %} {{ privacy.customerNotes.crossBorderTransfers }}{% endif %}
{% if privacy.customerNotes.crossBorderTransfers %} {{ privacy.customerNotes.crossBorderTransfers }}{% endif %}{% elif privacy.crossBorderTransfersAnswered %}
No cross-border transfers are currently recorded.{% if privacy.customerNotes.crossBorderTransfers %} {{ privacy.customerNotes.crossBorderTransfers }}{% endif %}
{% if privacy.customerNotes.crossBorderTransfers %} {{ privacy.customerNotes.crossBorderTransfers }}{% endif %}{% else %}
Cross-border transfer status is not recorded.{% if privacy.customerNotes.crossBorderTransfers %} {{ privacy.customerNotes.crossBorderTransfers }}{% endif %}
{% if privacy.customerNotes.crossBorderTransfers %} {{ privacy.customerNotes.crossBorderTransfers }}{% endif %}{% endif %}

Processing and hosting locations for individual services and recipients are listed above where available.

## Technical and organizational security measures

The following safeguards are recorded for the processing covered by this register:

{% if security.accessControl.leastPrivilege %}- Least-privilege access controls{% if security.accessControl.customerNotes.leastPrivilege %} {{ security.accessControl.customerNotes.leastPrivilege }}{% endif %}
{% if security.accessControl.customerNotes.leastPrivilege %} {{ security.accessControl.customerNotes.leastPrivilege }}{% endif %}{% endif %}
{% if security.accessControl.roleBasedAccess %}- Role-based access controls{% if security.accessControl.customerNotes.roleBasedAccess %} {{ security.accessControl.customerNotes.roleBasedAccess }}{% endif %}
{% if security.accessControl.customerNotes.roleBasedAccess %} {{ security.accessControl.customerNotes.roleBasedAccess }}{% endif %}{% endif %}
{% if security.authentication.mfaRequired %}- Multi-factor authentication{% if security.authentication.customerNotes.mfaRequired %} {{ security.authentication.customerNotes.mfaRequired }}{% endif %}
{% if security.authentication.customerNotes.mfaRequired %} {{ security.authentication.customerNotes.mfaRequired }}{% endif %}{% endif %}
{% if security.encryption.atRestAlgorithmLabel %}- Encryption at rest using {{ security.encryption.atRestAlgorithmLabel }}{% if security.encryption.customerNotes.atRestAlgorithm %} {{ security.encryption.customerNotes.atRestAlgorithm }}{% endif %}{% if infrastructure.customerNotes.encryptionAtRest %} {{ infrastructure.customerNotes.encryptionAtRest }}{% endif %}
{% endif %}
{% if security.encryption.inTransitMinimumTlsVersionLabel %}- Encryption in transit using {{ security.encryption.inTransitMinimumTlsVersionLabel }}{% if security.encryption.customerNotes.inTransitMinimumTlsVersion %} {{ security.encryption.customerNotes.inTransitMinimumTlsVersion }}{% endif %}{% if infrastructure.customerNotes.encryptionInTransit %} {{ infrastructure.customerNotes.encryptionInTransit }}{% endif %} or later
{% endif %}
{% if security.logging.centralizedLogging %}- Centralized logging{% if security.logging.customerNotes.centralizedLogging %} {{ security.logging.customerNotes.centralizedLogging }}{% endif %}
{% endif %}
{% if security.logging.securityMonitoringLabel %}- {{ security.logging.securityMonitoringLabel }}{% if security.logging.customerNotes.securityMonitoring %} {{ security.logging.customerNotes.securityMonitoring }}{% endif %} security monitoring
{% if security.logging.customerNotes.securityMonitoring %} {{ security.logging.customerNotes.securityMonitoring }}{% endif %}{% endif %}
{% if security.vulnerabilityManagement.scanningCadenceLabel %}- Vulnerability scanning on a {{ security.vulnerabilityManagement.scanningCadenceLabel | lower }}{% if security.vulnerabilityManagement.customerNotes.scanningCadence %} {{ security.vulnerabilityManagement.customerNotes.scanningCadence }}{% endif %} basis
{% endif %}
{% if security.incidentResponse.planExists %}- A documented incident response plan{% if security.incidentResponse.customerNotes.planExists %} {{ security.incidentResponse.customerNotes.planExists }}{% endif %}
{% if security.incidentResponse.customerNotes.planExists %} {{ security.incidentResponse.customerNotes.planExists }}{% endif %}{% endif %}
{% if security.backups.backupCadenceLabel %}- Backups performed on a {{ security.backups.backupCadenceLabel | lower }}{% if security.backups.customerNotes.backupCadence %} {{ security.backups.customerNotes.backupCadence }}{% endif %} basis
{% endif %}
{% if security.vendorRisk.vendorReviewRequired %}- Security review of relevant vendors{% if security.vendorRisk.customerNotes.vendorReviewRequired %} {{ security.vendorRisk.customerNotes.vendorReviewRequired }}{% endif %}
{% if security.vendorRisk.customerNotes.vendorReviewRequired %} {{ security.vendorRisk.customerNotes.vendorReviewRequired }}{% endif %}{% endif %}

{% if not security.accessControl.leastPrivilege and not security.accessControl.roleBasedAccess and not security.authentication.mfaRequired and not security.encryption.atRestAlgorithmLabel and not security.encryption.inTransitMinimumTlsVersionLabel and not security.logging.centralizedLogging and not security.logging.securityMonitoringLabel and not security.vulnerabilityManagement.scanningCadenceLabel and not security.incidentResponse.planExists and not security.backups.backupCadenceLabel and not security.vendorRisk.vendorReviewRequired %}
No technical or organizational security measures are recorded.
{% endif %}

## Review notes

Review this register for completeness, including any joint controllers, controller customers for processor activities, recipient categories not represented by vendors, and transfer-specific safeguards that are not yet captured in the workspace.
