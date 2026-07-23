import { useEffect, useMemo, useRef, useState } from "react"
import {
  Background,
  ReactFlow,
  type Edge,
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
import { useOrganizationSnapshot } from "@/features/company/hooks/use-company"
import { ProductDataGraphNodeComponent } from "@/features/company/graph/components/product-data-graph-node"
import {
  buildProductDataGraph,
  getRelatedGraphElements,
  type ProductDataGraphNode,
} from "@/features/company/graph/lib/product-data-graph"

const nodeTypes: NodeTypes = {
  entity: ProductDataGraphNodeComponent,
}

const HOVER_CLEAR_DELAY_MS = 80

const DIMMED_EDGE_STYLE = {
  stroke: "#cbd5e1",
  strokeWidth: 1.5,
  opacity: 0.2,
  pointerEvents: "none",
} as const

const RELATED_EDGE_STYLE = {
  stroke: "#0f172a",
  strokeWidth: 2.25,
  opacity: 1,
  pointerEvents: "none",
} as const

const IDLE_EDGE_STYLE = {
  pointerEvents: "none",
} as const

const FOCUSED_EDGE_MARKER = {
  color: "#0f172a",
} as const

export const ProductDataGraphRoutePage = () => {
  const organizationSnapshot = useOrganizationSnapshot()
  const graph = useMemo(
    () => buildProductDataGraph(organizationSnapshot.data),
    [organizationSnapshot.data]
  )
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null)
  const hoverClearTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  )

  useEffect(
    () => () => {
      if (hoverClearTimeoutRef.current) {
        clearTimeout(hoverClearTimeoutRef.current)
      }
    },
    []
  )

  useEffect(() => {
    if (!selectedNodeId) {
      return
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") {
        return
      }
      event.preventDefault()
      setSelectedNodeId(null)
    }

    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [selectedNodeId])

  const focusNodeId = selectedNodeId ?? hoveredNodeId

  const { nodes, edges } = useMemo(() => {
    if (!focusNodeId) {
      return {
        nodes: graph.nodes.map((node) => ({
          ...node,
          data: { ...node.data, emphasis: undefined },
        })),
        edges: graph.edges.map((graphEdge) => ({
          ...graphEdge,
          style: { ...graphEdge.style, ...IDLE_EDGE_STYLE },
        })),
      }
    }

    const related = getRelatedGraphElements(focusNodeId, graph.edges)
    // Animate only for sticky selection — hover animation remounts edges and
    // can bounce mouseenter/mouseleave.
    const animateRelated = selectedNodeId === focusNodeId

    const nextNodes: ProductDataGraphNode[] = graph.nodes.map((node) => {
      const emphasis =
        node.id === focusNodeId
          ? "focused"
          : related.nodeIds.has(node.id)
            ? "related"
            : "dimmed"

      return {
        ...node,
        data: { ...node.data, emphasis },
      }
    })

    const nextEdges: Edge[] = graph.edges.map((graphEdge) => {
      const isRelated = related.edgeIds.has(graphEdge.id)
      const baseStyle = graphEdge.style ?? {}

      return {
        ...graphEdge,
        animated: animateRelated && isRelated,
        style: isRelated
          ? {
              ...baseStyle,
              ...RELATED_EDGE_STYLE,
              strokeDasharray: baseStyle.strokeDasharray,
            }
          : {
              ...baseStyle,
              ...DIMMED_EDGE_STYLE,
              strokeDasharray: baseStyle.strokeDasharray,
            },
        markerEnd:
          typeof graphEdge.markerEnd === "object" && graphEdge.markerEnd
            ? {
                ...graphEdge.markerEnd,
                color: isRelated
                  ? FOCUSED_EDGE_MARKER.color
                  : "#cbd5e1",
              }
            : graphEdge.markerEnd,
        labelStyle: isRelated
          ? { fill: "#0f172a", fontWeight: 600 }
          : { fill: "#94a3b8", opacity: 0.35 },
      }
    })

    return { nodes: nextNodes, edges: nextEdges }
  }, [focusNodeId, graph.edges, graph.nodes, selectedNodeId])

  const hasGraphContent = graph.nodes.length > 1

  const clearHoverSoon = () => {
    if (hoverClearTimeoutRef.current) {
      clearTimeout(hoverClearTimeoutRef.current)
    }
    hoverClearTimeoutRef.current = setTimeout(() => {
      setHoveredNodeId(null)
      hoverClearTimeoutRef.current = null
    }, HOVER_CLEAR_DELAY_MS)
  }

  const setHoverNode = (nodeId: string) => {
    if (hoverClearTimeoutRef.current) {
      clearTimeout(hoverClearTimeoutRef.current)
      hoverClearTimeoutRef.current = null
    }
    setHoveredNodeId(nodeId)
  }

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
            edges={edges}
            edgesFocusable={false}
            elementsSelectable={false}
            fitView
            fitViewOptions={{ padding: 0.12 }}
            maxZoom={1.4}
            minZoom={0.35}
            nodes={nodes}
            nodeTypes={nodeTypes}
            nodesConnectable={false}
            nodesDraggable={false}
            nodesFocusable={false}
            onNodeClick={(_, node) => {
              setSelectedNodeId((current) =>
                current === node.id ? null : node.id
              )
            }}
            onNodeMouseEnter={(_, node) => {
              setHoverNode(node.id)
            }}
            onNodeMouseLeave={() => {
              clearHoverSoon()
            }}
            onPaneClick={() => {
              setSelectedNodeId(null)
            }}
            panOnDrag
            proOptions={{ hideAttribution: true }}
          >
            <Background color="#dbe3ec" gap={28} size={1} />
          </ReactFlow>
        </section>
      )}
    </>
  )
}
