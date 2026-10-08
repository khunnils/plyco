' slug: cookie-policy
' name: Cookie Policy
' description: A customer-facing cookie policy based on each service's cookie categories, consent controls, and analytics and advertising providers.

# {{ organization.name }} Cookie Policy

{% if organization.customerNotes.name %} {{ organization.customerNotes.name }}{% endif %}

{% if policy.version %}_Version {{ policy.version }}_{% endif %}
{% if policy.effectiveDate %}_Effective date: {{ policy.effectiveDate }}_{% endif %}
{% if policy.lastUpdatedDate %}_Last updated: {{ policy.lastUpdatedDate }}_{% endif %}

This Cookie Policy explains how {{ organization.legalEntityName or organization.name }}{% if organization.legalEntityName %}{% if organization.customerNotes.legalEntityName %} {{ organization.customerNotes.legalEntityName }}{% endif %}{% endif %}{% if not organization.legalEntityName %}{% if organization.customerNotes.name %} {{ organization.customerNotes.name }}{% endif %}{% endif %} ("{{ organization.name }}", "we", "us", or "our") uses cookies and similar technologies in connection with our services. It should be read together with our Privacy Policy.

## What cookies and similar technologies are

Cookies are small text files stored on your device when you visit a website. We may also use similar technologies, such as pixels, local storage, and software development kits, that store information on or access information from your device. These technologies can help a service operate, remember choices, understand usage, and support advertising.

{% if services.cookiesAnswered %}
## How we use cookies and similar technologies

{% for service in services.all %}
{% if service.privacy.usesCookiesOrTrackingTechnologies %}
{% if services.all.length > 1 %}### {{ service.name }}

{% if service.customerNotes.name %} {{ service.customerNotes.name }}{% endif %}

{% endif %}{% if service.privacy.cookieCategoriesHasValue %}{{ service.name }}{% if service.customerNotes.name %} {{ service.customerNotes.name }}{% endif %}{% if service.url %} ({{ service.url }}{% if service.customerNotes.url %} {{ service.customerNotes.url }}{% endif %}){% endif %} uses the following categories:{% if service.privacy.customerNotes.cookieCategories %} {{ service.privacy.customerNotes.cookieCategories }}{% endif %}

| Category | Purpose | Consent required before use |
| --- | --- | --- |
{% for category in service.privacy.cookieCategories -%}
| {{ category.label }}{% if category.customerNotes.enabled %}<br />{{ category.customerNotes.enabled }}{% endif %} | {% if category.category == "necessary" %}Operate core service features such as authentication, security, and load balancing.{% elif category.category == "preferences" %}Remember choices such as language, region, or display settings.{% elif category.category == "analytics" %}Measure service usage and help us improve the service through statistics.{% elif category.category == "marketing" %}Support advertising, remarketing, and campaign measurement.{% endif %} | {% if category.requiresConsent %}Yes{% if category.customerNotes.requiresConsent %}<br />{{ category.customerNotes.requiresConsent }}{% endif %}{% else %}No{% if category.customerNotes.requiresConsent %}<br />{{ category.customerNotes.requiresConsent }}{% endif %}{% endif %} |
{% endfor %}
{% else %}{{ service.name }}{% if service.customerNotes.name %} {{ service.customerNotes.name }}{% endif %}{% if service.url %} ({{ service.url }}{% if service.customerNotes.url %} {{ service.customerNotes.url }}{% endif %}){% endif %} uses cookies or similar technologies.{% if service.privacy.customerNotes.cookieCategories %} {{ service.privacy.customerNotes.cookieCategories }}{% endif %}
{% endif %}

{% if service.privacy.analyticsProviders.length %}Analytics providers used by {{ service.name }}{% if service.customerNotes.name %} {{ service.customerNotes.name }}{% endif %} include: {{ service.privacy.analyticsProviders | join(", ") }}.
{% endif %}
{% if service.privacy.advertisingProviders.length %}Advertising providers used by {{ service.name }}{% if service.customerNotes.name %} {{ service.customerNotes.name }}{% endif %} include: {{ service.privacy.advertisingProviders | join(", ") }}.
{% endif %}
{% if service.privacy.cookieConsentMechanismLabel or service.privacy.nonEssentialCookiesBlockedUntilConsent or service.privacy.cookieConsentWithdrawalMethodLabel or service.privacy.globalPrivacyControlSupported %}
{% if services.all.length > 1 %}Cookie choices for {{ service.name }}{% if service.customerNotes.name %} {{ service.customerNotes.name }}{% endif %}:
{% else %}## Your cookie choices
{% endif %}
{% if service.privacy.cookieConsentMechanismLabel %}- You can make your initial choices through {{ service.privacy.cookieConsentMechanismLabel }}{% if service.privacy.customerNotes.cookieConsentMechanism %} {{ service.privacy.customerNotes.cookieConsentMechanism }}{% endif %}.
{% endif %}
{% if service.privacy.nonEssentialCookiesBlockedUntilConsent %}- We do not set non-essential cookies or similar technologies until you give consent.{% if service.privacy.customerNotes.nonEssentialCookiesBlockedUntilConsent %} {{ service.privacy.customerNotes.nonEssentialCookiesBlockedUntilConsent }}{% endif %}
{% endif %}
{% if service.privacy.cookieConsentWithdrawalMethodLabel %}- You can change your choices or withdraw consent through {{ service.privacy.cookieConsentWithdrawalMethodLabel }}{% if service.privacy.customerNotes.cookieConsentWithdrawalMethod %} {{ service.privacy.customerNotes.cookieConsentWithdrawalMethod }}{% endif %}.
{% endif %}
{% if service.privacy.globalPrivacyControlSupported %}- We honor Global Privacy Control signals.{% if service.privacy.customerNotes.globalPrivacyControlSupported %} {{ service.privacy.customerNotes.globalPrivacyControlSupported }}{% endif %}
{% if service.privacy.customerNotes.globalPrivacyControlSupported %} {{ service.privacy.customerNotes.globalPrivacyControlSupported }}{% endif %}{% endif %}
{% endif %}
{% if service.privacy.customerNotes.usesCookiesOrTrackingTechnologies %} {{ service.privacy.customerNotes.usesCookiesOrTrackingTechnologies }}{% endif %}{% elif service.privacy.usesCookiesOrTrackingTechnologiesAnswered %}
{% if services.all.length > 1 %}### {{ service.name }}

{% if service.customerNotes.name %} {{ service.customerNotes.name }}{% endif %}

{% endif %}{{ service.name }}{% if service.customerNotes.name %} {{ service.customerNotes.name }}{% endif %} does not use cookies or similar tracking technologies.{% if service.privacy.customerNotes.usesCookiesOrTrackingTechnologies %} {{ service.privacy.customerNotes.usesCookiesOrTrackingTechnologies }}{% endif %}

{% if service.privacy.customerNotes.usesCookiesOrTrackingTechnologies %} {{ service.privacy.customerNotes.usesCookiesOrTrackingTechnologies }}{% endif %}{% endif %}
{% endfor %}
{% endif %}

## Browser and device controls

Most browsers let you view, delete, or block cookies through their settings. Blocking cookies may affect features that depend on them. Browser settings may not control every similar technology, so use the service-specific controls described above when available.

## Changes to this policy

We may update this Cookie Policy when our services or use of cookies and similar technologies changes. The date at the top shows when this policy was last updated.

## Contact us

If you have questions about this Cookie Policy{% if organization.privacyContactEmail %}, contact us at {{ organization.privacyContactEmail }}{% if organization.customerNotes.privacyContactEmail %} {{ organization.customerNotes.privacyContactEmail }}{% endif %}{% elif organization.contactEmail %}, contact us at {{ organization.contactEmail }}{% if organization.customerNotes.contactEmail %} {{ organization.customerNotes.contactEmail }}{% endif %}{% endif %}.
