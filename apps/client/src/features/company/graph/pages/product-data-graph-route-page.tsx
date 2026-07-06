import { useMemo } from "react"
import { Background, Panel, ReactFlow, type NodeTypes } from "@xyflow/react"
import "@xyflow/react/dist/style.css"
import { Loader2, Network } from "lucide-react"

import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { PageHeader } from "@/features/shell/components/page-header"
import {
  SIDEBAR_SECTION,
  sectionPageBreadcrumbs,
} from "@/features/shell/lib/navigation"
import { useOrganizationSnapshot } from "@/features/company/hooks/use-company"
import { ProductDataGraphNodeComponent } from "@/features/company/graph/components/product-data-graph-node"
import { buildProductDataGraph } from "@/features/company/graph/lib/product-data-graph"

const nodeTypes: NodeTypes = {
  entity: ProductDataGraphNodeComponent,
}

const graphStages = [
  { label: "Company", className: "bg-slate-900" },
  { label: "Services", className: "bg-blue-500" },
  { label: "Activities", className: "bg-amber-500" },
  { label: "Data", className: "bg-teal-500" },
  { label: "Vendors", className: "bg-violet-500" },
]

export const ProductDataGraphRoutePage = () => {
  const organizationSnapshot = useOrganizationSnapshot()
  const graph = useMemo(
    () => buildProductDataGraph(organizationSnapshot.data),
    [organizationSnapshot.data]
  )

  const hasGraphContent = graph.nodes.length > 1

  return (
    <>
      <PageHeader
        breadcrumbs={sectionPageBreadcrumbs(SIDEBAR_SECTION.productAndData, [
          { label: "Graph" },
        ])}
        eyebrow={SIDEBAR_SECTION.productAndData}
        title="Graph"
      />

      {organizationSnapshot.isLoading ? (
        <div className="-mx-4 -mb-6 flex h-[calc(100svh-6rem)] items-center justify-center bg-white text-sm text-slate-600 md:-mx-12">
          <Loader2 className="mr-2 size-4 animate-spin" />
          Loading product graph
        </div>
      ) : !hasGraphContent ? (
        <Empty className="-mx-4 -mb-6 h-[calc(100svh-6rem)] border-0 bg-white md:-mx-12">
          <EmptyHeader>
            <EmptyMedia
              className="size-12 rounded-full border-slate-200 bg-slate-50"
              variant="icon"
            >
              <Network />
            </EmptyMedia>
            <EmptyTitle>No product graph available</EmptyTitle>
            <EmptyDescription>
              Add services, activities, data types, and provider usage to see
              how product data moves through the organization.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <section className="-mx-4 -mb-6 h-[calc(100svh-6rem)] overflow-hidden bg-white md:-mx-12">
          <ReactFlow
            aria-label="Product data relationship graph"
            colorMode="light"
            edges={graph.edges}
            edgesFocusable={false}
            elementsSelectable={false}
            fitView
            fitViewOptions={{ padding: 0.12 }}
            maxZoom={1.4}
            minZoom={0.35}
            nodes={graph.nodes}
            nodeTypes={nodeTypes}
            nodesConnectable={false}
            nodesDraggable={false}
            nodesFocusable={false}
            panOnDrag
            proOptions={{ hideAttribution: true }}
          >
            <Panel position="top-left">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-md bg-white/90 px-3 py-2 text-xs font-medium text-slate-600 shadow-sm ring-1 ring-slate-200 backdrop-blur-sm">
                {graphStages.map((stage, index) => (
                  <div className="flex items-center gap-2" key={stage.label}>
                    <span
                      aria-hidden="true"
                      className={`size-2 rounded-full ${stage.className}`}
                    />
                    <span>{stage.label}</span>
                    {index < graphStages.length - 1 ? (
                      <span aria-hidden="true" className="text-slate-300">
                        →
                      </span>
                    ) : null}
                  </div>
                ))}
              </div>
            </Panel>
            <Background color="#dbe3ec" gap={28} size={1} />
          </ReactFlow>
        </section>
      )}
    </>
  )
}
