/* oxlint-disable react/only-export-components */
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-sm border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:ring-3 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "bg-slate-900 text-white hover:bg-slate-800 focus-visible:border-slate-900 focus-visible:ring-slate-100",
        outline:
          "border-slate-200 bg-white text-slate-900 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-950 focus-visible:border-slate-900 focus-visible:ring-slate-100 aria-expanded:border-slate-300 aria-expanded:bg-slate-50 aria-expanded:text-slate-950",
        secondary:
          "bg-slate-700 text-white hover:bg-slate-800 focus-visible:border-slate-700 focus-visible:ring-slate-100 aria-expanded:bg-slate-800 aria-expanded:text-white",
        ghost:
          "text-slate-700 hover:bg-slate-100 hover:text-slate-950 focus-visible:border-slate-900 focus-visible:ring-slate-100 aria-expanded:bg-slate-100 aria-expanded:text-slate-950",
        destructive:
          "bg-red-50 text-red-700 hover:bg-red-100 hover:text-red-800 focus-visible:border-red-500 focus-visible:ring-red-100",
        link: "border-0 bg-transparent text-slate-900 underline-offset-4 hover:text-slate-800 hover:underline focus-visible:ring-slate-100",
      },
      size: {
        default:
          "h-10 gap-1.5 px-4 has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3",
        xs: "h-6 gap-1 px-2.5 text-xs has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-9 gap-1 px-3.5 has-data-[icon=inline-end]:pr-2.5 has-data-[icon=inline-start]:pl-2.5",
        lg: "h-11 gap-1.5 px-5 has-data-[icon=inline-end]:pr-4 has-data-[icon=inline-start]:pl-4",
        icon: "size-9",
        "icon-xs": "size-6 [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-8",
        "icon-lg": "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const Button = ({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) => {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
