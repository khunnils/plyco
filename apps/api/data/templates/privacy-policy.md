' slug: privacy-policy
' name: Privacy Policy
' description: A customer-facing privacy policy based on the organization's privacy, service, and vendor data.

# {{ organization.name }} Privacy Policy

{{ organization.name }} provides {{ service.name }} at {{ service.url }}. This policy describes how {{ organization.name }} handles personal data in connection with its products and services.

## Contact

For privacy questions, contact {{ organization.privacyContactEmail }}. General inquiries may be sent to {{ organization.contactEmail }}.

## Services Covered

{% for service in services.all -%}
- {{ service.name }}: {{ service.description }}
{% endfor %}

## Personal Data We Process

{% for service in services.all -%}
### {{ service.name }}

{% if service.dataTypes.length %}
{{ service.name }} may process the following data categories:

{% for dataType in service.dataTypes -%}
- {{ dataType.name }}{% if dataType.description %}: {{ dataType.description }}{% endif %}
{% endfor %}
{% else %}
No service-specific data categories are currently listed for {{ service.name }}.
{% endif %}

{% endfor %}

## Privacy Rights

{{ organization.name }} supports the following privacy rights: {{ privacy.supportedRightLabels | join(", ") }}.

Requests may be submitted through: {{ privacy.requestMethodLabels | join(", ") }}.

{% if privacy.responseTimelineDaysHasValue %}
{{ organization.name }} targets a response within {{ privacy.responseTimelineDays }} days.
{% endif %}

{% if privacy.identityVerificationRequired %}
{{ organization.name }} may verify the requester's identity before fulfilling a privacy request.
{% endif %}

{% if privacy.authorizedAgentSupported %}
Authorized agents may submit requests where permitted by applicable law.
{% endif %}

{% if privacy.appealProcessExists %}
If a request is denied, {{ organization.name }} provides an appeal process.
{% endif %}

## Cookies and Tracking

{% for service in services.all -%}
### {{ service.name }}

{% if service.privacy.usesCookiesOrTrackingTechnologies %}
{{ service.name }} uses cookies or similar technologies for: {{ service.privacy.cookieTrackingCategoryLabels | join(", ") }}.
{% if service.privacy.cookieConsentMechanismLabel %}
Cookie choices are managed through: {{ service.privacy.cookieConsentMechanismLabel }}.
{% endif %}
{% else %}
{{ service.name }} is not currently marked as using cookies or similar tracking technologies.
{% endif %}

{% if service.privacy.analyticsProviders.length %}
Analytics providers: {{ service.privacy.analyticsProviders | join(", ") }}.
{% endif %}
{% if service.privacy.advertisingProviders.length %}
Advertising providers: {{ service.privacy.advertisingProviders | join(", ") }}.
{% endif %}
{% if service.privacy.globalPrivacyControlSupported %}
{{ service.name }} supports Global Privacy Control signals.
{% endif %}

{% endfor %}

## Communications

{% if privacy.sendsMarketingEmails %}
{{ organization.name }} may send marketing emails. Opt-out method: {{ privacy.marketingOptOutMethodLabel }}.
{% endif %}

{% if privacy.transactionalEmailsSent %}
{{ organization.name }} sends transactional or service-related emails.
{% endif %}

{% if privacy.newsletterProvider %}
Newsletter provider: {{ privacy.newsletterProvider }}.
{% endif %}

## Sharing and Transfers

{% if vendors.subprocessorsHasValue %}
{{ organization.name }} uses subprocessors to provide its services. See the Subprocessors section for details.
{% endif %}

{% if privacy.crossBorderTransfers %}
{{ organization.name }} may transfer personal data across borders using: {{ privacy.transferMechanismLabels | join(", ") }}.
{% endif %}

{% if privacy.sellsOrSharesData %}
{{ organization.name }} may sell or share personal data for cross-context behavioral advertising. Opt-out link: {{ privacy.doNotSellLink }}.
{% else %}
{{ organization.name }} does not currently indicate that it sells or shares personal data for cross-context behavioral advertising.
{% endif %}

## Subprocessors

{% if vendors.subprocessorsHasValue %}
| Subprocessor | Service | Purpose | Data processed | Data regions |
| --- | --- | --- | --- | --- |
{% for vendor in vendors.subprocessors -%}
| {{ vendor.name }} | {{ vendor.serviceName }} | {{ vendor.purpose }} | {{ vendor.dataProcessed | join(", ") }} | {{ vendor.dataRegions | join(", ") }} |
{% endfor %}
{% else %}
{{ organization.name }} does not currently list any subprocessors.
{% endif %}

## International Privacy Contacts

{% if privacy.dpoStatus %}
Data Protection Officer status: {{ privacy.dpoStatusLabel }}.
{% endif %}
{% if privacy.dpoName %}
DPO: {{ privacy.dpoName }} ({{ privacy.dpoEmail }}).
{% endif %}
{% if privacy.euRepresentativeStatus %}
EU representative status: {{ privacy.euRepresentativeStatusLabel }}.
{% endif %}
{% if privacy.euRepresentativeName %}
EU representative: {{ privacy.euRepresentativeName }}, {{ privacy.euRepresentativeAddress }}.
{% endif %}

## Automated Decision-Making

{% if privacy.usesAutomatedDecisionMaking %}
{{ organization.name }} uses automated decision-making or profiling with legal or similarly significant effects.
{% else %}
{{ organization.name }} does not currently indicate that it uses automated decision-making or profiling with legal or similarly significant effects.
{% endif %}
