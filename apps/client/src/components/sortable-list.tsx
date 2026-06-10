import { type ReactNode } from "react"
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { GripVertical } from "lucide-react"

import { Button } from "@/components/ui/button"
import { moveSortableId } from "@/components/sortable-list-utils"

const SortableItem = ({
  children,
  disabled,
  id,
}: {
  children: (handle: ReactNode, isDragging: boolean) => ReactNode
  disabled: boolean
  id: string
}) => {
  const {
    attributes,
    isDragging,
    listeners,
    setActivatorNodeRef,
    setNodeRef,
    transform,
    transition,
  } = useSortable({
    id,
    disabled,
    animateLayoutChanges: () => false,
  })

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.65 : undefined,
        zIndex: isDragging ? 20 : undefined,
      }}
    >
      {children(
        <Button
          ref={setActivatorNodeRef}
          aria-label="Drag to reorder"
          disabled={disabled}
          size="icon-sm"
          type="button"
          variant="ghost"
          className="cursor-grab text-slate-400 active:cursor-grabbing"
          onClick={(event) => event.stopPropagation()}
          {...attributes}
          {...listeners}
        >
          <GripVertical />
        </Button>,
        isDragging
      )}
    </div>
  )
}

export const SortableList = ({
  children,
  disabled = false,
  ids,
  layout = "vertical",
  onReorder,
}: {
  children: (id: string, handle: ReactNode, isDragging: boolean) => ReactNode
  disabled?: boolean
  ids: string[]
  layout?: "grid" | "vertical"
  onReorder: (ids: string[]) => void
}) => {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )
  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return
    onReorder(moveSortableId(ids, String(active.id), String(over.id)))
  }

  return (
    <DndContext
      collisionDetection={closestCenter}
      sensors={sensors}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={ids}
        strategy={
          layout === "grid" ? rectSortingStrategy : verticalListSortingStrategy
        }
      >
        {ids.map((id) => (
          <SortableItem disabled={disabled} id={id} key={id}>
            {(handle, isDragging) => children(id, handle, isDragging)}
          </SortableItem>
        ))}
      </SortableContext>
    </DndContext>
  )
}
