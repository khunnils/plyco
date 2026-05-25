import {
  Box,
  ChevronDown,
  ChevronRight,
  FileText,
  LayoutDashboard,
  LogOut,
  Plus,
  ScrollText,
  Tags,
  Users,
  Building2,
  ClipboardList,
  ShieldCheck,
  Server,
  Database,
  KeyRound,
  type LucideIcon,
} from "lucide-react"
import { useLocation, useNavigate } from "react-router-dom"
import { type AuthUser, type ServiceProfileInput } from "@plyco/shared"

import { Button } from "@/components/ui/button"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
} from "@/components/ui/sidebar"
import { OrganizationSwitcher } from "@/features/organizations/components/organization-switcher"
import { useSecurityUiStore } from "@/features/shell/stores/security-ui-store"

export type CompanySectionId =
  | "profile"
  | "service"
  | "activities"
  | "privacy"
  | "infrastructure"
  | "dataHandling"
  | "access"

export type CompanySection = {
  id: CompanySectionId
  path: string
  title: string
  description: string
  icon: LucideIcon
}

const companySections: CompanySection[] = [
  {
    id: "profile",
    path: "/company/profile",
    title: "Profile",
    description: "Operational context customers ask for early.",
    icon: Building2,
  },
  {
    id: "service",
    path: "/company/services",
    title: "Services",
    description: "Products or services the organization offers.",
    icon: Box,
  },
  {
    id: "activities",
    path: "/company/activities",
    title: "Activities",
    description: "Processing activities services and documents reference.",
    icon: ClipboardList,
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
    id: "dataHandling",
    path: "/company/data",
    title: "Data",
    description: "Data categories and protection practices.",
    icon: Database,
  },
  {
    id: "access",
    path: "/company/access",
    title: "Access",
    description: "Access hygiene and account risk.",
    icon: KeyRound,
  },
]

export const AppSidebar = ({
  onLogout,
  services,
  user,
}: {
  onLogout: () => void
  services: ServiceProfileInput[]
  user: AuthUser
}) => {
  const location = useLocation()
  const navigate = useNavigate()
  const { servicesExpanded, setServicesExpanded, setSelectedServiceId } =
    useSecurityUiStore()

  const pathname = location.pathname

  const serviceIdMatch = pathname.match(/^\/company\/services\/([^/]+)$/)
  const currentServiceId = serviceIdMatch?.[1] ?? null
  const isCompanyServicePath = pathname.startsWith("/company/services")

  return (
    <Sidebar>
      <SidebarHeader>
        <OrganizationSwitcher user={user} />
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          <SidebarMenuButton
            active={pathname === "/"}
            onClick={() => navigate("/")}
          >
            <LayoutDashboard className="size-4" />
            Dashboard
          </SidebarMenuButton>
          <div className="px-3 pb-1 pt-3 text-xs text-slate-600">
            Company
          </div>
          <div className="ml-1 grid gap-1">
            {companySections.map((section) => {
              const Icon = section.icon

              if (section.id === "service") {
                return (
                  <div className="grid gap-1" key={section.id}>
                    <SidebarMenuButton
                      onClick={() => {
                        setServicesExpanded(!servicesExpanded)
                      }}
                    >
                      <Box className="size-4" />
                      <span className="min-w-0 flex-1 text-left">
                        {section.title}
                      </span>
                      {servicesExpanded ? (
                        <ChevronDown className="size-4" />
                      ) : (
                        <ChevronRight className="size-4" />
                      )}
                    </SidebarMenuButton>
                    {servicesExpanded ? (
                      <div className="ml-6 grid gap-1">
                        {services.map((service, index) => {
                          const serviceId = service.id ?? null
                          const selected =
                            isCompanyServicePath &&
                            (currentServiceId === serviceId ||
                              (!currentServiceId && index === 0 && pathname === "/company/services"))

                          return (
                            <SidebarMenuButton
                              active={selected}
                              key={service.id ?? `service-${index}`}
                              onClick={() => {
                                setSelectedServiceId(serviceId)
                                navigate(
                                  serviceId
                                    ? `/company/services/${serviceId}`
                                    : "/company/services"
                                )
                              }}
                            >
                              <span className="truncate">
                                {service.serviceName || `Service ${index + 1}`}
                              </span>
                            </SidebarMenuButton>
                          )
                        })}
                        <SidebarMenuButton
                          className="h-8 text-xs text-slate-400 hover:text-slate-600 gap-2 px-2.5"
                          onClick={() => {
                            setSelectedServiceId(null)
                            navigate("/company/services/new")
                          }}
                        >
                          <Plus className="size-3.5" />
                          Add service
                        </SidebarMenuButton>
                      </div>
                    ) : null}
                  </div>
                )
              }

              return (
                <SidebarMenuButton
                  active={pathname === section.path}
                  key={section.id}
                  onClick={() => navigate(section.path)}
                >
                  <Icon className="size-4" />
                  {section.title}
                </SidebarMenuButton>
              )
            })}
          </div>
          <div className="px-3 pb-1 pt-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
            Vendors
          </div>
          <SidebarMenuButton
            active={pathname.startsWith("/vendors")}
            onClick={() => navigate("/vendors")}
          >
            <Users className="size-4" />
            Providers
          </SidebarMenuButton>
          <div className="px-3 pb-1 pt-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
            Policies and documents
          </div>
          <SidebarMenuButton
            active={pathname.startsWith("/templates")}
            onClick={() => navigate("/templates")}
          >
            <FileText className="size-4" />
            Templates
          </SidebarMenuButton>
          <SidebarMenuButton
            active={pathname.startsWith("/documents")}
            onClick={() => navigate("/documents")}
          >
            <ScrollText className="size-4" />
            Documents
          </SidebarMenuButton>
        </SidebarMenu>
        <div className="pt-4">
          <SidebarMenu>
            <div className="px-3 pb-1 pt-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
              Settings
            </div>
            <SidebarMenuButton
              active={pathname.startsWith("/vocabulary")}
              onClick={() => navigate("/vocabulary")}
            >
              <Tags className="size-4" />
              Vocabulary
            </SidebarMenuButton>
          </SidebarMenu>
        </div>
      </SidebarContent>
      <SidebarFooter>
        <div className="flex items-center gap-3 rounded-md px-2 py-2">
          {user.picture ? (
            <img
              alt=""
              className="size-9 shrink-0 rounded-full"
              src={user.picture}
            />
          ) : (
            <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white">
              {user.name.slice(0, 1).toUpperCase()}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-slate-900">
              {user.name}
            </p>
            <p className="truncate text-xs text-slate-500" title={user.email}>
              {user.email}
            </p>
          </div>
          <Button
            aria-label="Logout"
            size="icon-sm"
            type="button"
            variant="ghost"
            onClick={onLogout}
          >
            <LogOut className="size-4" />
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
