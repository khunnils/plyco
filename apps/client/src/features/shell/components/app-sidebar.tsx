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
  type LucideIcon,
} from "lucide-react"
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

export type CompanySectionId =
  | "profile"
  | "service"
  | "activities"
  | "privacy"
  | "infrastructure"
  | "dataHandling"
  | "access"

export type WorkspaceView =
  | "dashboard"
  | "companyProfile"
  | "companyService"
  | "companyActivities"
  | "companyPrivacy"
  | "companyInfrastructure"
  | "companyData"
  | "companyAccess"
  | "templates"
  | "documents"
  | "vendors"
  | "vocabulary"

export type CompanySection = {
  id: CompanySectionId
  view: WorkspaceView
  title: string
  description: string
  icon: LucideIcon
}

export const AppSidebar = ({
  activeWorkspaceView,
  companySections,
  onLogout,
  onAddService,
  onSelectService,
  onServicesExpandedChange,
  onWorkspaceViewChange,
  selectedServiceId,
  services,
  servicesExpanded,
  user,
}: {
  activeWorkspaceView: WorkspaceView
  companySections: CompanySection[]
  onLogout: () => void
  onAddService: () => void
  onSelectService: (serviceId: string | null) => void
  onServicesExpandedChange: (expanded: boolean) => void
  onWorkspaceViewChange: (view: WorkspaceView) => void
  selectedServiceId: string | null
  services: ServiceProfileInput[]
  servicesExpanded: boolean
  user: AuthUser
}) => (
  <Sidebar>
    <SidebarHeader>
        <OrganizationSwitcher user={user} />
    </SidebarHeader>
    <SidebarContent>
      <SidebarMenu>
        <SidebarMenuButton
          active={activeWorkspaceView === "dashboard"}
          onClick={() => onWorkspaceViewChange("dashboard")}
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
                    active={activeWorkspaceView === section.view}
                    onClick={() => {
                      onWorkspaceViewChange(section.view)
                      onServicesExpandedChange(!servicesExpanded)
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
                          activeWorkspaceView === "companyService" &&
                          (selectedServiceId === serviceId ||
                            (!selectedServiceId && index === 0))

                        return (
                          <SidebarMenuButton
                            active={selected}
                            key={service.id ?? `service-${index}`}
                            onClick={() => {
                              onSelectService(serviceId)
                              onWorkspaceViewChange("companyService")
                            }}
                          >
                            <span className="truncate">
                              {service.serviceName || `Service ${index + 1}`}
                            </span>
                          </SidebarMenuButton>
                        )
                      })}
                      <SidebarMenuButton
                        onClick={() => {
                          onAddService()
                          onWorkspaceViewChange("companyService")
                        }}
                      >
                        <Plus className="size-4" />
                        Add service
                      </SidebarMenuButton>
                    </div>
                  ) : null}
                </div>
              )
            }

            return (
              <SidebarMenuButton
                active={activeWorkspaceView === section.view}
                key={section.id}
                onClick={() => onWorkspaceViewChange(section.view)}
              >
                <Icon className="size-4" />
                {section.title}
              </SidebarMenuButton>
            )
          })}
        </div>
        <SidebarMenuButton
          active={activeWorkspaceView === "vendors"}
          onClick={() => onWorkspaceViewChange("vendors")}
        >
          <Users className="size-4" />
          Vendors
        </SidebarMenuButton>
        <div className="px-3 pb-1 pt-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
          Policies and documents
        </div>
        <SidebarMenuButton
          active={activeWorkspaceView === "templates"}
          onClick={() => onWorkspaceViewChange("templates")}
        >
          <FileText className="size-4" />
          Templates
        </SidebarMenuButton>
        <SidebarMenuButton
          active={activeWorkspaceView === "documents"}
          onClick={() => onWorkspaceViewChange("documents")}
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
            active={activeWorkspaceView === "vocabulary"}
            onClick={() => onWorkspaceViewChange("vocabulary")}
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
