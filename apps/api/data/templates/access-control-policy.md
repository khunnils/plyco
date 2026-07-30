' slug: access-control-policy
' name: Access Control Policy
' description: An internal policy covering least privilege, role-based access, privileged approval, authentication, access reviews, shared accounts, and offboarding.

# {{ organization.name }} Access Control Policy

{% if policy.version %}_Version {{ policy.version }}_{% endif %}
{% if policy.lastUpdatedDate %}_Last updated: {{ policy.lastUpdatedDate }}_{% endif %}

## Purpose and scope

This policy establishes the access control practices used by {{ organization.legalEntityName or organization.name }} to protect company systems, services, and data. It applies to personnel and other authorized users who receive access to company-managed or third-party systems.

## Access principles

{% if security.accessControl.leastPrivilege == true %}- Access is limited according to least-privilege principles.
{% elif security.accessControl.leastPrivilege == false %}- Least-privilege access is not currently recorded as required and should be reviewed.
{% else %}- The organization’s least-privilege requirement is not recorded.
{% endif %}
{% if security.accessControl.roleBasedAccess == true %}- Access is assigned through defined roles where supported.
{% elif security.accessControl.roleBasedAccess == false %}- Role-based access is not currently recorded as required and should be reviewed.
{% else %}- The use of role-based access is not recorded.
{% endif %}
{% if security.accessControl.adminApprovalRequired == true %}- Administrative and privileged access requires explicit approval.
{% elif security.accessControl.adminApprovalRequired == false %}- Administrative approval is not currently recorded as required and should be reviewed.
{% else %}- Administrative approval requirements are not recorded.
{% endif %}

Access should be granted for a documented business need, limited to the systems and information necessary for that need, and removed when no longer required.

## Authentication

| Control | Recorded requirement |
| --- | --- |
| Multi-factor authentication | {% if security.authentication.mfaRequired == true %}Required{% elif security.authentication.mfaRequired == false %}Not required{% else %}Not recorded{% endif %} |
| Single sign-on | {% if security.authentication.ssoSupported == true %}Used where supported{% elif security.authentication.ssoSupported == false %}Not currently used{% else %}Not recorded{% endif %} |
| Approved password manager | {% if security.authentication.passwordManagerRequired == true %}Required{% elif security.authentication.passwordManagerRequired == false %}Not required{% else %}Not recorded{% endif %} |

Credentials must not be disclosed to unauthorized people or stored in unapproved locations.

## Shared accounts

{% if access.sharedAccountsExist == false %}
Shared user accounts are not permitted for normal workforce access. Where a technical shared identity is unavoidable, access should be restricted, attributable, and reviewed.
{% elif access.sharedAccountsExist == true %}
Shared accounts are recorded as present. They should be limited to documented exceptions with controlled credentials and attributable activity.
{% else %}
The use of shared accounts has not been recorded and should be assessed.
{% endif %}

## Access reviews

{% if security.accessControl.accessReviewCadenceLabel %}
Access rights are reviewed on a {{ security.accessControl.accessReviewCadenceLabel | lower }} basis and when material role changes occur.
{% elif access.accessReviewsPerformed == true %}
Access rights are reviewed periodically; a formal cadence has not been recorded.
{% elif access.accessReviewsPerformed == false %}
Periodic access reviews are not currently recorded as performed and should be established.
{% else %}
Access review practices have not been recorded.
{% endif %}

Reviews should confirm continuing business need, appropriate privilege, and timely removal of obsolete access.

## Joiners, movers, and leavers

{% if access.offboardingProcessExists == true %}
A defined offboarding process removes or disables access promptly when personnel leave the organization. Access should also be adjusted when responsibilities change.
{% elif access.offboardingProcessExists == false %}
A defined offboarding process is not currently recorded and should be established.
{% else %}
Offboarding procedures have not been recorded.
{% endif %}

## Training and confidentiality

{% if access.securityTrainingRequiredHasValue %}- Personnel complete required security awareness training.
{% endif %}{% if access.confidentialityAgreementsRequiredHasValue %}- Personnel are bound by confidentiality obligations appropriate to their access.
{% endif %}

## Exceptions and review

Exceptions should be documented, risk-assessed, approved, time-bound, and reviewed. This policy should be reviewed after material changes to systems or access practices and at least whenever its recorded controls change.

Questions about this policy should be directed to {% if organization.securityContactEmail %}{{ organization.securityContactEmail }}{% elif organization.contactEmail %}{{ organization.contactEmail }}{% else %}the organization’s security contact{% endif %}.

