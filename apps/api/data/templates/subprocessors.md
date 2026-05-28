' slug: subprocessors
' name: Subprocessors
' description: A customer-facing subprocessor summary based on the organization's vendor data processors.

# {{ organization.name }} Data Processors and Subprocessors

{% if vendors.dataProcessorsHasValue %}
{{ organization.name }} uses the following vendors to process organization or customer data. This list includes vendors with limited data processing and vendors classified as subprocessors, organized by service.

{% for serviceGroup in vendors.byService -%}
## {{ serviceGroup.serviceName }}

{% if serviceGroup.vendors.length %}
| Vendor | Legal name | Service | Processing level | Purpose | Data processed | Data regions | DPA status |
| --- | --- | --- | --- | --- | --- | --- | --- |
{% for vendor in serviceGroup.vendors -%}
| {{ vendor.name }} | {{ vendor.legalName }} | {{ vendor.serviceName }} | {{ vendor.dataProcessingLevel }} | {{ vendor.purpose }} | {{ vendor.dataProcessed | join(", ") }} | {{ vendor.dataRegions | join(", ") }} | {{ vendor.dpaStatus }} |
{% endfor %}
{% else %}
No data processors are listed for this service.
{% endif %}

{% endfor %}
{% else %}
{{ organization.name }} does not currently list any vendors that process organization or customer data.
{% endif %}
