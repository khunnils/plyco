import { describe, expect, it } from "vitest"

import { moveSortableId } from "./sortable-list-utils"

describe("moveSortableId", () => {
  it("moves an item to its dropped position", () => {
    expect(moveSortableId(["a", "b", "c"], "a", "c")).toEqual(["b", "c", "a"])
  })

  it("leaves the order unchanged for unknown or identical ids", () => {
    const ids = ["a", "b"]
    expect(moveSortableId(ids, "a", "a")).toBe(ids)
    expect(moveSortableId(ids, "missing", "b")).toBe(ids)
  })
})
