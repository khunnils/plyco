import { type ReactNode } from "react"

import { cn } from "@/lib/utils"

export const SidebarProvider = ({ children }: { children: ReactNode }) => (
  <div className="min-h-svh bg-slate-50 text-slate-900">{children}</div>
)

export const Sidebar = ({ children }: { children: ReactNode }) => (
  <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-slate-200 bg-white md:flex md:flex-col">
    {children}
  </aside>
)

export const SidebarHeader = ({ children }: { children: ReactNode }) => (
  <div className="border-b border-slate-200 p-4">{children}</div>
)

export const SidebarContent = ({ children }: { children: ReactNode }) => (
  <div className="flex flex-1 flex-col p-3">{children}</div>
)

export const SidebarFooter = ({ children }: { children: ReactNode }) => (
  <div className="border-t border-slate-200 p-3">{children}</div>
)

export const SidebarMenu = ({ children }: { children: ReactNode }) => (
  <nav className="grid gap-1">{children}</nav>
)

export const SidebarMenuButton = ({
  active = false,
  children,
  onClick,
}: {
  active?: boolean
  children: ReactNode
  onClick: () => void
}) => (
  <button
    className={cn(
      "flex h-10 w-full items-center gap-3 rounded-md px-3 text-left text-sm font-medium transition",
      active
        ? "bg-slate-50 text-slate-900"
        : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
    )}
    type="button"
    onClick={onClick}
  >
    {children}
  </button>
)

export const SidebarInset = ({ children }: { children: ReactNode }) => (
  <div className="min-h-svh md:pl-64">{children}</div>
)
