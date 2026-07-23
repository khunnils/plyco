import { Handle, Position, type NodeProps } from "@xyflow/react"

import type { ProductDataGraphNode } from "@/features/company/graph/lib/product-data-graph"
import { cn } from "@/lib/utils"

const KIND_LABELS: Record<ProductDataGraphNode["data"]["kind"], string> = {
  company: "Company",
  service: "Service",
  activity: "Activity",
  data: "Data Type",
  provider: "Provider",
}

const KIND_STYLES: Record<ProductDataGraphNode["data"]["kind"], string> = {
  company: "border-slate-900 bg-slate-900 text-white",
  service: "border-blue-200 bg-blue-50 text-blue-950",
  activity: "border-amber-200 bg-amber-50 text-amber-950",
  data: "border-teal-200 bg-teal-50 text-teal-950",
  provider: "border-violet-200 bg-violet-50 text-violet-950",
}

export const ProductDataGraphNodeComponent = ({
  data,
}: NodeProps<ProductDataGraphNode>) => (
  <div
    className={cn(
      "w-56 cursor-pointer rounded-md border px-4 py-3 text-left shadow-sm ring-1 ring-black/2 transition-[opacity,box-shadow] duration-150",
      KIND_STYLES[data.kind],
      data.emphasis === "focused" && "z-10 shadow-md ring-2 ring-slate-900/25",
      data.emphasis === "related" && "z-10 shadow-md",
      data.emphasis === "dimmed" && "opacity-25"
    )}
  >
    <Handle
      className="opacity-0"
      isConnectable={false}
      position={Position.Left}
      type="target"
    />
    <div className="text-[11px] font-semibold tracking-normal uppercase opacity-70">
      {KIND_LABELS[data.kind]}
    </div>
    <div className="mt-1 truncate text-sm font-semibold" title={data.label}>
      {data.label}
    </div>
    {data.detail ? (
      <div
        className="mt-1 line-clamp-2 text-xs leading-5 opacity-75"
        title={data.detail}
      >
        {data.detail}
      </div>
    ) : null}
    <Handle
      className="opacity-0"
      isConnectable={false}
      position={Position.Right}
      type="source"
    />
  </div>
)
