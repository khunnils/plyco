' slug: data-retention-schedule
' name: Data Retention Schedule
' description: An internal retention register organized by service and processing activity, including data categories, purposes, legal bases, and recorded retention periods.

# {{ organization.name }} Data Retention Schedule

{% if organization.customerNotes.name %} {{ organization.customerNotes.name }}{% endif %}

{% if policy.version %}_Version {{ policy.version }}_{% endif %}
{% if policy.lastUpdatedDate %}_Last updated: {{ policy.lastUpdatedDate }}_{% endif %}

This schedule records the retention periods currently assigned to processing activities operated by {{ organization.legalEntityName or organization.name }}{% if organization.legalEntityName %}{% if organization.customerNotes.legalEntityName %} {{ organization.customerNotes.legalEntityName }}{% endif %}{% endif %}{% if not organization.legalEntityName %}{% if organization.customerNotes.name %} {{ organization.customerNotes.name }}{% endif %}{% endif %}. Owners should review entries marked “Not defined” before relying on this schedule as an operational control.

## Retention schedule

{% if services.hasActivities %}
{% for service in services.all %}
{% if service.activities.length %}
{% if service.customerNotes.businessActivityIds %}{{ service.customerNotes.businessActivityIds }}{% endif %}
### {{ service.name }}

{% if service.customerNotes.name %} {{ service.customerNotes.name }}{% endif %}

{% if service.description %}{{ service.description }}{% if service.customerNotes.description %} {{ service.customerNotes.description }}{% endif %}
{% endif %}

| Processing activity | Purpose | Data categories | Legal basis | Retention period |
| --- | --- | --- | --- | --- |
{% for activity in service.activities -%}
| {{ activity.name }}{% if activity.customerNotes.name %}<br />{{ activity.customerNotes.name }}{% endif %} | {{ activity.purpose or "Not recorded" }}{% if activity.customerNotes.purpose %}<br />{{ activity.customerNotes.purpose }}{% endif %} | {{ activity.dataTypeNames | join(", ") or "Not recorded" }}{% if activity.customerNotes.dataTypeIds %}<br />{{ activity.customerNotes.dataTypeIds }}{% endif %} | {{ activity.legalBasisLabels | join(", ") or "Not recorded" }}{% if activity.customerNotes.legalBasis %}<br />{{ activity.customerNotes.legalBasis }}{% endif %} | {{ activity.retentionLabel or "Not defined" }}{% if activity.customerNotes.retentionPolicy %}<br />{{ activity.customerNotes.retentionPolicy }}{% endif %} |
{% endfor %}

{% endif %}
{% endfor %}
{% else %}
No processing activities are currently recorded.
{% endif %}

## Data category reference

{% if dataHandling.dataTypesStoredHasValue %}
| Data category | Description | Data subjects | Collection methods | Sensitive | Required for the service |
| --- | --- | --- | --- | --- | --- |
{% for dataType in dataHandling.dataTypesStored -%}
| {{ dataType.name }}{% if dataType.customerNotes.name %}<br />{{ dataType.customerNotes.name }}{% endif %} | {{ dataType.description or "Not recorded" }}{% if dataType.customerNotes.description %}<br />{{ dataType.customerNotes.description }}{% endif %} | {{ dataType.subjectTypeLabels | join(", ") or "Not recorded" }}{% if dataType.customerNotes.subjectTypes %}<br />{{ dataType.customerNotes.subjectTypes }}{% endif %} | {{ dataType.collectionMethodLabels | join(", ") or "Not recorded" }}{% if dataType.customerNotes.collectionMethods %}<br />{{ dataType.customerNotes.collectionMethods }}{% endif %} | {% if dataType.isSensitive %}Yes{% if dataType.customerNotes.isSensitive %}<br />{{ dataType.customerNotes.isSensitive }}{% endif %}{% else %}No{% if dataType.customerNotes.isSensitive %}<br />{{ dataType.customerNotes.isSensitive }}{% endif %}{% endif %} | {% if dataType.isRequired %}Yes{% if dataType.customerNotes.isRequired %}<br />{{ dataType.customerNotes.isRequired }}{% endif %}{% else %}No{% if dataType.customerNotes.isRequired %}<br />{{ dataType.customerNotes.isRequired }}{% endif %}{% endif %} |
{% endfor %}
{% else %}
No data categories are currently recorded.
{% endif %}

## Review guidance

Retention should be limited to the period needed for the recorded purpose, applicable legal or contractual requirements, and the establishment or defense of legal claims. When a retention period expires, data should be deleted or irreversibly anonymized unless a documented exception applies.

Questions about this schedule should be directed to {% if organization.privacyContactEmail %}{{ organization.privacyContactEmail }}{% if organization.customerNotes.privacyContactEmail %} {{ organization.customerNotes.privacyContactEmail }}{% endif %}{% elif organization.contactEmail %}{{ organization.contactEmail }}{% if organization.customerNotes.contactEmail %} {{ organization.customerNotes.contactEmail }}{% endif %}{% else %}the organization’s privacy contact{% endif %}.

