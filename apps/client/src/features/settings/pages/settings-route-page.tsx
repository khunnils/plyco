import { Navigate, NavLink, Outlet } from "react-router-dom"

import { PageHeader } from "@/features/shell/components/page-header"
import { SIDEBAR_SECTION } from "@/features/shell/lib/navigation"
import { cn } from "@/lib/utils"

export const SettingsRoutePage = () => (
  <>
    <PageHeader
      breadcrumbs={[{ label: SIDEBAR_SECTION.settings }, { label: "Settings" }]}
      eyebrow={SIDEBAR_SECTION.settings}
      title="Settings"
    />
    <div className="grid gap-6">
      <nav
        aria-label="Settings"
        className="flex w-fit gap-1 border-b border-slate-200"
      >
        <SettingsTab to="/settings/team">General</SettingsTab>
        <SettingsTab to="/settings/vocabulary">Vocabulary</SettingsTab>
        <SettingsTab to="/settings/api-keys">API Keys</SettingsTab>
      </nav>
      <Outlet />
    </div>
  </>
)

export const SettingsIndexRoutePage = () => (
  <Navigate replace to="/settings/team" />
)

const SettingsTab = ({ children, to }: { children: string; to: string }) => (
  <NavLink
    className={({ isActive }) =>
      cn(
        "border-b-2 px-3 py-2 text-sm font-medium transition",
        isActive
          ? "border-slate-900 text-slate-950"
          : "border-transparent text-slate-500 hover:text-slate-900"
      )
    }
    to={to}
  >
    {children}
  </NavLink>
)
