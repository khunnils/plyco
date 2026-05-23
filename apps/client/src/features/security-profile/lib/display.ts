export const boolText = (value: boolean | null) =>
  value === null ? "Not answered" : value ? "Yes" : "No"
