export const activityHelperText = {
  role: "Whether your organization decides how this processing happens or processes data for another organization.",
  dataTypes:
    "The organization data types this activity collects, uses, stores, or otherwise processes.",
  retentionPolicy:
    "The rule that determines how long data from this activity is kept.",
  retentionDays:
    "The number of days data is kept when the retention policy is fixed.",
  usesAi:
    "Whether this activity uses AI models, assistants, or automated generation.",
  aiUseCases:
    "The ways AI is used in this activity, such as support triage, summarization, classification, or content generation.",
  aiCustomerDataUsedForTraining:
    "Whether customer data from this activity is used to train or fine-tune AI models.",
  aiCustomerDataSentToProviders:
    "Whether customer data from this activity is sent to external AI providers.",
  aiHumanReviewOfOutputs:
    "Whether people review AI outputs before they affect customers or important decisions.",
  aiUsersInformedWhenUsed:
    "Whether users are told when AI is used in this activity.",
} as const
