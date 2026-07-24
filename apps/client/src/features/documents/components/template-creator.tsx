import { zodResolver } from "@hookform/resolvers/zod"
import {
  generateTemplateInputSchema,
  type GenerateTemplateInput,
} from "@plyco/shared"
import { ArrowLeft, Loader2, Sparkles } from "lucide-react"
import { useForm } from "react-hook-form"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

export const TemplateCreator = ({
  isPending,
  onCancel,
  onSubmit,
}: {
  isPending: boolean
  onCancel: () => void
  onSubmit: (input: GenerateTemplateInput) => void
}) => {
  const form = useForm<GenerateTemplateInput>({
    resolver: zodResolver(generateTemplateInputSchema),
    defaultValues: { prompt: "" },
  })
  const error = form.formState.errors.prompt?.message

  return (
    <section className="relative flex min-h-[calc(100vh-8.5rem)] items-center justify-center px-4 py-16">
      <Button
        className="absolute top-0 left-0"
        disabled={isPending}
        type="button"
        variant="ghost"
        onClick={onCancel}
      >
        <ArrowLeft className="size-4" />
        Back
      </Button>

      <form className="w-full max-w-2xl" onSubmit={form.handleSubmit(onSubmit)}>
        <div className="mb-8 text-center">
          <p className="text-sm font-medium text-slate-500">
            Create a template
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
            What are you looking to build?
          </h1>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-slate-500">
            Describe the document, its audience, and anything it should cover.
            You can review and edit the generated template before publishing.
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-2 shadow-sm transition-shadow focus-within:shadow-md">
          <label className="sr-only" htmlFor="template-prompt">
            What are you looking to build?
          </label>
          <Textarea
            aria-describedby={
              error ? "template-prompt-error" : "template-prompt-help"
            }
            aria-invalid={Boolean(error)}
            autoFocus
            className="min-h-36 resize-y border-0 px-4 py-3 text-base shadow-none focus-visible:border-transparent focus-visible:ring-0"
            disabled={isPending}
            id="template-prompt"
            placeholder="For example: A vendor security policy for a small SaaS company, written for customers and covering reviews, subprocessors, and ongoing monitoring."
            {...form.register("prompt")}
          />
          <div className="flex flex-col gap-3 border-t border-slate-100 px-2 pt-2 sm:flex-row sm:items-center sm:justify-between">
            <p
              className={
                error ? "text-xs text-red-600" : "text-xs text-slate-400"
              }
              id={error ? "template-prompt-error" : "template-prompt-help"}
            >
              {error ??
                "Include the purpose, audience, and important sections."}
            </p>
            <Button disabled={isPending} type="submit">
              {isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Sparkles className="size-4" />
              )}
              {isPending ? "Creating template..." : "Create template"}
            </Button>
          </div>
        </div>
      </form>
    </section>
  )
}
