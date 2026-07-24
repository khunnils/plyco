import { MarkerType, type Edge, type Node } from "@xyflow/react"
import type { SecurityProgramSnapshot } from "@plyco/shared"

export type ProductDataGraphNodeKind =
  | "company"
  | "service"
  | "activity"
  | "data"
  | "provider"

export type ProductDataGraphNodeEmphasis =
  | "focused"
  | "related"
  | "dimmed"

export type ProductDataGraphNodeData = {
  label: string
  kind: ProductDataGraphNodeKind
  detail?: string
  emphasis?: ProductDataGraphNodeEmphasis
}

export type ProductDataGraphNode = Node<ProductDataGraphNodeData, "entity">
export type ProductDataGraphEdge = Edge

export type ProductDataGraph = {
  nodes: ProductDataGraphNode[]
  edges: ProductDataGraphEdge[]
}

const COLUMN_X = 340
const ROW_Y = 128
const NODE_START_Y = 80

const normalizeDataTypeName = (name: string) =>
  name.trim().toLowerCase().replace(/\s+/g, "-")

const nodePosition = (column: number, row: number) => ({
  x: column * COLUMN_X,
  y: NODE_START_Y + row * ROW_Y,
})

const edge = (
  id: string,
  source: string,
  target: string,
  options: Pick<ProductDataGraphEdge, "animated" | "style" | "label"> = {}
): ProductDataGraphEdge => ({
  id,
  source,
  target,
  type: "smoothstep",
  markerEnd: {
    type: MarkerType.ArrowClosed,
    width: 16,
    height: 16,
    color: "#94a3b8",
  },
  style: { stroke: "#94a3b8", strokeWidth: 1.5 },
  ...options,
})

export const buildProductDataGraph = (
  snapshot: SecurityProgramSnapshot | undefined
): ProductDataGraph => {
  const organization = snapshot?.organization

  if (!organization) {
    return { nodes: [], edges: [] }
  }

  const nodes = new Map<string, ProductDataGraphNode>()
  const edges = new Map<string, ProductDataGraphEdge>()

  const addNode = (
    id: string,
    column: number,
    row: number,
    data: ProductDataGraphNodeData
  ) => {
    if (nodes.has(id)) {
      return
    }

    nodes.set(id, {
      id,
      type: "entity",
      position: nodePosition(column, row),
      data,
    })
  }

  const addEdge = (nextEdge: ProductDataGraphEdge) => {
    if (!edges.has(nextEdge.id)) {
      edges.set(nextEdge.id, nextEdge)
    }
  }

  addNode("company", 0, 0, {
    kind: "company",
    label: organization.company.companyName || "Company",
    detail: organization.company.website ?? undefined,
  })

  organization.services.forEach((service, index) => {
    const serviceId = `service:${service.id}`
    addNode(serviceId, 1, index, {
      kind: "service",
      label: service.serviceName?.trim() || `Service ${index + 1}`,
      detail: service.serviceUrl ?? undefined,
    })
    addEdge(edge(`company-to-${service.id}`, "company", serviceId))
  })

  const activityRows = new Map<string, number>()
  snapshot.businessActivities.forEach((activity, index) => {
    activityRows.set(activity.id, index)
    addNode(`activity:${activity.id}`, 2, index, {
      kind: "activity",
      label: activity.name,
      detail: activity.purpose || undefined,
    })
  })

  organization.services.forEach((service) => {
    service.businessActivityIds.forEach((activityId) => {
      if (!activityRows.has(activityId)) {
        return
      }

      addEdge(
        edge(
          `service-${service.id}-to-activity-${activityId}`,
          `service:${service.id}`,
          `activity:${activityId}`
        )
      )
    })
  })

  const dataTypeNames = new Map(
    organization.dataHandling.dataTypesStored
      .map(
        (dataType) => [normalizeDataTypeName(dataType.name), dataType] as const
      )
      .filter(([normalizedName]) => normalizedName.length > 0)
  )
  const dataRows = new Map<string, number>()
  const dataNodeIdByDataTypeId = new Map<string, string>()

  organization.dataHandling.dataTypesStored.forEach((dataType) => {
    const normalizedName = normalizeDataTypeName(dataType.name)

    if (!normalizedName) {
      return
    }

    if (!dataRows.has(normalizedName)) {
      dataRows.set(normalizedName, dataRows.size)
    }

    const dataNodeId = `data:${normalizedName}`
    addNode(dataNodeId, 3, dataRows.get(normalizedName)!, {
      kind: "data",
      label: dataType.name,
      detail: dataType.description ?? undefined,
    })

    if (dataType.id) {
      dataNodeIdByDataTypeId.set(dataType.id, dataNodeId)
    }
  })

  snapshot.businessActivities.forEach((activity) => {
    activity.dataTypeIds.forEach((dataTypeId) => {
      const dataNodeId = dataNodeIdByDataTypeId.get(dataTypeId)

      if (!dataNodeId || !activityRows.has(activity.id)) {
        return
      }

      addEdge(
        edge(
          `activity-${activity.id}-to-data-${dataTypeId}`,
          `activity:${activity.id}`,
          dataNodeId
        )
      )
    })
  })

  const providersById = new Map(
    snapshot.organizationProviders.map((provider) => [provider.id, provider])
  )

  // Only show providers that participate in at least one graph connection
  // (direct service usage or a data type that matches inventory).
  const connectedProviderIds = new Set<string>()
  snapshot.serviceProviderUsage.forEach((usage) => {
    if (
      !nodes.has(`service:${usage.serviceId}`) ||
      !providersById.has(usage.organizationProviderId)
    ) {
      return
    }

    if (usage.dataProcessed.length === 0) {
      connectedProviderIds.add(usage.organizationProviderId)
      return
    }

    const hasMatchingData = usage.dataProcessed.some((dataName) =>
      dataTypeNames.has(normalizeDataTypeName(dataName))
    )
    if (hasMatchingData) {
      connectedProviderIds.add(usage.organizationProviderId)
    }
  })

  const providerRows = new Map<string, number>()
  snapshot.organizationProviders.forEach((provider) => {
    if (!connectedProviderIds.has(provider.id)) {
      return
    }

    const row = providerRows.size
    providerRows.set(provider.id, row)
    addNode(`provider:${provider.id}`, 4, row, {
      kind: "provider",
      label: provider.name,
      detail: provider.purpose || provider.category || undefined,
    })
  })

  snapshot.serviceProviderUsage.forEach((usage) => {
    const serviceNodeId = `service:${usage.serviceId}`
    const providerNodeId = `provider:${usage.organizationProviderId}`

    if (
      !nodes.has(serviceNodeId) ||
      !providerRows.has(usage.organizationProviderId)
    ) {
      return
    }

    if (usage.dataProcessed.length === 0) {
      addEdge(
        edge(
          `service-${usage.serviceId}-to-provider-${usage.organizationProviderId}-${usage.id}`,
          serviceNodeId,
          providerNodeId,
          {
            label: "usage",
            style: { stroke: "#94a3b8", strokeDasharray: "5 5" },
          }
        )
      )
      return
    }

    usage.dataProcessed.forEach((dataName) => {
      const normalizedName = normalizeDataTypeName(dataName)
      const dataType = dataTypeNames.get(normalizedName)

      if (!dataType) {
        return
      }

      const dataNodeId = `data:${normalizedName}`
      addEdge(
        edge(
          `service-${usage.serviceId}-to-data-${normalizedName}`,
          serviceNodeId,
          dataNodeId
        )
      )
      addEdge(
        edge(
          `data-${normalizedName}-to-provider-${usage.organizationProviderId}-${usage.id}`,
          dataNodeId,
          providerNodeId
        )
      )
    })
  })

  return {
    nodes: Array.from(nodes.values()),
    edges: Array.from(edges.values()),
  }
}

/** Ancestors + descendants of a node (directed), for focus highlighting. */
export const getRelatedGraphElements = (
  nodeId: string,
  edges: ProductDataGraphEdge[]
): { nodeIds: Set<string>; edgeIds: Set<string> } => {
  const outgoing = new Map<string, string[]>()
  const incoming = new Map<string, string[]>()

  for (const graphEdge of edges) {
    const outs = outgoing.get(graphEdge.source) ?? []
    outs.push(graphEdge.target)
    outgoing.set(graphEdge.source, outs)

    const ins = incoming.get(graphEdge.target) ?? []
    ins.push(graphEdge.source)
    incoming.set(graphEdge.target, ins)
  }

  const walk = (start: string, adjacency: Map<string, string[]>) => {
    const visited = new Set<string>()
    const stack = [start]

    while (stack.length > 0) {
      const current = stack.pop()!

      for (const next of adjacency.get(current) ?? []) {
        if (visited.has(next)) {
          continue
        }
        visited.add(next)
        stack.push(next)
      }
    }

    return visited
  }

  const nodeIds = new Set<string>([
    nodeId,
    ...walk(nodeId, outgoing),
    ...walk(nodeId, incoming),
  ])

  const edgeIds = new Set(
    edges
      .filter(
        (graphEdge) =>
          nodeIds.has(graphEdge.source) && nodeIds.has(graphEdge.target)
      )
      .map((graphEdge) => graphEdge.id)
  )

  return { nodeIds, edgeIds }
}
