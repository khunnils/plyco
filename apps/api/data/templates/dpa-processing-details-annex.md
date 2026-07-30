' slug: dpa-processing-details-annex
' name: DPA Processing Details Annex
' description: A contract-ready data processing annex covering services, processing purposes, data categories, data subjects, subprocessors, locations, transfers, and safeguards.

# Data Processing Details Annex

**Processor:** {{ organization.legalEntityName or organization.name }}  
{% if organization.address %}**Address:** {{ organization.address }}{% if organization.country %}, {{ organization.country }}{% endif %}  
{% endif %}{% if policy.version %}**Version:** {{ policy.version }}  
{% endif %}{% if policy.effectiveDate %}**Effective date:** {{ policy.effectiveDate }}
{% endif %}

This Annex describes the processing details recorded for services provided by {{ organization.legalEntityName or organization.name }}. It is intended to accompany a data processing agreement and should be reviewed by the parties before execution.

## 1. Services and processing activities

{% if services.hasActivities %}
{% for service in services.all %}
{% if service.processesCustomerData and service.activities.length %}
### {{ service.name }}

{% if service.description %}{{ service.description }}
{% endif %}

| Processing activity | Purpose | Processing role | Legal basis | Data categories | Retention |
| --- | --- | --- | --- | --- | --- |
{% for activity in service.activities -%}
| {{ activity.name }} | {{ activity.purpose or "Not recorded" }} | {{ activity.roleLabel or "Not recorded" }} | {{ activity.legalBasisLabels | join(", ") or "Not recorded" }} | {{ activity.dataTypeNames | join(", ") or "Not recorded" }} | {{ activity.retentionLabel or "Not recorded" }} |
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
| {{ dataType.name }}{% if dataType.description %}: {{ dataType.description }}{% endif %} | {{ dataType.subjectTypeLabels | join(", ") or "Not recorded" }} | {{ dataType.collectionMethodLabels | join(", ") or "Not recorded" }} | {% if dataType.isSensitive %}Yes{% else %}No{% endif %} | {% if dataType.isRequired %}Yes{% else %}No{% endif %} |
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
| {{ vendor.name or "Not recorded" }} | {{ vendor.purpose or "Not recorded" }} | {{ vendor.dataProcessed | join(", ") or "Not recorded" }} | {{ vendor.dataRegions | join(", ") or "Not recorded" }} | {{ vendor.dpaStatus or "Not recorded" }} |
{% endfor %}

{% endif %}
{% endfor %}
{% else %}
No subprocessors or other data processors are currently recorded for customer-data services.
{% endif %}

## 4. International transfers

{% if privacy.crossBorderTransfers %}
Cross-border transfers are recorded. The recorded transfer mechanisms are: {{ privacy.transferMechanismLabels | join(", ") or "Not recorded" }}.
{% elif privacy.crossBorderTransfersAnswered %}
No cross-border transfers are currently recorded.
{% else %}
Cross-border transfer status has not been recorded.
{% endif %}

## 5. Technical and organizational safeguards

The recorded safeguards relevant to this processing include:

{% if security.accessControl.leastPrivilegeHasValue %}- Least-privilege access control
{% endif %}{% if security.accessControl.roleBasedAccessHasValue %}- Role-based access control
{% endif %}{% if security.authentication.mfaRequiredHasValue %}- Multi-factor authentication for workforce access
{% endif %}{% if security.encryption.atRestAlgorithmLabel %}- Encryption at rest using {{ security.encryption.atRestAlgorithmLabel }}
{% elif infrastructure.encryptionAtRestHasValue %}- Encryption at rest
{% endif %}{% if security.encryption.inTransitMinimumTlsVersionLabel %}- Encryption in transit using {{ security.encryption.inTransitMinimumTlsVersionLabel }} or higher
{% elif infrastructure.encryptionInTransitHasValue %}- Encryption in transit
{% endif %}{% if security.logging.centralizedLoggingHasValue %}- Centralized security logging
{% endif %}{% if security.vulnerabilityManagement.scanningCadenceLabel %}- Vulnerability scanning on a {{ security.vulnerabilityManagement.scanningCadenceLabel | lower }} cadence
{% endif %}{% if security.incidentResponse.planExistsHasValue %}- A documented incident response plan
{% endif %}{% if security.backups.backupCadenceLabel %}- Backups performed on a {{ security.backups.backupCadenceLabel | lower }} cadence
{% endif %}{% if security.vendorRisk.vendorReviewRequiredHasValue %}- Security review of relevant vendors
{% endif %}

Additional detail is available in the organization’s Technical and Organizational Measures Annex.

## 6. Privacy contact

Privacy inquiries may be sent to {% if organization.privacyContactEmail %}{{ organization.privacyContactEmail }}{% elif organization.contactEmail %}{{ organization.contactEmail }}{% else %}the processor’s designated privacy contact{% endif %}.
