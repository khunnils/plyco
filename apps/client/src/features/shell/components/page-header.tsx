import { type ReactNode } from "react"
import { Link } from "react-router-dom"
import { ChevronRight } from "lucide-react"

type PageHeaderCrumb = {
  label: string
  href?: string
}

export const PageHeader = ({
  breadcrumbs,
  eyebrow,
  title,
  children,
}: {
  breadcrumbs?: PageHeaderCrumb[]
  eyebrow: string
  title: string
  children?: ReactNode
}) => {
  const items = breadcrumbs ?? [{ label: eyebrow }, { label: title }]

  return (
    <header className="fixed inset-x-0 top-0 z-30 border-b border-white/10 bg-primary px-4 py-2 text-primary-foreground shadow-sm md:left-64 md:px-12">
      <div className="flex min-h-8 flex-col justify-between gap-2 md:flex-row md:items-center">
        <nav aria-label="Breadcrumb">
          <ol className="flex flex-wrap items-center gap-2 text-base font-semibold text-white">
            {items.map((item, index) => {
              const isLast = index === items.length - 1

              return (
                <li className="flex min-w-0 items-center gap-2" key={index}>
                  {item.href && !isLast ? (
                    <Link
                      className="rounded-sm text-white/80 underline-offset-4 hover:text-white hover:underline focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:outline-none"
                      to={item.href}
                    >
                      {item.label}
                    </Link>
                  ) : (
                    <span className={isLast ? "text-white" : "text-white/75"}>
                      {item.label}
                    </span>
                  )}
                  {!isLast ? (
                    <ChevronRight
                      aria-hidden="true"
                      className="size-4 shrink-0 text-white/45"
                    />
                  ) : null}
                </li>
              )
            })}
          </ol>
        </nav>
        {children ? (
          <div className="flex items-center gap-2">{children}</div>
        ) : null}
      </div>
    </header>
  )
}
