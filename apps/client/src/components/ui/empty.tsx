import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const Empty = ({ className, ...props }: React.ComponentProps<"div">) => (
  <div
    data-slot="empty"
    className={cn(
      "flex min-h-60 flex-col items-center justify-center gap-6 rounded-lg border border-dashed bg-card p-6 text-center",
      className
    )}
    {...props}
  />
)

const EmptyHeader = ({ className, ...props }: React.ComponentProps<"div">) => (
  <div
    data-slot="empty-header"
    className={cn("flex max-w-sm flex-col items-center gap-2", className)}
    {...props}
  />
)

const emptyMediaVariants = cva(
  "mb-1 flex items-center justify-center text-muted-foreground",
  {
    variants: {
      variant: {
        default: "",
        icon: "size-10 rounded-lg border bg-background [&_svg]:size-5",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const EmptyMedia = ({
  className,
  variant,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof emptyMediaVariants>) => (
  <div
    data-slot="empty-media"
    className={cn(emptyMediaVariants({ variant, className }))}
    {...props}
  />
)

const EmptyTitle = ({ className, ...props }: React.ComponentProps<"div">) => (
  <div
    data-slot="empty-title"
    className={cn("text-base font-semibold text-foreground", className)}
    {...props}
  />
)

const EmptyDescription = ({
  className,
  ...props
}: React.ComponentProps<"p">) => (
  <p
    data-slot="empty-description"
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
)

const EmptyContent = ({ className, ...props }: React.ComponentProps<"div">) => (
  <div
    data-slot="empty-content"
    className={cn(
      "flex flex-wrap items-center justify-center gap-2",
      className
    )}
    {...props}
  />
)

export {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
}
