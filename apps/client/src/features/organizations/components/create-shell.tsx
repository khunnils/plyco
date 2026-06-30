import { type ReactNode } from "react"
import { ArrowLeft } from "lucide-react"

import { Button } from "@/components/ui/button"
import { type WizardStep, stepNumber, stepOrder } from "./types"

export const CreateShell = ({
  children,
  onBack,
  step,
  title,
  titleAbove,
  description,
}: {
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
        <header className="flex items-center gap-4 border-b border-slate-200 bg-white/80 px-4 py-4 backdrop-blur sm:px-8">
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
        </header>
        <div className="onboarding-page-transition flex flex-1 flex-col items-center justify-center px-4 pt-10 pb-20 sm:px-8">
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
      {stepNumber(step) > 0 ? (
        <div className="bg-primary-100 pointer-events-none fixed bottom-6 left-1/2 w-40 -translate-x-1/2 overflow-hidden rounded-full shadow-sm sm:w-56">
          <div
            className="h-2 rounded-full bg-primary transition-all duration-300"
            style={{
              width: `${(stepNumber(step) / stepOrder.length) * 100}%`,
            }}
          />
        </div>
      ) : null}
    </main>
  )
}
