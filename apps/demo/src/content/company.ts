interface Service {
  name: string;
  path: string;
  audience: string;
  description: string;
  features: readonly string[];
}

export const company = {
  name: "Brieflane",
  legalName: "Brieflane Labs Limited",
  country: "Ireland",
  address: "14 Example Quay, Dublin, Ireland (fictional address)",
  teamSize: 8,
  website: "https://demo.plyco.co",
  contactEmail: "hello@brieflane.example",
  privacyEmail: "privacy@brieflane.example",
  securityEmail: "security@brieflane.example",
  policyDate: "5 October 2026",
} as const;

export const services = {
  workspace: {
    name: "Brieflane Workspace",
    path: "/workspace/",
    audience: "For agency teams · Primary service",
    description:
      "A B2B SaaS workspace for creative and digital agencies to manage client requests, share project documents, and track approvals in one place.",
    features: [
      "Triage incoming client requests",
      "Assign owners and share project files",
      "Track decisions and approval history",
    ],
  },
  portal: {
    name: "Brieflane Customer Portal",
    path: "/portal/",
    audience: "For your clients · Separate service",
    description:
      "A customer-facing portal where invited agency clients submit requests, upload project documents, check progress, and approve deliverables.",
    features: [
      "Submit a brief with supporting documents",
      "See the status of your own projects",
      "Review work and record an approval",
    ],
  },
} as const satisfies Record<string, Service>;

export const regions = [
  {
    name: "European Union",
    location: "Ireland",
    code: "eu-west-1",
    detail: "EU application hosting and customer-data storage in Ireland.",
  },
  {
    name: "United States",
    location: "Northern Virginia",
    code: "us-east-1",
    detail:
      "US application hosting and customer-data storage in Northern Virginia.",
  },
] as const;

export const dataTypes = [
  {
    name: "Business-user accounts",
    description:
      "Agency staff names, work email addresses, roles, and authentication records.",
  },
  {
    name: "Client contact details",
    description:
      "Client names, work email addresses, organizations, and portal invitations.",
  },
  {
    name: "Requests and documents",
    description:
      "Project briefs, comments, uploaded files, and deliverables provided by agency teams and clients.",
  },
  {
    name: "Approval records",
    description:
      "Reviewer identity, decisions, timestamps, and document-version references.",
  },
  {
    name: "Usage and security logs",
    description:
      "IP addresses, device/browser information, access events, and service diagnostics.",
  },
] as const;

export const activities = [
  {
    name: "Manage accounts and client access",
    purpose:
      "Authenticate agency staff and invited clients, enforce roles, and maintain tenant access boundaries.",
  },
  {
    name: "Manage client requests and documents",
    purpose:
      "Collect briefs and files, coordinate project work, and share deliverables between an agency and its clients.",
  },
  {
    name: "Record approvals",
    purpose:
      "Capture review decisions and preserve a traceable history of approved deliverables.",
  },
  {
    name: "Send service notifications",
    purpose:
      "Deliver invitations, request updates, and approval notifications to staff and clients.",
  },
  {
    name: "Monitor and support the service",
    purpose:
      "Use access logs and diagnostics to investigate faults, prevent abuse, and answer support requests.",
  },
] as const;

export const providers = [
  {
    name: "Amazon Web Services (AWS)",
    purpose:
      "Application compute, PostgreSQL database, object storage, logs, and backups",
    data: "Accounts, client contacts, requests/documents, approvals, and logs",
    region:
      "Ireland or Northern Virginia, following the selected workspace region",
  },
  {
    name: "Stripe",
    purpose: "Subscription billing and payment processing",
    data: "Billing contacts, invoice details, and payment information; no project documents",
    region: "EU and US processing; not restricted to the workspace region",
  },
  {
    name: "Resend",
    purpose: "Transactional notifications and opted-in marketing emails",
    data: "Recipient names/emails and minimal notification content; no document attachments",
    region: "US processing; not restricted to the workspace region",
  },
] as const;

export const sampleRequests = [
  {
    id: "BL-104",
    title: "Autumn campaign brief",
    client: "Juniper Studio",
    owner: "Maya",
    status: "In progress",
    tone: "blue",
    date: "8 Oct",
  },
  {
    id: "BL-103",
    title: "Homepage copy review",
    client: "Juniper Studio",
    owner: "Leo",
    status: "Needs approval",
    tone: "amber",
    date: "7 Oct",
  },
  {
    id: "BL-102",
    title: "Brand guidelines update",
    client: "Cedar Collective",
    owner: "Maya",
    status: "Approved",
    tone: "teal",
    date: "6 Oct",
  },
] as const;
