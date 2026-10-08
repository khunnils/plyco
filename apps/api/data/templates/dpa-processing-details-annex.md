' slug: dpa-processing-details-annex
' name: DPA Processing Details Annex
' description: A contract-ready data processing annex covering services, processing purposes, data categories, data subjects, subprocessors, locations, transfers, and safeguards.

# Data Processing Details Annex

**Processor:** {{ organization.legalEntityName or organization.name }}{% if organization.legalEntityName %}{% if organization.customerNotes.legalEntityName %} {{ organization.customerNotes.legalEntityName }}{% endif %}{% endif %}{% if not organization.legalEntityName %}{% if organization.customerNotes.name %} {{ organization.customerNotes.name }}{% endif %}{% endif %}<br />
{% if organization.address %}**Address:** {{ organization.address }}{% if organization.customerNotes.address %} {{ organization.customerNotes.address }}{% endif %}{% if organization.countryLabel %}, {{ organization.countryLabel }}{% if organization.customerNotes.country %} {{ organization.customerNotes.country }}{% endif %}{% endif %}<br />
{% endif %}{% if policy.version %}**Version:** {{ policy.version }}<br />
{% endif %}{% if policy.effectiveDate %}**Effective date:** {{ policy.effectiveDate }}
{% endif %}

This Annex describes the processing details recorded for services provided by {{ organization.legalEntityName or organization.name }}{% if organization.legalEntityName %}{% if organization.customerNotes.legalEntityName %} {{ organization.customerNotes.legalEntityName }}{% endif %}{% endif %}{% if not organization.legalEntityName %}{% if organization.customerNotes.name %} {{ organization.customerNotes.name }}{% endif %}{% endif %}. It is intended to accompany a data processing agreement and should be reviewed by the parties before execution.

## 1. Services and processing activities

{% if services.hasActivities %}
{% for service in services.all %}
{% if service.processesCustomerData and service.activities.length %}
{% if service.customerNotes.processesCustomerData %}{{ service.customerNotes.processesCustomerData }}{% endif %}
{% if service.customerNotes.businessActivityIds %}{{ service.customerNotes.businessActivityIds }}{% endif %}
### {{ service.name }}

{% if service.customerNotes.name %} {{ service.customerNotes.name }}{% endif %}

{% if service.description %}{{ service.description }}{% if service.customerNotes.description %} {{ service.customerNotes.description }}{% endif %}
{% endif %}

| Processing activity | Purpose | Processing role | Legal basis | Data categories | Retention |
| --- | --- | --- | --- | --- | --- |
{% for activity in service.activities -%}
| {{ activity.name }}{% if activity.customerNotes.name %}<br />{{ activity.customerNotes.name }}{% endif %} | {{ activity.purpose or "Not recorded" }}{% if activity.customerNotes.purpose %}<br />{{ activity.customerNotes.purpose }}{% endif %} | {{ activity.roleLabel or "Not recorded" }}{% if activity.customerNotes.role %}<br />{{ activity.customerNotes.role }}{% endif %} | {{ activity.legalBasisLabels | join(", ") or "Not recorded" }}{% if activity.customerNotes.legalBasis %}<br />{{ activity.customerNotes.legalBasis }}{% endif %} | {{ activity.dataTypeNames | join(", ") or "Not recorded" }}{% if activity.customerNotes.dataTypeIds %}<br />{{ activity.customerNotes.dataTypeIds }}{% endif %} | {{ activity.retentionLabel or "Not recorded" }}{% if activity.customerNotes.retentionPolicy %}<br />{{ activity.customerNotes.retentionPolicy }}{% endif %} |
{% endfor %}

{% endif %}
{% endfor %}
{% else %}
No processing activities are currently recorded. The parties should complete this section before relying on the Annex.
{% endif %}

## 2. Categories of personal data and data subjects

{% if dataHandling.dataTypesStoredHasValue %}
| Personal data category | Data subjects | Collection methods | Sensitive | Required |
| --- | --- | --- | --- | --- |
{% for dataType in dataHandling.dataTypesStored -%}
| {{ dataType.name }}{% if dataType.customerNotes.name %}<br />{{ dataType.customerNotes.name }}{% endif %}{% if dataType.description %}: {{ dataType.description }}{% if dataType.customerNotes.description %}<br />{{ dataType.customerNotes.description }}{% endif %}{% endif %} | {{ dataType.subjectTypeLabels | join(", ") or "Not recorded" }}{% if dataType.customerNotes.subjectTypes %}<br />{{ dataType.customerNotes.subjectTypes }}{% endif %} | {{ dataType.collectionMethodLabels | join(", ") or "Not recorded" }}{% if dataType.customerNotes.collectionMethods %}<br />{{ dataType.customerNotes.collectionMethods }}{% endif %} | {% if dataType.isSensitive %}Yes{% if dataType.customerNotes.isSensitive %}<br />{{ dataType.customerNotes.isSensitive }}{% endif %}{% else %}No{% if dataType.customerNotes.isSensitive %}<br />{{ dataType.customerNotes.isSensitive }}{% endif %}{% endif %} | {% if dataType.isRequired %}Yes{% if dataType.customerNotes.isRequired %}<br />{{ dataType.customerNotes.isRequired }}{% endif %}{% else %}No{% if dataType.customerNotes.isRequired %}<br />{{ dataType.customerNotes.isRequired }}{% endif %}{% endif %} |
{% endfor %}
{% else %}
No personal data categories are currently recorded.
{% endif %}

## 3. Subprocessors and processing locations

{% if vendors.byService.length %}
{% for serviceGroup in vendors.byService %}
{% if serviceGroup.vendors.length %}
### {{ serviceGroup.serviceName }}

| Subprocessor or recipient | Purpose | Data processed | Processing regions | DPA status |
| --- | --- | --- | --- | --- |
{% for vendor in serviceGroup.vendors -%}
| {{ vendor.name or "Not recorded" }}{% if vendor.customerNotes.name %}<br />{{ vendor.customerNotes.name }}{% endif %} | {{ vendor.purpose or "Not recorded" }}{% if vendor.customerNotes.purpose %}<br />{{ vendor.customerNotes.purpose }}{% endif %} | {{ vendor.dataProcessed | join(", ") or "Not recorded" }}{% if vendor.customerNotes.dataProcessed %}<br />{{ vendor.customerNotes.dataProcessed }}{% endif %} | {{ vendor.dataRegionLabels | join(", ") or "Not recorded" }}{% if vendor.customerNotes.dataRegions %}<br />{{ vendor.customerNotes.dataRegions }}{% endif %} | {{ vendor.dpaStatusLabel or "Not recorded" }}{% if vendor.customerNotes.dpaStatus %}<br />{{ vendor.customerNotes.dpaStatus }}{% endif %} |
{% endfor %}

{% endif %}
{% endfor %}
{% else %}
No subprocessors or other data processors are currently recorded for customer-data services.
{% endif %}

## 4. International transfers

{% if privacy.crossBorderTransfers %}
Cross-border transfers are recorded. The recorded transfer mechanisms are: {{ privacy.transferMechanismLabels | join(", ") or "Not recorded" }}{% if privacy.customerNotes.transferMechanisms %} {{ privacy.customerNotes.transferMechanisms }}{% endif %}.{% if privacy.customerNotes.crossBorderTransfers %} {{ privacy.customerNotes.crossBorderTransfers }}{% endif %}
{% if privacy.customerNotes.crossBorderTransfers %} {{ privacy.customerNotes.crossBorderTransfers }}{% endif %}{% elif privacy.crossBorderTransfersAnswered %}
No cross-border transfers are currently recorded.{% if privacy.customerNotes.crossBorderTransfers %} {{ privacy.customerNotes.crossBorderTransfers }}{% endif %}
{% if privacy.customerNotes.crossBorderTransfers %} {{ privacy.customerNotes.crossBorderTransfers }}{% endif %}{% else %}
Cross-border transfer status has not been recorded.{% if privacy.customerNotes.crossBorderTransfers %} {{ privacy.customerNotes.crossBorderTransfers }}{% endif %}
{% if privacy.customerNotes.crossBorderTransfers %} {{ privacy.customerNotes.crossBorderTransfers }}{% endif %}{% endif %}

## 5. Technical and organizational safeguards

The recorded safeguards relevant to this processing include:

{% if security.accessControl.leastPrivilegeHasValue %}- Least-privilege access control{% if security.accessControl.customerNotes.leastPrivilege %} {{ security.accessControl.customerNotes.leastPrivilege }}{% endif %}
{% if security.accessControl.customerNotes.leastPrivilege %} {{ security.accessControl.customerNotes.leastPrivilege }}{% endif %}{% endif %}{% if security.accessControl.roleBasedAccessHasValue %}- Role-based access control{% if security.accessControl.customerNotes.roleBasedAccess %} {{ security.accessControl.customerNotes.roleBasedAccess }}{% endif %}
{% if security.accessControl.customerNotes.roleBasedAccess %} {{ security.accessControl.customerNotes.roleBasedAccess }}{% endif %}{% endif %}{% if security.authentication.mfaRequiredHasValue %}- Multi-factor authentication for workforce access{% if security.authentication.customerNotes.mfaRequired %} {{ security.authentication.customerNotes.mfaRequired }}{% endif %}
{% if security.authentication.customerNotes.mfaRequired %} {{ security.authentication.customerNotes.mfaRequired }}{% endif %}{% endif %}{% if security.encryption.atRestAlgorithmLabel %}- Encryption at rest using {{ security.encryption.atRestAlgorithmLabel }}{% if security.encryption.customerNotes.atRestAlgorithm %} {{ security.encryption.customerNotes.atRestAlgorithm }}{% endif %}{% if infrastructure.customerNotes.encryptionAtRest %} {{ infrastructure.customerNotes.encryptionAtRest }}{% endif %}
{% elif infrastructure.encryptionAtRestHasValue %}- Encryption at rest{% if infrastructure.customerNotes.encryptionAtRest %} {{ infrastructure.customerNotes.encryptionAtRest }}{% endif %}
{% endif %}{% if security.encryption.inTransitMinimumTlsVersionLabel %}- Encryption in transit using {{ security.encryption.inTransitMinimumTlsVersionLabel }}{% if security.encryption.customerNotes.inTransitMinimumTlsVersion %} {{ security.encryption.customerNotes.inTransitMinimumTlsVersion }}{% endif %}{% if infrastructure.customerNotes.encryptionInTransit %} {{ infrastructure.customerNotes.encryptionInTransit }}{% endif %} or higher
{% elif infrastructure.encryptionInTransitHasValue %}- Encryption in transit{% if infrastructure.customerNotes.encryptionInTransit %} {{ infrastructure.customerNotes.encryptionInTransit }}{% endif %}
{% endif %}{% if security.logging.centralizedLoggingHasValue %}- Centralized security logging{% if security.logging.customerNotes.centralizedLogging %} {{ security.logging.customerNotes.centralizedLogging }}{% endif %}
{% endif %}{% if security.vulnerabilityManagement.scanningCadenceLabel %}- Vulnerability scanning on a {{ security.vulnerabilityManagement.scanningCadenceLabel | lower }}{% if security.vulnerabilityManagement.customerNotes.scanningCadence %} {{ security.vulnerabilityManagement.customerNotes.scanningCadence }}{% endif %} cadence
{% endif %}{% if security.incidentResponse.planExistsHasValue %}- A documented incident response plan{% if security.incidentResponse.customerNotes.planExists %} {{ security.incidentResponse.customerNotes.planExists }}{% endif %}
{% if security.incidentResponse.customerNotes.planExists %} {{ security.incidentResponse.customerNotes.planExists }}{% endif %}{% endif %}{% if security.backups.backupCadenceLabel %}- Backups performed on a {{ security.backups.backupCadenceLabel | lower }}{% if security.backups.customerNotes.backupCadence %} {{ security.backups.customerNotes.backupCadence }}{% endif %} cadence
{% endif %}{% if security.vendorRisk.vendorReviewRequiredHasValue %}- Security review of relevant vendors{% if security.vendorRisk.customerNotes.vendorReviewRequired %} {{ security.vendorRisk.customerNotes.vendorReviewRequired }}{% endif %}
{% if security.vendorRisk.customerNotes.vendorReviewRequired %} {{ security.vendorRisk.customerNotes.vendorReviewRequired }}{% endif %}{% endif %}

Additional detail is available in the organization’s Technical and Organizational Measures Annex.

## 6. Privacy contact

Privacy inquiries may be sent to {% if organization.privacyContactEmail %}{{ organization.privacyContactEmail }}{% if organization.customerNotes.privacyContactEmail %} {{ organization.customerNotes.privacyContactEmail }}{% endif %}{% elif organization.contactEmail %}{{ organization.contactEmail }}{% if organization.customerNotes.contactEmail %} {{ organization.customerNotes.contactEmail }}{% endif %}{% else %}the processor’s designated privacy contact{% endif %}.
