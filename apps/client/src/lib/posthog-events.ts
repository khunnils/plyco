export const POSTHOG_EVENTS = {
  USER_SIGNED_IN: "user_signed_in",
  MAGIC_LINK_SENT: "magic_link_sent",
  ORGANIZATION_CREATED: "organization_created",
  ONBOARDING_COMPLIANCE_GOALS_SELECTED: "onboarding_compliance_goals_selected",
  SECURITY_PROFILE_SAVED: "security_profile_saved",
  VENDOR_ADDED_FROM_CATALOG: "vendor_added_from_catalog",
  VENDOR_ADDED_MANUALLY: "vendor_added_manually",
  VENDOR_UPDATED: "vendor_updated",
  VENDOR_DELETED: "vendor_deleted",
  ACTIVITY_CREATED: "activity_created",
  ACTIVITY_UPDATED: "activity_updated",
  ACTIVITY_DELETED: "activity_deleted",
  DOCUMENT_PUBLISHED: "document_published",
  DOCUMENT_PDF_DOWNLOADED: "document_pdf_downloaded",
  RECOMMENDATION_EXPANDED: "recommendation_expanded",
} as const;

export type PostHogEvent = typeof POSTHOG_EVENTS[keyof typeof POSTHOG_EVENTS];
