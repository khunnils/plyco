import {
  Box,
  Building2,
  ClipboardList,
  Database,
  KeyRound,
  Network,
  Server,
  Shield,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react"

import type { PageHeaderCrumb } from "@/features/shell/components/page-header"

export const SIDEBAR_SECTION = {
  company: "Company",
  productAndData: "Product and Data",
  vendors: "Vendors",
  documents: "Documents",
  settings: "Settings",
} as const

export type CompanySectionId =
  | "profile"
  | "service"
  | "activities"
  | "graph"
  | "privacy"
  | "infrastructure"
  | "security"
  | "dataHandling"
  | "access"

export type CompanySection = {
  id: CompanySectionId
  path: string
  title: string
  description: string
  icon: LucideIcon
}

export const companySections: CompanySection[] = [
  {
    id: "profile",
    path: "/company/profile",
    title: "Profile",
    description: "Operational context customers ask for early.",
    icon: Building2,
  },
  {
    id: "privacy",
    path: "/company/privacy",
    title: "Privacy",
    description: "Rights and request handling for privacy documents.",
    icon: ShieldCheck,
  },
  {
    id: "infrastructure",
    path: "/company/infrastructure",
    title: "Infrastructure",
    description: "The baseline systems behind the product.",
    icon: Server,
  },
  {
    id: "security",
    path: "/company/security",
    title: "Security",
    description:
      "Development security, vulnerabilities, and incident response.",
    icon: Shield,
  },
  {
    id: "access",
    path: "/company/access",
    title: "Access",
    description: "Access hygiene and account risk.",
    icon: KeyRound,
  },
]

export const productAndDataSections: CompanySection[] = [
  {
    id: "dataHandling",
    path: "/company/data",
    title: "Data Types",
    description: "Data categories and protection practices.",
    icon: Database,
  },
  {
    id: "activities",
    path: "/company/activities",
    title: "Activities",
    description: "Processing activities services and documents reference.",
    icon: ClipboardList,
  },
  {
    id: "service",
    path: "/company/services",
    title: "Services",
    description: "Products or services the organization offers.",
    icon: Box,
  },
  {
    id: "graph",
    path: "/company/graph",
    title: "Graph",
    description: "Read-only map of services, data, activities, and providers.",
    icon: Network,
  },
]

export const sectionPageBreadcrumbs = (
  section: string,
  pages: PageHeaderCrumb[]
): PageHeaderCrumb[] => [{ label: section }, ...pages]
