import { FileText } from "lucide-react"
import { Link } from "react-router-dom"

import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"

export const DocumentsEmptyState = () => (
  <Empty className="min-h-[420px] border-slate-200 bg-white">
    <EmptyHeader>
      <EmptyMedia variant="icon">
        <FileText />
      </EmptyMedia>
      <EmptyTitle>No policy templates yet</EmptyTitle>
      <EmptyDescription>
        Add a system template or create a policy template from scratch before
        generating documents.
      </EmptyDescription>
    </EmptyHeader>
    <EmptyContent>
      <Button asChild type="button">
        <Link to="/documents/add">Add</Link>
      </Button>
    </EmptyContent>
  </Empty>
)
