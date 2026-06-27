' slug: subprocessors
' name: Subprocessors
' description: A customer-facing subprocessor summary based on the organization's vendor data processors.

# {{ organization.name }} Data Processors and Subprocessors

{% if vendors.dataProcessorsHasValue %}
{{ organization.name }} uses the following vendors to process organization or customer data. This list includes vendors with limited data processing and vendors classified as subprocessors, organized by service.

{% for serviceGroup in vendors.byService -%}
{% if serviceGroup.vendors.length %}
## {{ serviceGroup.serviceName }}

| Vendor | Legal name | Purpose | Data processed | Data regions |
| --- | --- | --- | --- | --- |
{% for vendor in serviceGroup.vendors -%}
| {{ vendor.name }} | {{ vendor.legalName }} | {{ vendor.purpose }} | {{ vendor.dataProcessed | join(", ") }} | {{ vendor.dataRegions | join(", ") | upper }} |
{% endfor %}

{% endif %}
{%- endfor %}
{% else %}
{{ organization.name }} does not currently list any vendors that process organization or customer data.
{% endif %}
