import {
  Children,
  isValidElement,
  type ReactElement,
  type ReactNode,
  type ComponentProps,
} from "react"
import { Dialog } from "radix-ui"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { Button } from "@/components/ui/button"
import { FieldNotesDialog } from "./field-notes-dialog"

const state = vi.hoisted(() => ({
  draft: undefined as { customerFacing: string; internal: string } | undefined,
}))

vi.mock("react", async (importOriginal) => ({
  ...(await importOriginal<typeof import("react")>()),
  useId: () => "notes-dialog",
  useState: (initial: NonNullable<typeof state.draft>) => {
    state.draft ??= initial
    return [
      state.draft,
      (value: NonNullable<typeof state.draft>) => {
        state.draft = value
      },
    ]
  },
}))

const elements = (node: ReactNode): ReactElement<Record<string, unknown>>[] =>
  Children.toArray(node).flatMap((child) => {
    if (!isValidElement<Record<string, unknown>>(child)) return []
    return [child, ...elements(child.props.children as ReactNode)]
  })

const initial = { customerFacing: "Saved public", internal: "Saved private" }

beforeEach(() => {
  state.draft = undefined
})

describe("field notes dialog actions", () => {
  it("applies a trimmed draft and discards edits on Cancel", () => {
    const onApply = vi.fn()
    const onClose = vi.fn()
    const render = () =>
      FieldNotesDialog({
        label: "Code review",
        note: initial,
        onApply,
        onClose,
      })
    const textarea = elements(render()).find(
      (element) => element.type === "textarea"
    ) as ReactElement<ComponentProps<"textarea">>
    textarea.props.onChange?.({
      target: { value: "  Changed public\nSecond line  " },
    } as Parameters<NonNullable<ComponentProps<"textarea">["onChange"]>>[0])
    const apply = elements(render()).find(
      (element) => element.type === Button && element.props.children === "Apply"
    ) as ReactElement<ComponentProps<typeof Button>>
    apply.props.onClick?.(
      {} as Parameters<NonNullable<ComponentProps<typeof Button>["onClick"]>>[0]
    )
    expect(onApply).toHaveBeenCalledWith({
      customerFacing: "Changed public\nSecond line",
      internal: "Saved private",
    })
    expect(onClose).toHaveBeenCalledOnce()
    expect(initial.customerFacing).toBe("Saved public")

    state.draft = { customerFacing: "Unsaved", internal: "Unsaved" }
    onApply.mockClear()
    onClose.mockClear()
    const cancel = elements(render()).find(
      (element) =>
        element.type === Button && element.props.children === "Cancel"
    ) as ReactElement<ComponentProps<typeof Button>>
    cancel.props.onClick?.(
      {} as Parameters<NonNullable<ComponentProps<typeof Button>["onClick"]>>[0]
    )
    expect(onApply).not.toHaveBeenCalled()
    expect(onClose).toHaveBeenCalledOnce()
  })

  it("stops dialog keys reaching panel shortcuts and closes Escape without applying", () => {
    const onApply = vi.fn()
    const onClose = vi.fn()
    const content = elements(
      FieldNotesDialog({
        label: "Code review",
        note: initial,
        onApply,
        onClose,
      })
    ).find((element) => element.type === Dialog.Content) as ReactElement<
      ComponentProps<typeof Dialog.Content>
    >
    for (const key of ["Enter", "Escape"]) {
      const stopPropagation = vi.fn()
      content.props.onKeyDown?.({
        key,
        stopPropagation,
      } as unknown as Parameters<
        NonNullable<ComponentProps<typeof Dialog.Content>["onKeyDown"]>
      >[0])
      expect(stopPropagation).toHaveBeenCalledOnce()
    }
    const preventDefault = vi.fn()
    content.props.onEscapeKeyDown?.({ preventDefault } as unknown as Parameters<
      NonNullable<ComponentProps<typeof Dialog.Content>["onEscapeKeyDown"]>
    >[0])
    expect(preventDefault).toHaveBeenCalledOnce()
    expect(onClose).toHaveBeenCalledOnce()
    expect(onApply).not.toHaveBeenCalled()
  })
})
