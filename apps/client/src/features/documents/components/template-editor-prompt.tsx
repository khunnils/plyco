import { ArrowUp, Loader2 } from "lucide-react"
import { type KeyboardEvent } from "react"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

export const TemplateEditorPrompt = ({
  isPending,
  value,
  onApply,
  onChange,
}: {
  isPending: boolean
  value: string
  onApply: () => void
  onChange: (value: string) => void
}) => {
  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (
      event.key !== "Enter" ||
      event.shiftKey ||
      event.nativeEvent.isComposing
    ) {
      return
    }

    event.preventDefault()
    if (!isPending && value.trim()) {
      onApply()
    }
  }

  return (
    <div className="relative">
      <Textarea
        aria-label="Describe a change"
        disabled={isPending}
        id="template-editor-prompt"
        maxLength={4000}
        placeholder="Describe a change"
        className="field-sizing-fixed h-28 max-h-28 min-h-28 resize-none [scrollbar-width:none] overflow-y-auto rounded-xl border-slate-200 bg-white px-5 pt-4 pr-16 pb-14 text-base shadow-sm focus-visible:shadow-md md:text-base [&::-webkit-scrollbar]:hidden"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={handleKeyDown}
      />
      <Button
        aria-label="Send edit instruction"
        className="absolute right-3 bottom-3 size-10 cursor-pointer rounded-full p-0"
        disabled={isPending || !value.trim()}
        size="icon"
        type="button"
        onClick={onApply}
      >
        {isPending ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <ArrowUp className="size-5" />
        )}
      </Button>
    </div>
  )
}
