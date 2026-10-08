' slug: ai-use-transparency-statement
' name: AI Use and Transparency Statement
' description: A customer-facing statement describing where AI is used, how customer data is handled, which safeguards apply, and whether automated decisions are made.

# {{ organization.name }} AI Use and Transparency Statement

{% if organization.customerNotes.name %} {{ organization.customerNotes.name }}{% endif %}

{% if policy.version %}_Version {{ policy.version }}_{% endif %}
{% if policy.lastUpdatedDate %}_Last updated: {{ policy.lastUpdatedDate }}_{% endif %}

This statement explains how {{ organization.legalEntityName or organization.name }}{% if organization.legalEntityName %}{% if organization.customerNotes.legalEntityName %} {{ organization.customerNotes.legalEntityName }}{% endif %}{% endif %}{% if not organization.legalEntityName %}{% if organization.customerNotes.name %} {{ organization.customerNotes.name }}{% endif %}{% endif %} uses artificial intelligence in its services and business activities. It is intended to provide practical transparency about recorded AI uses and safeguards; it is not a guarantee that AI systems will always be error-free.

## AI use in our services

{% if services.usesAi %}
The following recorded activities use AI:

{% for service in services.all %}
{% for activity in service.activities %}
{% if activity.usesAi %}
### {{ service.name }} — {{ activity.name }}

{% if service.customerNotes.name %} {{ service.customerNotes.name }}{% endif %}{% if activity.customerNotes.name %} {{ activity.customerNotes.name }}{% endif %}

{% if activity.purpose %}**Purpose:** {{ activity.purpose }}{% if activity.customerNotes.purpose %} {{ activity.customerNotes.purpose }}{% endif %}
{% endif %}
{% if activity.aiUseCasesHasValue %}**AI use cases:** {{ activity.aiUseCases }}{% if activity.customerNotes.aiUseCases %} {{ activity.customerNotes.aiUseCases }}{% endif %}
{% else %}Specific AI use cases have not yet been recorded.{% if activity.customerNotes.aiUseCases %} {{ activity.customerNotes.aiUseCases }}{% endif %}
{% endif %}

| Data and oversight question | Recorded answer |
| --- | --- |
| Customer data used to train AI models | {% if activity.aiCustomerDataUsedForTraining == true %}Yes{% if activity.customerNotes.aiCustomerDataUsedForTraining %}<br />{{ activity.customerNotes.aiCustomerDataUsedForTraining }}{% endif %}{% elif activity.aiCustomerDataUsedForTraining == false %}No{% if activity.customerNotes.aiCustomerDataUsedForTraining %}<br />{{ activity.customerNotes.aiCustomerDataUsedForTraining }}{% endif %}{% else %}Not recorded{% if activity.customerNotes.aiCustomerDataUsedForTraining %}<br />{{ activity.customerNotes.aiCustomerDataUsedForTraining }}{% endif %}{% endif %} |
| Customer data sent to AI providers | {% if activity.aiCustomerDataSentToProviders == true %}Yes{% if activity.customerNotes.aiCustomerDataSentToProviders %}<br />{{ activity.customerNotes.aiCustomerDataSentToProviders }}{% endif %}{% elif activity.aiCustomerDataSentToProviders == false %}No{% if activity.customerNotes.aiCustomerDataSentToProviders %}<br />{{ activity.customerNotes.aiCustomerDataSentToProviders }}{% endif %}{% else %}Not recorded{% if activity.customerNotes.aiCustomerDataSentToProviders %}<br />{{ activity.customerNotes.aiCustomerDataSentToProviders }}{% endif %}{% endif %} |
| AI outputs receive human review | {% if activity.aiHumanReviewOfOutputs == true %}Yes{% if activity.customerNotes.aiHumanReviewOfOutputs %}<br />{{ activity.customerNotes.aiHumanReviewOfOutputs }}{% endif %}{% elif activity.aiHumanReviewOfOutputs == false %}No{% if activity.customerNotes.aiHumanReviewOfOutputs %}<br />{{ activity.customerNotes.aiHumanReviewOfOutputs }}{% endif %}{% else %}Not recorded{% if activity.customerNotes.aiHumanReviewOfOutputs %}<br />{{ activity.customerNotes.aiHumanReviewOfOutputs }}{% endif %}{% endif %} |
| Users are informed when AI is used | {% if activity.aiUsersInformedWhenUsed == true %}Yes{% if activity.customerNotes.aiUsersInformedWhenUsed %}<br />{{ activity.customerNotes.aiUsersInformedWhenUsed }}{% endif %}{% elif activity.aiUsersInformedWhenUsed == false %}No{% if activity.customerNotes.aiUsersInformedWhenUsed %}<br />{{ activity.customerNotes.aiUsersInformedWhenUsed }}{% endif %}{% else %}Not recorded{% if activity.customerNotes.aiUsersInformedWhenUsed %}<br />{{ activity.customerNotes.aiUsersInformedWhenUsed }}{% endif %}{% endif %} |

{% if activity.customerNotes.usesAi %} {{ activity.customerNotes.usesAi }}{% endif %}{% endif %}
{% endfor %}
{% endfor %}
{% else %}
No AI-enabled processing activities are currently recorded for our services.
{% endif %}

## Automated decision-making

{% if privacy.usesAutomatedDecisionMaking == true %}
Our privacy profile records the use of automated decision-making. Questions or requests about this processing may be submitted using the privacy contact details below.{% if privacy.customerNotes.usesAutomatedDecisionMaking %} {{ privacy.customerNotes.usesAutomatedDecisionMaking }}{% endif %}
{% if privacy.customerNotes.usesAutomatedDecisionMaking %} {{ privacy.customerNotes.usesAutomatedDecisionMaking }}{% endif %}{% elif privacy.usesAutomatedDecisionMaking == false %}
Our privacy profile does not currently record automated decision-making.{% if privacy.customerNotes.usesAutomatedDecisionMaking %} {{ privacy.customerNotes.usesAutomatedDecisionMaking }}{% endif %}
{% if privacy.customerNotes.usesAutomatedDecisionMaking %} {{ privacy.customerNotes.usesAutomatedDecisionMaking }}{% endif %}{% else %}
Our use of automated decision-making has not yet been recorded.{% if privacy.customerNotes.usesAutomatedDecisionMaking %} {{ privacy.customerNotes.usesAutomatedDecisionMaking }}{% endif %}
{% if privacy.customerNotes.usesAutomatedDecisionMaking %} {{ privacy.customerNotes.usesAutomatedDecisionMaking }}{% endif %}{% endif %}

## Security and provider oversight

AI-enabled activities are covered by the same security and provider-management practices that apply to our other processing activities.

{% if security.vendorRisk.vendorReviewRequiredHasValue %}- Providers are subject to security review before or during use.{% if security.vendorRisk.customerNotes.vendorReviewRequired %} {{ security.vendorRisk.customerNotes.vendorReviewRequired }}{% endif %}
{% if security.vendorRisk.customerNotes.vendorReviewRequired %} {{ security.vendorRisk.customerNotes.vendorReviewRequired }}{% endif %}{% endif %}{% if security.vendorRisk.dpaRequiredForProcessorsHasValue %}- Data processing agreements are required for providers that process personal data.{% if security.vendorRisk.customerNotes.dpaRequiredForProcessors %} {{ security.vendorRisk.customerNotes.dpaRequiredForProcessors }}{% endif %}
{% endif %}{% if security.accessControl.leastPrivilegeHasValue %}- Access to systems and data follows least-privilege principles.{% if security.accessControl.customerNotes.leastPrivilege %} {{ security.accessControl.customerNotes.leastPrivilege }}{% endif %}
{% if security.accessControl.customerNotes.leastPrivilege %} {{ security.accessControl.customerNotes.leastPrivilege }}{% endif %}{% endif %}{% if security.encryption.atRestAlgorithmLabel %}- Data at rest is encrypted using {{ security.encryption.atRestAlgorithmLabel }}{% if security.encryption.customerNotes.atRestAlgorithm %} {{ security.encryption.customerNotes.atRestAlgorithm }}{% endif %}{% if infrastructure.customerNotes.encryptionAtRest %} {{ infrastructure.customerNotes.encryptionAtRest }}{% endif %}.
{% endif %}{% if security.encryption.inTransitMinimumTlsVersionLabel %}- Data in transit is protected using {{ security.encryption.inTransitMinimumTlsVersionLabel }}{% if security.encryption.customerNotes.inTransitMinimumTlsVersion %} {{ security.encryption.customerNotes.inTransitMinimumTlsVersion }}{% endif %}{% if infrastructure.customerNotes.encryptionInTransit %} {{ infrastructure.customerNotes.encryptionInTransit }}{% endif %} or higher.
{% endif %}

## Contact

For privacy questions about AI use{% if organization.privacyContactEmail %}, contact {{ organization.privacyContactEmail }}{% if organization.customerNotes.privacyContactEmail %} {{ organization.customerNotes.privacyContactEmail }}{% endif %}{% elif organization.contactEmail %}, contact {{ organization.contactEmail }}{% if organization.customerNotes.contactEmail %} {{ organization.customerNotes.contactEmail }}{% endif %}{% endif %}.

