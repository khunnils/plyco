import { useMemo } from "react"
import {
  Background,
  ReactFlow,
  type NodeTypes,
} from "@xyflow/react"
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
import { useSecurityProfile } from "@/features/company/hooks/use-company"
import { ProductDataGraphNodeComponent } from "@/features/company/graph/components/product-data-graph-node"
import { buildProductDataGraph } from "@/features/company/graph/lib/product-data-graph"

const nodeTypes: NodeTypes = {
  entity: ProductDataGraphNodeComponent,
}

export const ProductDataGraphRoutePage = () => {
  const securityProfile = useSecurityProfile()
  const graph = useMemo(
    () => buildProductDataGraph(securityProfile.data),
    [securityProfile.data]
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

      {securityProfile.isLoading ? (
        <div className="flex min-h-[520px] items-center justify-center border border-slate-200 bg-white text-sm text-slate-600">
          <Loader2 className="mr-2 size-4 animate-spin" />
          Loading product graph
        </div>
      ) : !hasGraphContent ? (
        <Empty className="min-h-[520px] border-slate-200 bg-white">
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
        <section className="h-[640px] overflow-hidden border border-slate-200 bg-white">
          <ReactFlow
            colorMode="light"
            edges={graph.edges}
            edgesFocusable={false}
            elementsSelectable={false}
            fitView
            fitViewOptions={{ padding: 0.2 }}
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
            <Background color="#cbd5e1" gap={24} size={1} />
          </ReactFlow>
        </section>
      )}
    </>
  )
}
