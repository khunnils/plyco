' slug: subprocessors
' name: Subprocessors
' description: A customer-facing subprocessor summary based on the organization's vendor data processors.

# {{ organization.name }} Data Processors and Subprocessors

{% if vendors.dataProcessorsHasValue %}
{{ organization.name }} uses the following vendors to process organization or customer data. This list includes vendors with limited data processing and vendors classified as subprocessors.

| Vendor | Legal name | Service | Processing level | Purpose | Data processed | Data regions | DPA status |
| --- | --- | --- | --- | --- | --- | --- | --- |
{% for vendor in vendors.dataProcessors -%}
| {{ vendor.name }} | {{ vendor.legalName }} | {{ vendor.serviceName }} | {{ vendor.dataProcessingLevel }} | {{ vendor.purpose }} | {{ vendor.dataProcessed | join(", ") }} | {{ vendor.dataRegions | join(", ") }} | {{ vendor.dpaStatus }} |
{% endfor %}
{% else %}
{{ organization.name }} does not currently list any vendors that process organization or customer data.
{% endif %}

## Subprocessors

{% if vendors.subprocessorsHasValue %}
The following vendors are classified as subprocessors:

| Subprocessor | Legal name | Service | Purpose | Data processed | Data regions | DPA status |
| --- | --- | --- | --- | --- | --- | --- |
{% for vendor in vendors.subprocessors -%}
| {{ vendor.name }} | {{ vendor.legalName }} | {{ vendor.serviceName }} | {{ vendor.purpose }} | {{ vendor.dataProcessed | join(", ") }} | {{ vendor.dataRegions | join(", ") }} | {{ vendor.dpaStatus }} |
{% endfor %}
{% else %}
{{ organization.name }} does not currently list any vendors classified as subprocessors.
{% endif %}

## Service Coverage

{% for serviceGroup in vendors.byService -%}
### {{ serviceGroup.serviceName }}

{% if serviceGroup.vendors.length %}
| Vendor | Processing level | Purpose |
| --- | --- | --- |
{% for vendor in serviceGroup.vendors -%}
| {{ vendor.name }} | {{ vendor.dataProcessingLevel }} | {{ vendor.purpose }} |
{% endfor %}
{% else %}
No data processors are listed for this service.
{% endif %}

{% endfor %}
