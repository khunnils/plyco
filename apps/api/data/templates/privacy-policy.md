' slug: privacy-policy
' name: Privacy Policy
' description: A customer-facing privacy policy based on the organization's privacy, service, data handling, and vendor data.

# {{ organization.name }} Privacy Policy

{% if organization.customerNotes.name %} {{ organization.customerNotes.name }}{% endif %}

{% if policy.version %}_Version {{ policy.version }}_{% endif %}
{% if policy.effectiveDate %}_Effective date: {{ policy.effectiveDate }}_{% endif %}
{% if policy.lastUpdatedDate %}_Last updated: {{ policy.lastUpdatedDate }}_{% endif %}

This Privacy Policy explains how {{ organization.legalEntityName or organization.name }}{% if organization.legalEntityName %}{% if organization.customerNotes.legalEntityName %} {{ organization.customerNotes.legalEntityName }}{% endif %}{% endif %}{% if not organization.legalEntityName %}{% if organization.customerNotes.name %} {{ organization.customerNotes.name }}{% endif %}{% endif %} ("{{ organization.name }}", "we", "us", or "our") collects, uses, shares, and protects personal data in connection with {{ service.name }}{% if service.customerNotes.name %} {{ service.customerNotes.name }}{% endif %}{% if service.url %} ({{ service.url }}{% if service.customerNotes.url %} {{ service.customerNotes.url }}{% endif %}){% endif %} and our related products and services.

## At a glance

Here is the short version. The full details are below.

- We collect personal data to provide, secure, support, and improve {{ service.name }}{% if service.customerNotes.name %} {{ service.customerNotes.name }}{% endif %}.
- We explain the types of data we collect, why we use it, who receives it, and how long we keep it.
- We use service providers only when they help us operate our services.
- You can contact us to exercise privacy rights, ask questions, or withdraw consent where consent applies.
- If you are in the EU or EEA, you can also complain to your local data protection authority.

## Who we are

{{ organization.name }}{% if organization.customerNotes.name %} {{ organization.customerNotes.name }}{% endif %} provides {{ service.name }}{% if service.customerNotes.name %} {{ service.customerNotes.name }}{% endif %}{% if service.description %} — {{ service.description }}{% if service.customerNotes.description %} {{ service.customerNotes.description }}{% endif %}{% endif %}.
{% if organization.legalEntityName %}The entity responsible for your personal data is {{ organization.legalEntityName }}{% if organization.customerNotes.legalEntityName %} {{ organization.customerNotes.legalEntityName }}{% endif %}.{% endif %}
{% if organization.address %}Our business address is {{ organization.address }}{% if organization.customerNotes.address %} {{ organization.customerNotes.address }}{% endif %}.{% endif %}

{% if services.all.length > 1 %}
This policy covers the following services:

{% for service in services.all -%}
- **{{ service.name }}{% if service.customerNotes.name %} {{ service.customerNotes.name }}{% endif %}**{% if service.description %}: {{ service.description }}{% if service.customerNotes.description %} {{ service.customerNotes.description }}{% endif %}{% endif %}
{% endfor %}
{% endif %}

## Personal data we collect

{% if dataHandling.dataTypesStoredHasValue %}
We collect and process the following categories of personal data:

{% for dataType in dataHandling.dataTypesStored %}
### {{ dataType.name }}

{% if dataType.customerNotes.name %} {{ dataType.customerNotes.name }}{% endif %}

{% if dataType.description %}{{ dataType.description }}{% if dataType.customerNotes.description %} {{ dataType.customerNotes.description }}{% endif %}
{% endif %}
{% if dataType.subjectTypeLabels.length %}- Relates to: {{ dataType.subjectTypeLabels | join(", ") }}{% if dataType.customerNotes.subjectTypes %} {{ dataType.customerNotes.subjectTypes }}{% endif %}
{% endif %}
{% if dataType.collectionMethodLabels.length %}- Collected through: {{ dataType.collectionMethodLabels | join(", ") }}{% if dataType.customerNotes.collectionMethods %} {{ dataType.customerNotes.collectionMethods }}{% endif %}
{% endif %}
- {% if dataType.isRequired %}Required to provide the service{% if dataType.customerNotes.isRequired %} {{ dataType.customerNotes.isRequired }}{% endif %}{% else %}Provided optionally{% if dataType.customerNotes.isRequired %} {{ dataType.customerNotes.isRequired }}{% endif %}{% endif %}{% if dataType.isSensitive %}; handled as sensitive personal data{% if dataType.customerNotes.isSensitive %} {{ dataType.customerNotes.isSensitive }}{% endif %}{% endif %}

{% endfor %}
{% else %}
We collect the personal data needed to provide, secure, and improve {{ service.name }}{% if service.customerNotes.name %} {{ service.customerNotes.name }}{% endif %}, such as account, contact, and usage information.
{% endif %}

{% if services.hasActivities %}
## How and why we use your data

{% for service in services.all %}
{% if service.activities.length %}
{% if service.customerNotes.businessActivityIds %}{{ service.customerNotes.businessActivityIds }}{% endif %}
{% if services.all.length > 1 %}### {{ service.name }}

{% if service.customerNotes.name %} {{ service.customerNotes.name }}{% endif %}
{% endif %}
We process personal data for the following purposes:

| Purpose | Data used | Our role | Legal basis | Retention |
| --- | --- | --- | --- | --- |
{% for activity in service.activities -%}
| {{ activity.purpose or activity.name }}{% if activity.purpose %}{% if activity.customerNotes.purpose %}<br />{{ activity.customerNotes.purpose }}{% endif %}{% endif %}{% if not activity.purpose %}{% if activity.customerNotes.name %}<br />{{ activity.customerNotes.name }}{% endif %}{% endif %} | {{ activity.dataTypeNames | join(", ") or "—" }}{% if activity.customerNotes.dataTypeIds %}<br />{{ activity.customerNotes.dataTypeIds }}{% endif %} | {{ activity.roleLabel or "—" }}{% if activity.customerNotes.role %}<br />{{ activity.customerNotes.role }}{% endif %} | {{ activity.legalBasisLabels | join(", ") or "—" }}{% if activity.customerNotes.legalBasis %}<br />{{ activity.customerNotes.legalBasis }}{% endif %} | {{ activity.retentionLabel or "—" }}{% if activity.customerNotes.retentionPolicy %}<br />{{ activity.customerNotes.retentionPolicy }}{% endif %} |
{% endfor %}

{% endif %}
{% endfor %}
{% endif %}

{% if services.usesAi %}
## Use of artificial intelligence

We use artificial intelligence (AI) in parts of {{ service.name }}{% if service.customerNotes.name %} {{ service.customerNotes.name }}{% endif %}. Below we explain where we use AI and the safeguards we apply.

{% for service in services.all %}
{% for activity in service.activities %}
{% if activity.usesAi %}
**{{ activity.purpose or activity.name }}{% if activity.purpose %}{% if activity.customerNotes.purpose %} {{ activity.customerNotes.purpose }}{% endif %}{% endif %}{% if not activity.purpose %}{% if activity.customerNotes.name %} {{ activity.customerNotes.name }}{% endif %}{% endif %}{% if services.all.length > 1 %} ({{ service.name }}{% if service.customerNotes.name %} {{ service.customerNotes.name }}{% endif %}){% endif %}.** {% if activity.aiUseCasesHasValue %}{{ activity.aiUseCases }}{% if activity.customerNotes.aiUseCases %} {{ activity.customerNotes.aiUseCases }}{% endif %}{% else %}We use AI to support this activity.{% endif %}
{% if activity.aiCustomerDataUsedForTraining == true %}
- We use personal data from this activity to train or fine-tune AI models.{% if activity.customerNotes.aiCustomerDataUsedForTraining %} {{ activity.customerNotes.aiCustomerDataUsedForTraining }}{% endif %}
{% if activity.customerNotes.aiCustomerDataUsedForTraining %} {{ activity.customerNotes.aiCustomerDataUsedForTraining }}{% endif %}{% elif activity.aiCustomerDataUsedForTraining == false %}
- We do not use your personal data to train or fine-tune AI models.{% if activity.customerNotes.aiCustomerDataUsedForTraining %} {{ activity.customerNotes.aiCustomerDataUsedForTraining }}{% endif %}
{% if activity.customerNotes.aiCustomerDataUsedForTraining %} {{ activity.customerNotes.aiCustomerDataUsedForTraining }}{% endif %}{% endif %}
{% if activity.aiCustomerDataSentToProviders == true %}
- We share data from this activity with external AI providers. They use it only to provide services to us under written terms.{% if activity.customerNotes.aiCustomerDataSentToProviders %} {{ activity.customerNotes.aiCustomerDataSentToProviders }}{% endif %}
{% if activity.customerNotes.aiCustomerDataSentToProviders %} {{ activity.customerNotes.aiCustomerDataSentToProviders }}{% endif %}{% elif activity.aiCustomerDataSentToProviders == false %}
- We do not send data from this activity to external AI providers.{% if activity.customerNotes.aiCustomerDataSentToProviders %} {{ activity.customerNotes.aiCustomerDataSentToProviders }}{% endif %}
{% if activity.customerNotes.aiCustomerDataSentToProviders %} {{ activity.customerNotes.aiCustomerDataSentToProviders }}{% endif %}{% endif %}
{% if activity.aiHumanReviewOfOutputs == true %}
- A person reviews AI outputs before they affect you or significant decisions.{% if activity.customerNotes.aiHumanReviewOfOutputs %} {{ activity.customerNotes.aiHumanReviewOfOutputs }}{% endif %}
{% if activity.customerNotes.aiHumanReviewOfOutputs %} {{ activity.customerNotes.aiHumanReviewOfOutputs }}{% endif %}{% elif activity.aiHumanReviewOfOutputs == false %}
- AI outputs are not routinely reviewed by a person before they are used.{% if activity.customerNotes.aiHumanReviewOfOutputs %} {{ activity.customerNotes.aiHumanReviewOfOutputs }}{% endif %}
{% if activity.customerNotes.aiHumanReviewOfOutputs %} {{ activity.customerNotes.aiHumanReviewOfOutputs }}{% endif %}{% endif %}
{% if activity.aiUsersInformedWhenUsed == true %}
- We let you know when AI is used in this activity.{% if activity.customerNotes.aiUsersInformedWhenUsed %} {{ activity.customerNotes.aiUsersInformedWhenUsed }}{% endif %}
{% if activity.customerNotes.aiUsersInformedWhenUsed %} {{ activity.customerNotes.aiUsersInformedWhenUsed }}{% endif %}{% endif %}

{% if activity.customerNotes.usesAi %} {{ activity.customerNotes.usesAi }}{% endif %}{% endif %}
{% endfor %}
{% endfor %}
{% endif %}

{% if service.childrenDirected %}
## Children's privacy

{{ service.name }}{% if service.customerNotes.name %} {{ service.customerNotes.name }}{% endif %} is directed to children, and we collect and handle children's personal data in accordance with applicable children's privacy laws.{% if service.customerNotes.childrenDirected %} {{ service.customerNotes.childrenDirected }}{% endif %}
{% if service.customerNotes.childrenDirected %} {{ service.customerNotes.childrenDirected }}{% endif %}{% elif service.minimumUserAgeHasValue %}
## Children's privacy

{{ service.name }}{% if service.customerNotes.name %} {{ service.customerNotes.name }}{% endif %} is intended for users aged {{ service.minimumUserAge }}{% if service.customerNotes.minimumUserAge %} {{ service.customerNotes.minimumUserAge }}{% endif %} and older and is not directed to children. We do not knowingly collect personal data from anyone under that age.
{% endif %}

## Your privacy rights

{% if privacy.supportedRightLabels.length %}
If you are in the EU or EEA, GDPR gives you rights over your personal data. These rights can include access, rectification, erasure, restriction, portability, and objection. Based on our current profile, the rights we support include: {{ privacy.supportedRightLabels | join(", ") }}{% if privacy.customerNotes.supportedRights %} {{ privacy.customerNotes.supportedRights }}{% endif %}.
{% else %}
If you are in the EU or EEA, GDPR gives you rights over your personal data. These rights can include access, rectification, erasure, restriction, portability, and objection.{% if privacy.customerNotes.supportedRights %} {{ privacy.customerNotes.supportedRights }}{% endif %}
{% endif %}
Where we rely on consent to process your personal data, you may withdraw that consent at any time. Withdrawing consent does not affect processing that already happened before withdrawal.
{% if privacy.requestMethodLabels.length %}
To exercise your rights, you can reach us via: {{ privacy.requestMethodLabels | join(", ") }}{% if privacy.customerNotes.requestMethods %} {{ privacy.customerNotes.requestMethods }}{% endif %}{% if organization.privacyContactEmail %}, or by email at {{ organization.privacyContactEmail }}{% if organization.customerNotes.privacyContactEmail %} {{ organization.customerNotes.privacyContactEmail }}{% endif %}{% endif %}.
{% elif organization.privacyContactEmail %}
To exercise your rights, email us at {{ organization.privacyContactEmail }}{% if organization.customerNotes.privacyContactEmail %} {{ organization.customerNotes.privacyContactEmail }}{% endif %}.
{% endif %}
{% if privacy.responseTimelineDaysHasValue %}
We aim to respond to verified requests within {{ privacy.responseTimelineDays }}{% if privacy.customerNotes.responseTimelineDays %} {{ privacy.customerNotes.responseTimelineDays }}{% endif %} days.
{% endif %}
{% if privacy.identityVerificationRequired %}
We may need to verify your identity before acting on a request.{% if privacy.customerNotes.identityVerificationRequired %} {{ privacy.customerNotes.identityVerificationRequired }}{% endif %}
{% if privacy.customerNotes.identityVerificationRequired %} {{ privacy.customerNotes.identityVerificationRequired }}{% endif %}{% endif %}
{% if privacy.authorizedAgentSupported %}
You may use an authorized agent to submit a request on your behalf where permitted by applicable law.{% if privacy.customerNotes.authorizedAgentSupported %} {{ privacy.customerNotes.authorizedAgentSupported }}{% endif %}
{% if privacy.customerNotes.authorizedAgentSupported %} {{ privacy.customerNotes.authorizedAgentSupported }}{% endif %}{% endif %}
{% if privacy.appealProcessExists %}
If we decline your request, you may appeal that decision.{% if privacy.customerNotes.appealProcessExists %} {{ privacy.customerNotes.appealProcessExists }}{% endif %}
{% if privacy.customerNotes.appealProcessExists %} {{ privacy.customerNotes.appealProcessExists }}{% endif %}{% endif %}
You also have the right to lodge a complaint with your local EU/EEA data protection supervisory authority.

{% if services.cookiesAnswered %}
## Cookies and similar technologies

{% for service in services.all %}
{% if service.privacy.usesCookiesOrTrackingTechnologies %}
{% if services.all.length > 1 %}**{{ service.name }}{% if service.customerNotes.name %} {{ service.customerNotes.name }}{% endif %}.** {% endif %}We use cookies and similar technologies.{% if service.privacy.customerNotes.usesCookiesOrTrackingTechnologies %} {{ service.privacy.customerNotes.usesCookiesOrTrackingTechnologies }}{% endif %}
{% for category in service.privacy.cookieCategories %}
- **{{ category.label }}{% if category.customerNotes.enabled %}<br />{{ category.customerNotes.enabled }}{% endif %}**
{% endfor %}
{% if service.privacy.cookieConsentMechanismLabel %}You can manage your preferences through {{ service.privacy.cookieConsentMechanismLabel }}{% if service.privacy.customerNotes.cookieConsentMechanism %} {{ service.privacy.customerNotes.cookieConsentMechanism }}{% endif %}.{% endif %}{% if service.privacy.globalPrivacyControlSupported %} We honor Global Privacy Control signals.{% if service.privacy.customerNotes.globalPrivacyControlSupported %} {{ service.privacy.customerNotes.globalPrivacyControlSupported }}{% endif %}{% endif %}
{% if service.privacy.nonEssentialCookiesBlockedUntilConsent %}We do not set non-essential cookies or similar tracking technologies until you have given consent.{% if service.privacy.customerNotes.nonEssentialCookiesBlockedUntilConsent %} {{ service.privacy.customerNotes.nonEssentialCookiesBlockedUntilConsent }}{% endif %}{% endif %}
{% if service.privacy.cookieConsentWithdrawalMethodLabel %}You can withdraw cookie consent through {{ service.privacy.cookieConsentWithdrawalMethodLabel }}{% if service.privacy.customerNotes.cookieConsentWithdrawalMethod %} {{ service.privacy.customerNotes.cookieConsentWithdrawalMethod }}{% endif %}.{% endif %}
{% if service.privacy.cookieConsentMechanismLabel %}Specific cookie purposes, providers, and durations are available through {{ service.privacy.cookieConsentMechanismLabel }}{% if service.privacy.customerNotes.cookieConsentMechanism %} {{ service.privacy.customerNotes.cookieConsentMechanism }}{% endif %}.{% endif %}
{% if service.privacy.analyticsProviders.length %}Analytics providers we use include: {{ service.privacy.analyticsProviders | join(", ") }}.{% endif %}
{% if service.privacy.advertisingProviders.length %}Advertising providers we use include: {{ service.privacy.advertisingProviders | join(", ") }}.{% endif %}
{% if service.privacy.customerNotes.usesCookiesOrTrackingTechnologies %} {{ service.privacy.customerNotes.usesCookiesOrTrackingTechnologies }}{% endif %}{% elif service.privacy.usesCookiesOrTrackingTechnologiesAnswered and services.all.length == 1 %}
{{ service.name }}{% if service.customerNotes.name %} {{ service.customerNotes.name }}{% endif %} does not use non-essential cookies or similar tracking technologies.{% if service.privacy.customerNotes.usesCookiesOrTrackingTechnologies %} {{ service.privacy.customerNotes.usesCookiesOrTrackingTechnologies }}{% endif %}
{% if service.privacy.customerNotes.usesCookiesOrTrackingTechnologies %} {{ service.privacy.customerNotes.usesCookiesOrTrackingTechnologies }}{% endif %}{% endif %}
{% endfor %}
{% endif %}

{% if privacy.sendsMarketingEmails or privacy.transactionalEmailsSent or privacy.newsletterProvider %}
## Marketing and communications

{% if privacy.sendsMarketingEmails %}
We may send you marketing emails.{% if privacy.marketingOptOutMethodLabel %} You can opt out at any time via {{ privacy.marketingOptOutMethodLabel }}{% if privacy.customerNotes.marketingOptOutMethod %} {{ privacy.customerNotes.marketingOptOutMethod }}{% endif %}.{% endif %}
{% if privacy.customerNotes.sendsMarketingEmails %} {{ privacy.customerNotes.sendsMarketingEmails }}{% endif %}{% endif %}
{% if privacy.transactionalEmailsSent %}
We send transactional and service-related messages necessary to operate {{ service.name }}{% if service.customerNotes.name %} {{ service.customerNotes.name }}{% endif %}.{% if privacy.customerNotes.transactionalEmailsSent %} {{ privacy.customerNotes.transactionalEmailsSent }}{% endif %}
{% if privacy.customerNotes.transactionalEmailsSent %} {{ privacy.customerNotes.transactionalEmailsSent }}{% endif %}{% endif %}
{% if privacy.newsletterProvider %}
We use {{ privacy.newsletterProvider }}{% if privacy.customerNotes.providerSystems.newsletter %} {{ privacy.customerNotes.providerSystems.newsletter }}{% endif %} to manage email communications.
{% endif %}
{% endif %}

## Plain-language terms

Some privacy laws use technical terms. In this policy:

- **Personal data** means information that identifies a person or can reasonably be linked to a person.
- **Controller** means the organization that decides why and how personal data is used.
- **Processor** or **subprocessor** means a service provider that handles personal data for us.
- **Legal basis** means the reason privacy law allows us to use personal data, such as a contract, consent, legal duty, or legitimate interest.
- **Legitimate interest** means a business reason to use data that does not override your rights.
- **Contractual safeguards** means written privacy and security promises from a service provider.
- **Cross-context behavioral advertising** means using data from different services to target ads.

## How we share personal data

{% if vendors.subprocessorsHasValue %}
We share personal data with the subprocessors listed below. They handle data for us under written privacy and security terms.
{% endif %}
{% if privacy.crossBorderTransfers %}
We may transfer personal data to another country. When we do, we use safeguards such as: {{ privacy.transferMechanismLabels | join(", ") }}{% if privacy.customerNotes.transferMechanisms %} {{ privacy.customerNotes.transferMechanisms }}{% endif %}.{% if privacy.customerNotes.crossBorderTransfers %} {{ privacy.customerNotes.crossBorderTransfers }}{% endif %}
{% if privacy.customerNotes.crossBorderTransfers %} {{ privacy.customerNotes.crossBorderTransfers }}{% endif %}{% endif %}
{% if privacy.sellsOrSharesData %}
We may "sell" or "share" personal data for targeted advertising as those terms are defined under applicable law.{% if privacy.doNotSellLink %} You can opt out here: {{ privacy.doNotSellLink }}{% if privacy.customerNotes.doNotSellLink %} {{ privacy.customerNotes.doNotSellLink }}{% endif %}.{% endif %}
{% if privacy.customerNotes.sellsOrSharesData %} {{ privacy.customerNotes.sellsOrSharesData }}{% endif %}{% else %}
We do not sell your personal data, and we do not share it for targeted advertising across different services.{% if privacy.customerNotes.sellsOrSharesData %} {{ privacy.customerNotes.sellsOrSharesData }}{% endif %}
{% if privacy.customerNotes.sellsOrSharesData %} {{ privacy.customerNotes.sellsOrSharesData }}{% endif %}{% endif %}

{% if vendors.subprocessorsHasValue %}
### Subprocessors

| Subprocessor | Service | Purpose | Data processed | Data regions |
| --- | --- | --- | --- | --- |
{% for vendor in vendors.subprocessors -%}
| {{ vendor.name }}{% if vendor.customerNotes.name %}<br />{{ vendor.customerNotes.name }}{% endif %} | {{ vendor.serviceName or "—" }} | {{ vendor.purpose or "—" }}{% if vendor.customerNotes.purpose %}<br />{{ vendor.customerNotes.purpose }}{% endif %} | {{ vendor.dataProcessed | join(", ") or "—" }}{% if vendor.customerNotes.dataProcessed %}<br />{{ vendor.customerNotes.dataProcessed }}{% endif %} | {{ vendor.dataRegionLabels | join(", ") or "—" }}{% if vendor.customerNotes.dataRegions %}<br />{{ vendor.customerNotes.dataRegions }}{% endif %} |
{% endfor %}
{% endif %}

{% if privacy.usesAutomatedDecisionMaking %}
## Automated decision-making

We use automated decision-making or profiling that may produce legal or similarly significant effects. You may have the right to request human review of such decisions.{% if privacy.customerNotes.usesAutomatedDecisionMaking %} {{ privacy.customerNotes.usesAutomatedDecisionMaking }}{% endif %}
{% if privacy.customerNotes.usesAutomatedDecisionMaking %} {{ privacy.customerNotes.usesAutomatedDecisionMaking }}{% endif %}{% endif %}

{% if privacy.dpoName or privacy.euRepresentativeName or privacy.dpoStatusLabel or privacy.euRepresentativeStatusLabel %}
## Data protection contacts

{% if privacy.dpoName %}Our Data Protection Officer is {{ privacy.dpoName }}{% if privacy.customerNotes.dpoName %} {{ privacy.customerNotes.dpoName }}{% endif %}{% if privacy.dpoEmail %} ({{ privacy.dpoEmail }}{% if privacy.customerNotes.dpoEmail %} {{ privacy.customerNotes.dpoEmail }}{% endif %}){% endif %}.
{% elif privacy.dpoStatusLabel %}Data Protection Officer status: {{ privacy.dpoStatusLabel }}{% if privacy.customerNotes.dpoStatus %} {{ privacy.customerNotes.dpoStatus }}{% endif %}.
{% endif %}
{% if privacy.euRepresentativeName %}Our EU representative is {{ privacy.euRepresentativeName }}{% if privacy.customerNotes.euRepresentativeName %} {{ privacy.customerNotes.euRepresentativeName }}{% endif %}{% if privacy.euRepresentativeAddress %}, {{ privacy.euRepresentativeAddress }}{% if privacy.customerNotes.euRepresentativeAddress %} {{ privacy.customerNotes.euRepresentativeAddress }}{% endif %}{% endif %}.
{% elif privacy.euRepresentativeStatusLabel %}EU representative status: {{ privacy.euRepresentativeStatusLabel }}{% if privacy.customerNotes.euRepresentativeStatus %} {{ privacy.customerNotes.euRepresentativeStatus }}{% endif %}.
{% endif %}
{% endif %}

## Changes to this policy

We may update this Privacy Policy from time to time. When we make material changes, we will update the version and revision details above and, where appropriate, provide additional notice.

## How to contact us

{% if organization.privacyContactEmail %}For privacy questions or requests, contact us at {{ organization.privacyContactEmail }}{% if organization.customerNotes.privacyContactEmail %} {{ organization.customerNotes.privacyContactEmail }}{% endif %}.{% endif %}
{% if organization.contactEmail %}For general inquiries, contact {{ organization.contactEmail }}{% if organization.customerNotes.contactEmail %} {{ organization.customerNotes.contactEmail }}{% endif %}.{% endif %}
{% if organization.address %}You can also write to us at {{ organization.address }}{% if organization.customerNotes.address %} {{ organization.customerNotes.address }}{% endif %}.{% endif %}

{% if organization.countryLabel %}
## Governing law

This policy is governed by the laws that apply to {{ organization.legalEntityName or organization.name }}{% if organization.legalEntityName %}{% if organization.customerNotes.legalEntityName %} {{ organization.customerNotes.legalEntityName }}{% endif %}{% endif %}{% if not organization.legalEntityName %}{% if organization.customerNotes.name %} {{ organization.customerNotes.name }}{% endif %}{% endif %} in {{ organization.countryLabel }}{% if organization.customerNotes.country %} {{ organization.customerNotes.country }}{% endif %}.
{% endif %}
