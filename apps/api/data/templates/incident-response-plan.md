' slug: incident-response-plan
' name: Incident Response Plan
' description: A lightweight incident response outline for assigning roles, triage, communication, and follow-up.

# {{ company.name }} Incident Response Plan

{% if company.customerNotes.name %} {{ company.customerNotes.name }}{% endif %}

## Scope

This plan covers security incidents affecting company systems, customer data, production infrastructure, and critical vendors.

## Response Flow

1. Triage the reported issue and assign an incident owner.
2. Contain affected systems or credentials.
3. Assess data exposure and customer impact.
4. Communicate status to stakeholders.
5. Document root cause, remediation, and follow-up tasks.
