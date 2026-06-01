import { type ReactNode } from "react"
import { ArrowLeft, CircleHelp } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  type WizardStep,
  stepNumber,
  stepOrder,
} from "./types"

export const CreateShell = ({
  actions,
  children,
  eyebrow,
  onBack,
  step,
  title,
}: {
  actions: ReactNode
  children: ReactNode
  eyebrow: string
  onBack?: () => void
  step: WizardStep
  title: string
}) => (
  <main className="min-h-svh bg-slate-50 text-slate-900">
    <section className="flex min-h-[calc(100svh-1.5rem)] flex-col overflow-hidden rounded-lg">
      <header className="flex items-center justify-between gap-4 border-b border-slate-200 bg-white/80 px-4 py-4 backdrop-blur sm:px-8">
        <div className="flex min-w-0 items-center gap-4">
          {stepNumber(step) > 1 ? (
            <Button
              aria-label="Back"
              size="icon"
              type="button"
              variant="ghost"
              onClick={onBack}
            >
              <ArrowLeft />
            </Button>
          ) : null}
          <div className="min-w-0">
            <p className="truncate text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
              Organization Setup
            </p>
            <p className="text-sm font-medium text-slate-700">{eyebrow}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {stepNumber(step) > 0 ? (
            <div className="hidden items-center gap-3 sm:flex">
              <span className="text-sm font-semibold text-slate-600">
                Step {stepNumber(step)} of {stepOrder.length}
              </span>
              <div className="h-2 w-28 overflow-hidden bg-primary-100">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{
                    width: `${(stepNumber(step) / stepOrder.length) * 100}%`,
                  }}
                />
              </div>
            </div>
          ) : null}
          <CircleHelp className="hidden size-5 text-slate-500 sm:block" />
          {actions}
        </div>
      </header>
      <div className="flex flex-1 items-center justify-center px-4 py-10 sm:px-8">
        <section className="w-full max-w-3xl rounded-lg bg-white px-5 py-8 shadow-sm ring-1 ring-slate-200 sm:px-10 sm:py-10">
          <div className="mx-auto mb-8 max-w-2xl text-center">
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
              {title}
            </h1>
          </div>
          {children}
        </section>
      </div>
    </section>
  </main>
)
