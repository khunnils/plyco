' slug: data-retention-schedule
' name: Data Retention Schedule
' description: An internal retention register organized by service and processing activity, including data categories, purposes, legal bases, and recorded retention periods.

# {{ organization.name }} Data Retention Schedule

{% if policy.version %}_Version {{ policy.version }}_{% endif %}
{% if policy.lastUpdatedDate %}_Last updated: {{ policy.lastUpdatedDate }}_{% endif %}

This schedule records the retention periods currently assigned to processing activities operated by {{ organization.legalEntityName or organization.name }}. Owners should review entries marked “Not defined” before relying on this schedule as an operational control.

## Retention schedule

{% if services.hasActivities %}
{% for service in services.all %}
{% if service.activities.length %}
### {{ service.name }}

{% if service.description %}{{ service.description }}
{% endif %}

| Processing activity | Purpose | Data categories | Legal basis | Retention period |
| --- | --- | --- | --- | --- |
{% for activity in service.activities -%}
| {{ activity.name }} | {{ activity.purpose or "Not recorded" }} | {{ activity.dataTypeNames | join(", ") or "Not recorded" }} | {{ activity.legalBasisLabels | join(", ") or "Not recorded" }} | {{ activity.retentionLabel or "Not defined" }} |
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
| {{ dataType.name }} | {{ dataType.description or "Not recorded" }} | {{ dataType.subjectTypeLabels | join(", ") or "Not recorded" }} | {{ dataType.collectionMethodLabels | join(", ") or "Not recorded" }} | {% if dataType.isSensitive %}Yes{% else %}No{% endif %} | {% if dataType.isRequired %}Yes{% else %}No{% endif %} |
{% endfor %}
{% else %}
No data categories are currently recorded.
{% endif %}

## Review guidance

Retention should be limited to the period needed for the recorded purpose, applicable legal or contractual requirements, and the establishment or defense of legal claims. When a retention period expires, data should be deleted or irreversibly anonymized unless a documented exception applies.

Questions about this schedule should be directed to {% if organization.privacyContactEmail %}{{ organization.privacyContactEmail }}{% elif organization.contactEmail %}{{ organization.contactEmail }}{% else %}the organization’s privacy contact{% endif %}.

