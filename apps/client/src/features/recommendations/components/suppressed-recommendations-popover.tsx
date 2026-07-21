import { type AdvisorRuleEvaluation } from "@plyco/shared"
import { EyeOff, LoaderCircle, RotateCcw } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover"
import { useRuleSuppression } from "@/features/recommendations/hooks/use-recommendations"

export const SuppressedRecommendationsPopover = ({
  rules,
}: {
  rules: AdvisorRuleEvaluation[]
}) => {
  const suppression = useRuleSuppression()
  const suppressedRules = rules.filter(({ status }) => status === "suppressed")

  if (suppressedRules.length === 0) {
    return null
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button className="cursor-pointer" size="sm" variant="outline">
          <EyeOff />
          Suppressed
          <span className="text-xs text-slate-500">
            {suppressedRules.length}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-96 max-w-[calc(100vw-2rem)]">
        <PopoverHeader>
          <PopoverTitle>Suppressed recommendations</PopoverTitle>
          <PopoverDescription>
            Restore a rule to include it in recommendations and readiness again.
          </PopoverDescription>
        </PopoverHeader>
        <div className="grid max-h-80 gap-2 overflow-y-auto">
          {suppressedRules.map((rule) => {
            const isPending =
              suppression.isPending && suppression.variables?.ruleId === rule.id

            return (
              <div
                className="flex items-center gap-3 rounded-sm border border-slate-200 p-3"
                key={rule.id}
              >
                <span className="min-w-0 flex-1 text-sm font-medium text-slate-800">
                  {rule.title}
                </span>
                <Button
                  aria-label={`Restore ${rule.title}`}
                  className="cursor-pointer"
                  disabled={isPending}
                  size="xs"
                  type="button"
                  variant="ghost"
                  onClick={() =>
                    suppression.mutate({ ruleId: rule.id, suppress: false })
                  }
                >
                  {isPending ? (
                    <LoaderCircle className="animate-spin motion-reduce:animate-none" />
                  ) : (
                    <RotateCcw />
                  )}
                  Restore
                </Button>
              </div>
            )
          })}
        </div>
      </PopoverContent>
    </Popover>
  )
}
