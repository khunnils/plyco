' slug: access-control-policy
' name: Access Control Policy
' description: An internal policy covering least privilege, role-based access, privileged approval, authentication, access reviews, shared accounts, and offboarding.

# {{ organization.name }} Access Control Policy

{% if organization.customerNotes.name %} {{ organization.customerNotes.name }}{% endif %}

{% if policy.version %}_Version {{ policy.version }}_{% endif %}
{% if policy.lastUpdatedDate %}_Last updated: {{ policy.lastUpdatedDate }}_{% endif %}

## Purpose and scope

This policy establishes the access control practices used by {{ organization.legalEntityName or organization.name }}{% if organization.legalEntityName %}{% if organization.customerNotes.legalEntityName %} {{ organization.customerNotes.legalEntityName }}{% endif %}{% endif %}{% if not organization.legalEntityName %}{% if organization.customerNotes.name %} {{ organization.customerNotes.name }}{% endif %}{% endif %} to protect company systems, services, and data. It applies to personnel and other authorized users who receive access to company-managed or third-party systems.

## Access principles

{% if security.accessControl.leastPrivilege == true %}- Access is limited according to least-privilege principles.{% if security.accessControl.customerNotes.leastPrivilege %} {{ security.accessControl.customerNotes.leastPrivilege }}{% endif %}
{% if security.accessControl.customerNotes.leastPrivilege %} {{ security.accessControl.customerNotes.leastPrivilege }}{% endif %}{% elif security.accessControl.leastPrivilege == false %}- Least-privilege access is not currently recorded as required and should be reviewed.{% if security.accessControl.customerNotes.leastPrivilege %} {{ security.accessControl.customerNotes.leastPrivilege }}{% endif %}
{% if security.accessControl.customerNotes.leastPrivilege %} {{ security.accessControl.customerNotes.leastPrivilege }}{% endif %}{% else %}- The organization’s least-privilege requirement is not recorded.{% if security.accessControl.customerNotes.leastPrivilege %} {{ security.accessControl.customerNotes.leastPrivilege }}{% endif %}
{% if security.accessControl.customerNotes.leastPrivilege %} {{ security.accessControl.customerNotes.leastPrivilege }}{% endif %}{% endif %}
{% if security.accessControl.roleBasedAccess == true %}- Access is assigned through defined roles where supported.{% if security.accessControl.customerNotes.roleBasedAccess %} {{ security.accessControl.customerNotes.roleBasedAccess }}{% endif %}
{% if security.accessControl.customerNotes.roleBasedAccess %} {{ security.accessControl.customerNotes.roleBasedAccess }}{% endif %}{% elif security.accessControl.roleBasedAccess == false %}- Role-based access is not currently recorded as required and should be reviewed.{% if security.accessControl.customerNotes.roleBasedAccess %} {{ security.accessControl.customerNotes.roleBasedAccess }}{% endif %}
{% if security.accessControl.customerNotes.roleBasedAccess %} {{ security.accessControl.customerNotes.roleBasedAccess }}{% endif %}{% else %}- The use of role-based access is not recorded.{% if security.accessControl.customerNotes.roleBasedAccess %} {{ security.accessControl.customerNotes.roleBasedAccess }}{% endif %}
{% if security.accessControl.customerNotes.roleBasedAccess %} {{ security.accessControl.customerNotes.roleBasedAccess }}{% endif %}{% endif %}
{% if security.accessControl.adminApprovalRequired == true %}- Administrative and privileged access requires explicit approval.{% if security.accessControl.customerNotes.adminApprovalRequired %} {{ security.accessControl.customerNotes.adminApprovalRequired }}{% endif %}
{% if security.accessControl.customerNotes.adminApprovalRequired %} {{ security.accessControl.customerNotes.adminApprovalRequired }}{% endif %}{% elif security.accessControl.adminApprovalRequired == false %}- Administrative approval is not currently recorded as required and should be reviewed.{% if security.accessControl.customerNotes.adminApprovalRequired %} {{ security.accessControl.customerNotes.adminApprovalRequired }}{% endif %}
{% if security.accessControl.customerNotes.adminApprovalRequired %} {{ security.accessControl.customerNotes.adminApprovalRequired }}{% endif %}{% else %}- Administrative approval requirements are not recorded.{% if security.accessControl.customerNotes.adminApprovalRequired %} {{ security.accessControl.customerNotes.adminApprovalRequired }}{% endif %}
{% if security.accessControl.customerNotes.adminApprovalRequired %} {{ security.accessControl.customerNotes.adminApprovalRequired }}{% endif %}{% endif %}

Access should be granted for a documented business need, limited to the systems and information necessary for that need, and removed when no longer required.

## Authentication

| Control | Recorded requirement |
| --- | --- |
| Multi-factor authentication | {% if security.authentication.mfaRequired == true %}Required{% if security.authentication.customerNotes.mfaRequired %}<br />{{ security.authentication.customerNotes.mfaRequired }}{% endif %}{% elif security.authentication.mfaRequired == false %}Not required{% if security.authentication.customerNotes.mfaRequired %}<br />{{ security.authentication.customerNotes.mfaRequired }}{% endif %}{% else %}Not recorded{% if security.authentication.customerNotes.mfaRequired %}<br />{{ security.authentication.customerNotes.mfaRequired }}{% endif %}{% endif %} |
| Single sign-on | {% if security.authentication.ssoSupported == true %}Used where supported{% if security.authentication.customerNotes.ssoSupported %}<br />{{ security.authentication.customerNotes.ssoSupported }}{% endif %}{% elif security.authentication.ssoSupported == false %}Not currently used{% if security.authentication.customerNotes.ssoSupported %}<br />{{ security.authentication.customerNotes.ssoSupported }}{% endif %}{% else %}Not recorded{% if security.authentication.customerNotes.ssoSupported %}<br />{{ security.authentication.customerNotes.ssoSupported }}{% endif %}{% endif %} |
| Approved password manager | {% if security.authentication.passwordManagerRequired == true %}Required{% if security.authentication.customerNotes.passwordManagerRequired %}<br />{{ security.authentication.customerNotes.passwordManagerRequired }}{% endif %}{% elif security.authentication.passwordManagerRequired == false %}Not required{% if security.authentication.customerNotes.passwordManagerRequired %}<br />{{ security.authentication.customerNotes.passwordManagerRequired }}{% endif %}{% else %}Not recorded{% if security.authentication.customerNotes.passwordManagerRequired %}<br />{{ security.authentication.customerNotes.passwordManagerRequired }}{% endif %}{% endif %} |

Credentials must not be disclosed to unauthorized people or stored in unapproved locations.

## Shared accounts

{% if access.sharedAccountsExist == false %}
Shared user accounts are not permitted for normal workforce access. Where a technical shared identity is unavoidable, access should be restricted, attributable, and reviewed.{% if access.customerNotes.sharedAccountsExist %} {{ access.customerNotes.sharedAccountsExist }}{% endif %}
{% elif access.sharedAccountsExist == true %}
Shared accounts are recorded as present. They should be limited to documented exceptions with controlled credentials and attributable activity.{% if access.customerNotes.sharedAccountsExist %} {{ access.customerNotes.sharedAccountsExist }}{% endif %}
{% else %}
The use of shared accounts has not been recorded and should be assessed.{% if access.customerNotes.sharedAccountsExist %} {{ access.customerNotes.sharedAccountsExist }}{% endif %}
{% endif %}

## Access reviews

{% if security.accessControl.accessReviewCadenceLabel %}
Access rights are reviewed on a {{ security.accessControl.accessReviewCadenceLabel | lower }}{% if security.accessControl.customerNotes.accessReviewCadence %} {{ security.accessControl.customerNotes.accessReviewCadence }}{% endif %} basis and when material role changes occur.
{% elif access.accessReviewsPerformed == true %}
Access rights are reviewed periodically; a formal cadence has not been recorded.{% if access.customerNotes.accessReviewsPerformed %} {{ access.customerNotes.accessReviewsPerformed }}{% endif %}
{% if access.customerNotes.accessReviewsPerformed %} {{ access.customerNotes.accessReviewsPerformed }}{% endif %}{% elif access.accessReviewsPerformed == false %}
Periodic access reviews are not currently recorded as performed and should be established.{% if access.customerNotes.accessReviewsPerformed %} {{ access.customerNotes.accessReviewsPerformed }}{% endif %}
{% if access.customerNotes.accessReviewsPerformed %} {{ access.customerNotes.accessReviewsPerformed }}{% endif %}{% else %}
Access review practices have not been recorded.{% if access.customerNotes.accessReviewsPerformed %} {{ access.customerNotes.accessReviewsPerformed }}{% endif %}
{% if access.customerNotes.accessReviewsPerformed %} {{ access.customerNotes.accessReviewsPerformed }}{% endif %}{% endif %}

Reviews should confirm continuing business need, appropriate privilege, and timely removal of obsolete access.

## Joiners, movers, and leavers

{% if access.offboardingProcessExists == true %}
A defined offboarding process removes or disables access promptly when personnel leave the organization. Access should also be adjusted when responsibilities change.{% if access.customerNotes.offboardingProcessExists %} {{ access.customerNotes.offboardingProcessExists }}{% endif %}
{% if access.customerNotes.offboardingProcessExists %} {{ access.customerNotes.offboardingProcessExists }}{% endif %}{% elif access.offboardingProcessExists == false %}
A defined offboarding process is not currently recorded and should be established.{% if access.customerNotes.offboardingProcessExists %} {{ access.customerNotes.offboardingProcessExists }}{% endif %}
{% if access.customerNotes.offboardingProcessExists %} {{ access.customerNotes.offboardingProcessExists }}{% endif %}{% else %}
Offboarding procedures have not been recorded.{% if access.customerNotes.offboardingProcessExists %} {{ access.customerNotes.offboardingProcessExists }}{% endif %}
{% if access.customerNotes.offboardingProcessExists %} {{ access.customerNotes.offboardingProcessExists }}{% endif %}{% endif %}

## Training and confidentiality

{% if access.securityTrainingRequiredHasValue %}- Personnel complete required security awareness training.{% if access.customerNotes.securityTrainingRequired %} {{ access.customerNotes.securityTrainingRequired }}{% endif %}
{% if access.customerNotes.securityTrainingRequired %} {{ access.customerNotes.securityTrainingRequired }}{% endif %}{% endif %}{% if access.confidentialityAgreementsRequiredHasValue %}- Personnel are bound by confidentiality obligations appropriate to their access.{% if access.customerNotes.confidentialityAgreementsRequired %} {{ access.customerNotes.confidentialityAgreementsRequired }}{% endif %}
{% if access.customerNotes.confidentialityAgreementsRequired %} {{ access.customerNotes.confidentialityAgreementsRequired }}{% endif %}{% endif %}

## Exceptions and review

Exceptions should be documented, risk-assessed, approved, time-bound, and reviewed. This policy should be reviewed after material changes to systems or access practices and at least whenever its recorded controls change.

Questions about this policy should be directed to {% if organization.securityContactEmail %}{{ organization.securityContactEmail }}{% if organization.customerNotes.securityContactEmail %} {{ organization.customerNotes.securityContactEmail }}{% endif %}{% elif organization.contactEmail %}{{ organization.contactEmail }}{% if organization.customerNotes.contactEmail %} {{ organization.customerNotes.contactEmail }}{% endif %}{% else %}the organization’s security contact{% endif %}.

