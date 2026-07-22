import {
  AlertTriangle,
  ClipboardList,
  FileText,
  Lock,
  Network,
  Settings2,
  Shield,
  type LucideIcon,
} from "lucide-react"

const TEMPLATE_ICONS: Record<string, LucideIcon> = {
  "privacy-policy": Shield,
  "data-security-policy": Lock,
  "incident-response-plan": AlertTriangle,
  "record-of-processing-activities": ClipboardList,
  subprocessors: Network,
  "technical-and-organizational-measures": Settings2,
}

export const getTemplateIcon = (
  slug: string | null | undefined
): LucideIcon => {
  if (!slug) {
    return FileText
  }

  return TEMPLATE_ICONS[slug] ?? FileText
}
