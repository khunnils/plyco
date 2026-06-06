import type { Edge, Node } from "@xyflow/react"
import type { SecurityProgramSnapshot } from "@plyco/shared"

export type ProductDataGraphNodeKind =
  | "company"
  | "service"
  | "activity"
  | "data"
  | "provider"

export type ProductDataGraphNodeData = {
  label: string
  kind: ProductDataGraphNodeKind
  detail?: string
}

export type ProductDataGraphNode = Node<ProductDataGraphNodeData, "entity">
export type ProductDataGraphEdge = Edge

export type ProductDataGraph = {
  nodes: ProductDataGraphNode[]
  edges: ProductDataGraphEdge[]
}

const COLUMN_X = 360
const ROW_Y = 120
const NODE_START_Y = 40

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
  const dataColumnOffset = snapshot.businessActivities.length
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
    addNode(dataNodeId, 2, dataColumnOffset + dataRows.get(normalizedName)!, {
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

  const providerRows = new Map<string, number>()
  snapshot.organizationProviders.forEach((provider, index) => {
    providerRows.set(provider.id, index)
    addNode(`provider:${provider.id}`, 3, index, {
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
