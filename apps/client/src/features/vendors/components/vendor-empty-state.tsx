import { PackageOpen } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"

export const VendorEmptyState = ({ onAdd }: { onAdd: () => void }) => (
  <Empty>
    <EmptyHeader>
      <EmptyMedia variant="icon">
        <PackageOpen />
      </EmptyMedia>
      <EmptyTitle>No vendors yet</EmptyTitle>
      <EmptyDescription>
        Add providers your organization uses so security reviews have a clear
        vendor inventory.
      </EmptyDescription>
    </EmptyHeader>
    <EmptyContent>
      <Button type="button" onClick={onAdd}>
        Add vendor
      </Button>
    </EmptyContent>
  </Empty>
)
