/* eslint-disable react-refresh/only-export-components */
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-md border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:ring-3 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "bg-blue-600 text-white hover:bg-blue-700 focus-visible:border-blue-600 focus-visible:ring-blue-100",
        outline:
          "border-slate-200 bg-white text-slate-900 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-950 focus-visible:border-blue-600 focus-visible:ring-blue-100 aria-expanded:border-blue-300 aria-expanded:bg-blue-50 aria-expanded:text-blue-700",
        secondary:
          "bg-teal-700 text-white hover:bg-teal-800 focus-visible:border-teal-700 focus-visible:ring-teal-100 aria-expanded:bg-teal-800 aria-expanded:text-white",
        ghost:
          "text-slate-700 hover:bg-slate-100 hover:text-slate-950 focus-visible:border-blue-600 focus-visible:ring-blue-100 aria-expanded:bg-slate-100 aria-expanded:text-slate-950",
        destructive:
          "bg-red-50 text-red-700 hover:bg-red-100 hover:text-red-800 focus-visible:border-red-500 focus-visible:ring-red-100",
        link: "border-0 bg-transparent text-blue-700 underline-offset-4 hover:text-blue-800 hover:underline focus-visible:ring-blue-100",
      },
      size: {
        default:
          "h-9 gap-1.5 px-3 has-data-[icon=inline-end]:pr-2.5 has-data-[icon=inline-start]:pl-2.5",
        xs: "h-6 gap-1 px-2.5 text-xs has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-8 gap-1 px-3 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        lg: "h-10 gap-1.5 px-4 has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3",
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
