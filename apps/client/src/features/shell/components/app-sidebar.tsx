import {
  LayoutDashboard,
  Lightbulb,
  ScrollText,
  Settings,
  Users,
} from "lucide-react"
import { useLocation, useNavigate } from "react-router-dom"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarSectionLabel,
} from "@/components/ui/sidebar"
import { OrganizationSwitcher } from "@/features/organizations/components/organization-switcher"
import {
  SIDEBAR_SECTION,
  companySections,
  productAndDataSections,
} from "@/features/shell/lib/navigation"

export type { CompanySection, CompanySectionId } from "@/features/shell/lib/navigation"

export const AppSidebar = () => {
  const location = useLocation()
  const navigate = useNavigate()

  const pathname = location.pathname

  return (
    <Sidebar>
      <SidebarHeader>
        <OrganizationSwitcher />
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
          <SidebarMenuButton
            active={pathname.startsWith("/recommendations")}
            onClick={() => navigate("/recommendations")}
          >
            <Lightbulb className="size-4" />
            Recommendations
          </SidebarMenuButton>
          <SidebarSectionLabel>{SIDEBAR_SECTION.company}</SidebarSectionLabel>
          <div className="ml-2 grid gap-1">
            {companySections.map((section) => {
              const Icon = section.icon

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
          <SidebarSectionLabel>{SIDEBAR_SECTION.productAndData}</SidebarSectionLabel>
          <div className="ml-2 grid gap-1">
            {productAndDataSections.map((section) => {
              const Icon = section.icon

              return (
                <SidebarMenuButton
                  active={
                    section.id === "service"
                      ? pathname.startsWith(section.path)
                      : pathname === section.path
                  }
                  key={section.id}
                  onClick={() => navigate(section.path)}
                >
                  <Icon className="size-4" />
                  {section.title}
                </SidebarMenuButton>
              )
            })}
          </div>
          <SidebarSectionLabel>{SIDEBAR_SECTION.vendors}</SidebarSectionLabel>
          <div className="ml-2 grid gap-1">
            <SidebarMenuButton
              active={pathname.startsWith("/vendors")}
              onClick={() => navigate("/vendors")}
            >
              <Users className="size-4" />
              Providers
            </SidebarMenuButton>
          </div>

          <SidebarSectionLabel>{SIDEBAR_SECTION.documents}</SidebarSectionLabel>
          <div className="ml-2 grid gap-1">
            <SidebarMenuButton
              active={pathname.startsWith("/documents")}
              onClick={() => navigate("/documents")}
            >
              <ScrollText className="size-4" />
              Policies & Documents
            </SidebarMenuButton>
          </div>
        </SidebarMenu>

      </SidebarContent>
      <SidebarFooter>
        <SidebarMenuButton
          active={pathname.startsWith("/settings")}
          onClick={() => navigate("/settings/team")}
        >
          <Settings className="size-4" />
          Settings
        </SidebarMenuButton>
      </SidebarFooter>
    </Sidebar>
  )
}
