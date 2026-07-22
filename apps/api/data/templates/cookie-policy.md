' slug: cookie-policy
' name: Cookie Policy
' description: A customer-facing cookie policy based on each service's cookie categories, consent controls, and analytics and advertising providers.

# {{ organization.name }} Cookie Policy

{% if policy.version %}_Version {{ policy.version }}_{% endif %}
{% if policy.effectiveDate %}_Effective date: {{ policy.effectiveDate }}_{% endif %}
{% if policy.lastUpdatedDate %}_Last updated: {{ policy.lastUpdatedDate }}_{% endif %}

This Cookie Policy explains how {{ organization.legalEntityName or organization.name }} ("{{ organization.name }}", "we", "us", or "our") uses cookies and similar technologies in connection with our services. It should be read together with our Privacy Policy.

## What cookies and similar technologies are

Cookies are small text files stored on your device when you visit a website. We may also use similar technologies, such as pixels, local storage, and software development kits, that store information on or access information from your device. These technologies can help a service operate, remember choices, understand usage, and support advertising.

{% if services.cookiesAnswered %}
## How we use cookies and similar technologies

{% for service in services.all %}
{% if service.privacy.usesCookiesOrTrackingTechnologies %}
{% if services.all.length > 1 %}### {{ service.name }}

{% endif %}{% if service.privacy.cookieCategoriesHasValue %}{{ service.name }}{% if service.url %} ({{ service.url }}){% endif %} uses the following categories:

| Category | Purpose | Consent required before use |
| --- | --- | --- |
{% for category in service.privacy.cookieCategories -%}
| {{ category.label }} | {% if category.category == "necessary" %}Operate core service features such as authentication, security, and load balancing.{% elif category.category == "preferences" %}Remember choices such as language, region, or display settings.{% elif category.category == "analytics" %}Measure service usage and help us improve the service through statistics.{% elif category.category == "marketing" %}Support advertising, remarketing, and campaign measurement.{% endif %} | {% if category.requiresConsent %}Yes{% else %}No{% endif %} |
{% endfor %}
{% else %}{{ service.name }}{% if service.url %} ({{ service.url }}){% endif %} uses cookies or similar technologies.
{% endif %}

{% if service.privacy.analyticsProviders.length %}Analytics providers used by {{ service.name }} include: {{ service.privacy.analyticsProviders | join(", ") }}.
{% endif %}
{% if service.privacy.advertisingProviders.length %}Advertising providers used by {{ service.name }} include: {{ service.privacy.advertisingProviders | join(", ") }}.
{% endif %}
{% if service.privacy.cookieConsentMechanismLabel or service.privacy.nonEssentialCookiesBlockedUntilConsent or service.privacy.cookieConsentWithdrawalMethodLabel or service.privacy.globalPrivacyControlSupported %}
{% if services.all.length > 1 %}Cookie choices for {{ service.name }}:
{% else %}## Your cookie choices
{% endif %}
{% if service.privacy.cookieConsentMechanismLabel %}- You can make your initial choices through {{ service.privacy.cookieConsentMechanismLabel }}.
{% endif %}
{% if service.privacy.nonEssentialCookiesBlockedUntilConsent %}- We do not set non-essential cookies or similar technologies until you give consent.
{% endif %}
{% if service.privacy.cookieConsentWithdrawalMethodLabel %}- You can change your choices or withdraw consent through {{ service.privacy.cookieConsentWithdrawalMethodLabel }}.
{% endif %}
{% if service.privacy.globalPrivacyControlSupported %}- We honor Global Privacy Control signals.
{% endif %}
{% endif %}
{% elif service.privacy.usesCookiesOrTrackingTechnologiesAnswered %}
{% if services.all.length > 1 %}### {{ service.name }}

{% endif %}{{ service.name }} does not use cookies or similar tracking technologies.

{% endif %}
{% endfor %}
{% endif %}

## Browser and device controls

Most browsers let you view, delete, or block cookies through their settings. Blocking cookies may affect features that depend on them. Browser settings may not control every similar technology, so use the service-specific controls described above when available.

## Changes to this policy

We may update this Cookie Policy when our services or use of cookies and similar technologies changes. The date at the top shows when this policy was last updated.

## Contact us

If you have questions about this Cookie Policy{% if organization.privacyContactEmail %}, contact us at {{ organization.privacyContactEmail }}{% elif organization.contactEmail %}, contact us at {{ organization.contactEmail }}{% endif %}.
