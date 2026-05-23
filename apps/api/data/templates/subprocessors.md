' slug: subprocessors
' name: Subprocessors
' description: A customer-facing subprocessor summary based on the organization's vendor data processors.

# {{ organization.name }} Data Processors and Subprocessors

{% if vendors.dataProcessorsHasValue %}
{{ organization.name }} uses the following vendors to process organization or customer data. This list includes vendors with limited data processing and vendors classified as subprocessors.

| Vendor | Processing level | Purpose | Data processed | Data regions | DPA status |
| --- | --- | --- | --- | --- |
{% for vendor in vendors.dataProcessors -%}
| {{ vendor.name }} | {{ vendor.dataProcessingLevel }} | {{ vendor.purpose }} | {{ vendor.dataProcessed | join(", ") }} | {{ vendor.dataRegions | join(", ") }} | {{ vendor.dpaStatus }} |
{% endfor %}
{% else %}
{{ organization.name }} does not currently list any vendors that process organization or customer data.
{% endif %}

## Subprocessors

{% if vendors.subprocessorsHasValue %}
The following vendors are classified as subprocessors:

| Subprocessor | Purpose | Data processed | Data regions | DPA status |
| --- | --- | --- | --- | --- |
{% for vendor in vendors.subprocessors -%}
| {{ vendor.name }} | {{ vendor.purpose }} | {{ vendor.dataProcessed | join(", ") }} | {{ vendor.dataRegions | join(", ") }} | {{ vendor.dpaStatus }} |
{% endfor %}
{% else %}
{{ organization.name }} does not currently list any vendors classified as subprocessors.
{% endif %}
