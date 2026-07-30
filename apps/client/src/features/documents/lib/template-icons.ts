import {
  AlertTriangle,
  Bot,
  CalendarClock,
  ClipboardList,
  FileText,
  KeyRound,
  ListChecks,
  Lock,
  Network,
  ScrollText,
  Settings2,
  Shield,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react"

const TEMPLATE_ICONS: Record<string, LucideIcon> = {
  "access-control-policy": KeyRound,
  "ai-use-transparency-statement": Bot,
  "privacy-policy": Shield,
  "data-security-policy": Lock,
  "data-security-summary": ShieldCheck,
  "data-retention-schedule": CalendarClock,
  "dpa-processing-details-annex": ScrollText,
  "incident-response-plan": AlertTriangle,
  "record-of-processing-activities": ClipboardList,
  "security-questionnaire-response-pack": ListChecks,
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
