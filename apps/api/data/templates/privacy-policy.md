' slug: privacy-policy
' name: Privacy Policy
' description: A customer-facing privacy policy based on the organization's privacy, service, data handling, and vendor data.

# {{ organization.name }} Privacy Policy

{% if policy.version %}_Version {{ policy.version }}_{% endif %}
{% if policy.effectiveDate %}_Effective date: {{ policy.effectiveDate }}_{% endif %}
{% if policy.lastUpdatedDate %}_Last updated: {{ policy.lastUpdatedDate }}_{% endif %}

This Privacy Policy explains how {{ organization.legalEntityName or organization.name }} ("{{ organization.name }}", "we", "us", or "our") collects, uses, shares, and protects personal data in connection with {{ service.name }}{% if service.url %} ({{ service.url }}){% endif %} and our related products and services.

## Who we are

{{ organization.name }} provides {{ service.name }}{% if service.description %} — {{ service.description }}{% endif %}.
{% if organization.legalEntityName %}The entity responsible for your personal data is {{ organization.legalEntityName }}.{% endif %}
{% if organization.address %}Our business address is {{ organization.address }}.{% endif %}

{% if services.all.length > 1 %}
This policy covers the following services:

{% for service in services.all -%}
- **{{ service.name }}**{% if service.description %}: {{ service.description }}{% endif %}
{% endfor %}
{% endif %}

## Personal data we collect

{% if dataHandling.dataTypesStoredHasValue %}
We collect and process the following categories of personal data:

{% for dataType in dataHandling.dataTypesStored %}
### {{ dataType.name }}

{% if dataType.description %}{{ dataType.description }}
{% endif %}
{% if dataType.subjectTypeLabels.length %}- Relates to: {{ dataType.subjectTypeLabels | join(", ") }}
{% endif %}
{% if dataType.collectionMethodLabels.length %}- Collected through: {{ dataType.collectionMethodLabels | join(", ") }}
{% endif %}
- {% if dataType.isRequired %}Required to provide the service{% else %}Provided optionally{% endif %}{% if dataType.isSensitive %}; handled as sensitive personal data{% endif %}

{% endfor %}
{% else %}
We collect the personal data needed to provide, secure, and improve {{ service.name }}, such as account, contact, and usage information.
{% endif %}

{% if services.hasActivities %}
## How and why we use your data

{% for service in services.all %}
{% if service.activities.length %}
{% if services.all.length > 1 %}### {{ service.name }}
{% endif %}
We process personal data for the following purposes:

| Purpose | Our role | Legal basis | Retention |
| --- | --- | --- | --- |
{% for activity in service.activities -%}
| {{ activity.purpose or activity.name }} | {{ activity.roleLabel or "—" }} | {{ activity.legalBasisLabels | join(", ") or "—" }} | {{ activity.retentionLabel or "—" }} |
{% endfor %}

{% endif %}
{% endfor %}
{% endif %}

{% if services.usesAi %}
## Use of artificial intelligence

We use artificial intelligence (AI) in parts of {{ service.name }}. Below we explain where we use AI and the safeguards we apply.

{% for service in services.all %}
{% for activity in service.activities %}
{% if activity.usesAi %}
**{{ activity.purpose or activity.name }}{% if services.all.length > 1 %} ({{ service.name }}){% endif %}.** {% if activity.aiUseCasesHasValue %}{{ activity.aiUseCases }}{% else %}We use AI to support this activity.{% endif %}
{% if activity.aiCustomerDataUsedForTraining == true %}
- We use personal data from this activity to train or fine-tune AI models.
{% elif activity.aiCustomerDataUsedForTraining == false %}
- We do not use your personal data to train or fine-tune AI models.
{% endif %}
{% if activity.aiCustomerDataSentToProviders == true %}
- We share data from this activity with external AI providers who process it on our behalf under appropriate contractual safeguards.
{% elif activity.aiCustomerDataSentToProviders == false %}
- We do not send data from this activity to external AI providers.
{% endif %}
{% if activity.aiHumanReviewOfOutputs == true %}
- A person reviews AI outputs before they affect you or significant decisions.
{% elif activity.aiHumanReviewOfOutputs == false %}
- AI outputs are not routinely reviewed by a person before they are used.
{% endif %}
{% if activity.aiUsersInformedWhenUsed == true %}
- We let you know when AI is used in this activity.
{% endif %}

{% endif %}
{% endfor %}
{% endfor %}
{% endif %}

{% if service.childrenDirected %}
## Children's privacy

{{ service.name }} is directed to children, and we collect and handle children's personal data in accordance with applicable children's privacy laws.
{% elif service.minimumUserAgeHasValue %}
## Children's privacy

{{ service.name }} is intended for users aged {{ service.minimumUserAge }} and older and is not directed to children. We do not knowingly collect personal data from anyone under that age.
{% endif %}

{% if privacy.supportedRightLabels.length or privacy.requestMethodLabels.length or organization.privacyContactEmail or privacy.responseTimelineDaysHasValue or privacy.identityVerificationRequired or privacy.authorizedAgentSupported or privacy.appealProcessExists %}
## Your privacy rights

{% if privacy.supportedRightLabels.length %}
Depending on where you live, you may have the right to: {{ privacy.supportedRightLabels | join(", ") }}.
{% endif %}
{% if privacy.requestMethodLabels.length %}
To exercise your rights, you can reach us via: {{ privacy.requestMethodLabels | join(", ") }}{% if organization.privacyContactEmail %}, or by email at {{ organization.privacyContactEmail }}{% endif %}.
{% elif organization.privacyContactEmail %}
To exercise your rights, email us at {{ organization.privacyContactEmail }}.
{% endif %}
{% if privacy.responseTimelineDaysHasValue %}
We aim to respond to verified requests within {{ privacy.responseTimelineDays }} days.
{% endif %}
{% if privacy.identityVerificationRequired %}
We may need to verify your identity before acting on a request.
{% endif %}
{% if privacy.authorizedAgentSupported %}
You may use an authorized agent to submit a request on your behalf where permitted by applicable law.
{% endif %}
{% if privacy.appealProcessExists %}
If we decline your request, you may appeal that decision.
{% endif %}
{% endif %}

{% if services.cookiesAnswered %}
## Cookies and similar technologies

{% for service in services.all %}
{% if service.privacy.usesCookiesOrTrackingTechnologies %}
{% if services.all.length > 1 %}**{{ service.name }}.** {% endif %}We use cookies and similar technologies{% if service.privacy.cookieTrackingCategoryLabels.length %} for the following purposes: {{ service.privacy.cookieTrackingCategoryLabels | join(", ") }}{% endif %}.{% if service.privacy.cookieConsentMechanismLabel %} You can manage your preferences through {{ service.privacy.cookieConsentMechanismLabel }}.{% endif %}{% if service.privacy.globalPrivacyControlSupported %} We honor Global Privacy Control signals.{% endif %}
{% if service.privacy.analyticsProviders.length %}Analytics providers we use include: {{ service.privacy.analyticsProviders | join(", ") }}.{% endif %}
{% if service.privacy.advertisingProviders.length %}Advertising providers we use include: {{ service.privacy.advertisingProviders | join(", ") }}.{% endif %}
{% elif service.privacy.usesCookiesOrTrackingTechnologiesAnswered and services.all.length == 1 %}
{{ service.name }} does not use non-essential cookies or similar tracking technologies.
{% endif %}
{% endfor %}
{% endif %}

{% if privacy.sendsMarketingEmails or privacy.transactionalEmailsSent or privacy.newsletterProvider %}
## Marketing and communications

{% if privacy.sendsMarketingEmails %}
We may send you marketing emails.{% if privacy.marketingOptOutMethodLabel %} You can opt out at any time via {{ privacy.marketingOptOutMethodLabel }}.{% endif %}
{% endif %}
{% if privacy.transactionalEmailsSent %}
We send transactional and service-related messages necessary to operate {{ service.name }}.
{% endif %}
{% if privacy.newsletterProvider %}
We use {{ privacy.newsletterProvider }} to manage email communications.
{% endif %}
{% endif %}

## How we share personal data

{% if vendors.subprocessorsHasValue %}
We share personal data with the subprocessors listed below, who process it on our behalf under appropriate contractual safeguards.
{% endif %}
{% if privacy.crossBorderTransfers %}
We may transfer personal data internationally. Where we do, we rely on appropriate safeguards such as: {{ privacy.transferMechanismLabels | join(", ") }}.
{% endif %}
{% if privacy.sellsOrSharesData %}
We may "sell" or "share" personal data for cross-context behavioral advertising as those terms are defined under applicable law.{% if privacy.doNotSellLink %} You can opt out here: {{ privacy.doNotSellLink }}.{% endif %}
{% else %}
We do not sell your personal data, and we do not share it for cross-context behavioral advertising.
{% endif %}

{% if vendors.subprocessorsHasValue %}
### Subprocessors

| Subprocessor | Service | Purpose | Data processed | Data regions |
| --- | --- | --- | --- | --- |
{% for vendor in vendors.subprocessors -%}
| {{ vendor.name }} | {{ vendor.serviceName or "—" }} | {{ vendor.purpose or "—" }} | {{ vendor.dataProcessed | join(", ") or "—" }} | {{ vendor.dataRegions | join(", ") or "—" }} |
{% endfor %}
{% endif %}

{% if privacy.usesAutomatedDecisionMaking %}
## Automated decision-making

We use automated decision-making or profiling that may produce legal or similarly significant effects. You may have the right to request human review of such decisions.
{% endif %}

{% if privacy.dpoName or privacy.euRepresentativeName or privacy.dpoStatusLabel or privacy.euRepresentativeStatusLabel %}
## Data protection contacts

{% if privacy.dpoName %}Our Data Protection Officer is {{ privacy.dpoName }}{% if privacy.dpoEmail %} ({{ privacy.dpoEmail }}){% endif %}.
{% elif privacy.dpoStatusLabel %}Data Protection Officer status: {{ privacy.dpoStatusLabel }}.
{% endif %}
{% if privacy.euRepresentativeName %}Our EU representative is {{ privacy.euRepresentativeName }}{% if privacy.euRepresentativeAddress %}, {{ privacy.euRepresentativeAddress }}{% endif %}.
{% elif privacy.euRepresentativeStatusLabel %}EU representative status: {{ privacy.euRepresentativeStatusLabel }}.
{% endif %}
{% endif %}

## Changes to this policy

We may update this Privacy Policy from time to time. When we make material changes, we will update the version and revision details above and, where appropriate, provide additional notice.

## How to contact us

{% if organization.privacyContactEmail %}For privacy questions or requests, contact us at {{ organization.privacyContactEmail }}.{% endif %}
{% if organization.contactEmail %}For general inquiries, contact {{ organization.contactEmail }}.{% endif %}
{% if organization.address %}You can also write to us at {{ organization.address }}.{% endif %}

{% if organization.country %}
## Governing law

This policy is governed by the laws applicable to {{ organization.legalEntityName or organization.name }} in its jurisdiction of establishment ({{ organization.country }}), without regard to conflict-of-laws principles.
{% endif %}
