import { Database } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"

export const DataTypeEmptyState = ({ onAdd }: { onAdd: () => void }) => (
  <Empty>
    <EmptyHeader>
      <EmptyMedia variant="icon">
        <Database />
      </EmptyMedia>
      <EmptyTitle>No data types yet</EmptyTitle>
      <EmptyDescription>
        Define the categories of data your organization stores so services and
        activities can reference them consistently.
      </EmptyDescription>
    </EmptyHeader>
    <EmptyContent>
      <Button type="button" onClick={onAdd}>
        Add data type
      </Button>
    </EmptyContent>
  </Empty>
)
