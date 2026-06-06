import { type ReactNode } from "react"
import { Link } from "react-router-dom"
import { ChevronRight } from "lucide-react"

export type PageHeaderCrumb = {
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
    <header className="fixed inset-x-0 top-0 z-30 border-b border-slate-200 bg-slate-50 px-4 py-1 text-primary md:left-64 md:px-12">
      <div className="flex min-h-8 flex-col justify-between gap-2 md:flex-row md:items-center">
        <nav aria-label="Breadcrumb">
          <ol className="flex flex-wrap items-center gap-2 text-sm text-primary">
            {items.map((item, index) => {
              const isLast = index === items.length - 1

              return (
                <li className="flex min-w-0 items-center gap-2" key={index}>
                  {item.href && !isLast ? (
                    <Link
                      className="rounded-sm text-primary/80 underline-offset-4 hover:text-primary hover:underline focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:outline-none"
                      to={item.href}
                    >
                      {item.label}
                    </Link>
                  ) : (
                    <span className={isLast ? "text-primary" : "text-primary/75"}>
                      {item.label}
                    </span>
                  )}
                  {!isLast ? (
                    <ChevronRight
                      aria-hidden="true"
                      className="size-4 shrink-0 text-primary/45"
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
