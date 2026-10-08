' slug: subprocessors
' name: Subprocessors
' description: A customer-facing subprocessor summary based on the organization's vendor data processors.

# {{ organization.name }} Subprocessors

{% if organization.customerNotes.name %} {{ organization.customerNotes.name }}{% endif %}

{% if vendors.dataProcessorsHasValue %}
{{ organization.name }}{% if organization.customerNotes.name %} {{ organization.customerNotes.name }}{% endif %} uses the following vendors to process organization or customer data. This list includes vendors with limited data processing and vendors classified as subprocessors, organized by service.

{% for serviceGroup in vendors.byService -%}
{% if serviceGroup.vendors.length %}
## {{ serviceGroup.serviceName }}

| Vendor | Legal name | Purpose | Data processed | Data regions |
| --- | --- | --- | --- | --- |
{% for vendor in serviceGroup.vendors -%}
| {{ vendor.name }}{% if vendor.customerNotes.name %}<br />{{ vendor.customerNotes.name }}{% endif %} | {{ vendor.legalName }}{% if vendor.customerNotes.legalName %}<br />{{ vendor.customerNotes.legalName }}{% endif %} | {{ vendor.purpose }}{% if vendor.customerNotes.purpose %}<br />{{ vendor.customerNotes.purpose }}{% endif %} | {{ vendor.dataProcessed | join(", ") }}{% if vendor.customerNotes.dataProcessed %}<br />{{ vendor.customerNotes.dataProcessed }}{% endif %} | {{ vendor.dataRegionLabels | join(", ") }}{% if vendor.customerNotes.dataRegions %}<br />{{ vendor.customerNotes.dataRegions }}{% endif %} |
{% endfor %}

{% endif %}
{%- endfor %}
{% else %}
{{ organization.name }}{% if organization.customerNotes.name %} {{ organization.customerNotes.name }}{% endif %} does not currently list any vendors that process organization or customer data.
{% endif %}
