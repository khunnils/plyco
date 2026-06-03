import { LayoutDashboard, LogOut, ScrollText, Tags, Users } from "lucide-react"
import { useLocation, useNavigate } from "react-router-dom"
import { type AuthUser } from "@plyco/shared"

import { Button } from "@/components/ui/button"
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

export const AppSidebar = ({
  onLogout,
  user,
}: {
  onLogout: () => void
  user: AuthUser
}) => {
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
        <div className="pt-4">
          <SidebarMenu>
            <SidebarSectionLabel>{SIDEBAR_SECTION.settings}</SidebarSectionLabel>
            <div className="ml-2 grid gap-1">
              <SidebarMenuButton
                active={pathname.startsWith("/vocabulary")}
                onClick={() => navigate("/vocabulary")}
              >
                <Tags className="size-4" />
                Vocabulary
              </SidebarMenuButton>
            </div>
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
