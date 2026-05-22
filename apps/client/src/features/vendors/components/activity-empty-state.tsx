import { ClipboardList } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"

export const ActivityEmptyState = ({ onAdd }: { onAdd: () => void }) => (
  <Empty>
    <EmptyHeader>
      <EmptyMedia variant="icon">
        <ClipboardList />
      </EmptyMedia>
      <EmptyTitle>No activities yet</EmptyTitle>
      <EmptyDescription>
        Define processing activities with purposes and legal basis so services
        and documents can reference them consistently.
      </EmptyDescription>
    </EmptyHeader>
    <EmptyContent>
      <Button type="button" onClick={onAdd}>
        Add activity
      </Button>
    </EmptyContent>
  </Empty>
)
