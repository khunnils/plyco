import { type ReactNode } from "react"
import { ArrowLeft, CircleHelp } from "lucide-react"

import { Button } from "@/components/ui/button"
import { type WizardStep, stepNumber, stepOrder } from "./types"

export const CreateShell = ({
  actions,
  children,
  onBack,
  step,
  title,
  titleAbove,
  description,
}: {
  actions: ReactNode
  children: ReactNode
  onBack?: () => void
  step: WizardStep
  title: string
  titleAbove?: boolean
  description?: string
}) => {
  const isLookup = step === "lookup-organization" || step === "lookup-privacy"

  return (
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
            <img
              src="/logo.png"
              alt="Plyco"
              className="h-8 w-auto rounded-md object-contain"
            />
          </div>
          <div className="flex items-center gap-4">
            {stepNumber(step) > 0 ? (
              <div className="hidden items-center gap-3 sm:flex">
                <span className="text-sm font-semibold text-slate-600">
                  Step {stepNumber(step)} of {stepOrder.length}
                </span>
                <div className="bg-primary-100 h-2 w-28 overflow-hidden">
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
        <div className="flex flex-1 flex-col items-center justify-center px-4 py-10 sm:px-8">
          {titleAbove && title ? (
            <div className="mx-auto mb-8 max-w-2xl text-center">
              <p className="mb-2 text-xs font-semibold tracking-widest text-slate-500 uppercase">
                STEP {stepNumber(step)} OF {stepOrder.length}
              </p>
              <h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
                {title}
              </h1>
              {description ? (
                <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-500">
                  {description}
                </p>
              ) : null}
            </div>
          ) : null}
          <section
            className={`w-full max-w-3xl px-5 py-8 sm:px-10 sm:py-10 ${
              isLookup
                ? ""
                : "rounded-lg bg-white shadow-sm ring-1 ring-slate-200"
            }`}
          >
            {!titleAbove && title ? (
              <div className="mx-auto mb-8 max-w-2xl text-center">
                <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
                  {title}
                </h1>
              </div>
            ) : null}
            {children}
          </section>
        </div>
      </section>
    </main>
  )
}
