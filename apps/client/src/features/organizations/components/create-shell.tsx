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
  unframed = false,
}: {
  children: ReactNode
  onBack?: () => void
  step: WizardStep
  title: string
  titleAbove?: boolean
  description?: string
  unframed?: boolean
}) => {
  const isLookup = step === "lookup-organization" || step === "lookup-privacy"
  const currentStep = stepNumber(step)

  return (
    <main className="relative min-h-svh overflow-hidden bg-[#f7f8fa] text-slate-900">
      {/* Subtle brand-tinted background per docs/design.md */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(80%_60%_at_50%_-10%,rgba(59,130,246,0.08),transparent_70%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle,#334155_1px,transparent_1px)] bg-size-[26px_26px] opacity-[0.05] mask-[radial-gradient(ellipse_at_center,black_20%,transparent_75%)]" />
      </div>
      <section className="relative flex min-h-[calc(100svh-1.5rem)] flex-col overflow-hidden rounded-lg">
        <header className="flex items-center gap-4 border-b border-slate-200 bg-white/80 px-4 py-4 backdrop-blur sm:px-8">
          <div className="flex min-w-0 items-center gap-4">
            {currentStep > 1 ? (
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
                STEP {currentStep} OF {stepOrder.length}
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
            className={`w-full px-5 py-8 sm:px-10 sm:py-10 ${
              unframed ? "max-w-5xl" : "max-w-3xl"
            } ${
              isLookup || unframed
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
      {currentStep > 0 ? (
        <div
          aria-label={`Onboarding progress: step ${currentStep} of ${stepOrder.length}`}
          aria-valuemax={stepOrder.length}
          aria-valuemin={1}
          aria-valuenow={currentStep}
          className="pointer-events-none fixed bottom-6 left-1/2 flex -translate-x-1/2 items-center gap-2.5 rounded-full bg-white/85 px-3 py-2.5 shadow-sm ring-1 ring-slate-200/80 backdrop-blur"
          role="progressbar"
        >
          {stepOrder.map((stepName, index) => {
            const dotStep = index + 1
            const isCurrent = dotStep === currentStep
            const isComplete = dotStep < currentStep

            return (
              <span
                aria-hidden="true"
                className={`size-2 rounded-full transition-colors duration-300 ${
                  isCurrent
                    ? "bg-primary ring-primary-100 ring-4"
                    : isComplete
                      ? "bg-primary"
                      : "bg-slate-300"
                }`}
                key={stepName}
              />
            )
          })}
        </div>
      ) : null}
    </main>
  )
}
