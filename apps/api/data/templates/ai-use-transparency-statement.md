' slug: ai-use-transparency-statement
' name: AI Use and Transparency Statement
' description: A customer-facing statement describing where AI is used, how customer data is handled, which safeguards apply, and whether automated decisions are made.

# {{ organization.name }} AI Use and Transparency Statement

{% if policy.version %}_Version {{ policy.version }}_{% endif %}
{% if policy.lastUpdatedDate %}_Last updated: {{ policy.lastUpdatedDate }}_{% endif %}

This statement explains how {{ organization.legalEntityName or organization.name }} uses artificial intelligence in its services and business activities. It is intended to provide practical transparency about recorded AI uses and safeguards; it is not a guarantee that AI systems will always be error-free.

## AI use in our services

{% if services.usesAi %}
The following recorded activities use AI:

{% for service in services.all %}
{% for activity in service.activities %}
{% if activity.usesAi %}
### {{ service.name }} — {{ activity.name }}

{% if activity.purpose %}**Purpose:** {{ activity.purpose }}
{% endif %}
{% if activity.aiUseCasesHasValue %}**AI use cases:** {{ activity.aiUseCases }}
{% else %}Specific AI use cases have not yet been recorded.
{% endif %}

| Data and oversight question | Recorded answer |
| --- | --- |
| Customer data used to train AI models | {% if activity.aiCustomerDataUsedForTraining == true %}Yes{% elif activity.aiCustomerDataUsedForTraining == false %}No{% else %}Not recorded{% endif %} |
| Customer data sent to AI providers | {% if activity.aiCustomerDataSentToProviders == true %}Yes{% elif activity.aiCustomerDataSentToProviders == false %}No{% else %}Not recorded{% endif %} |
| AI outputs receive human review | {% if activity.aiHumanReviewOfOutputs == true %}Yes{% elif activity.aiHumanReviewOfOutputs == false %}No{% else %}Not recorded{% endif %} |
| Users are informed when AI is used | {% if activity.aiUsersInformedWhenUsed == true %}Yes{% elif activity.aiUsersInformedWhenUsed == false %}No{% else %}Not recorded{% endif %} |

{% endif %}
{% endfor %}
{% endfor %}
{% else %}
No AI-enabled processing activities are currently recorded for our services.
{% endif %}

## Automated decision-making

{% if privacy.usesAutomatedDecisionMaking == true %}
Our privacy profile records the use of automated decision-making. Questions or requests about this processing may be submitted using the privacy contact details below.
{% elif privacy.usesAutomatedDecisionMaking == false %}
Our privacy profile does not currently record automated decision-making.
{% else %}
Our use of automated decision-making has not yet been recorded.
{% endif %}

## Security and provider oversight

AI-enabled activities are covered by the same security and provider-management practices that apply to our other processing activities.

{% if security.vendorRisk.vendorReviewRequiredHasValue %}- Providers are subject to security review before or during use.
{% endif %}{% if security.vendorRisk.dpaRequiredForProcessorsHasValue %}- Data processing agreements are required for providers that process personal data.
{% endif %}{% if security.accessControl.leastPrivilegeHasValue %}- Access to systems and data follows least-privilege principles.
{% endif %}{% if security.encryption.atRestAlgorithmLabel %}- Data at rest is encrypted using {{ security.encryption.atRestAlgorithmLabel }}.
{% endif %}{% if security.encryption.inTransitMinimumTlsVersionLabel %}- Data in transit is protected using {{ security.encryption.inTransitMinimumTlsVersionLabel }} or higher.
{% endif %}

## Contact

For privacy questions about AI use{% if organization.privacyContactEmail %}, contact {{ organization.privacyContactEmail }}{% elif organization.contactEmail %}, contact {{ organization.contactEmail }}{% endif %}.

