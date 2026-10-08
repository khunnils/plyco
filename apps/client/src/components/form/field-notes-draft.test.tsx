import { describe, expect, it } from "vitest"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { createFormControl, type Resolver } from "react-hook-form"
import { renderToStaticMarkup } from "react-dom/server"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  emptySecurityProfile,
  emptyServiceProfile,
  securityProfileSchema,
  type SecurityProfile,
  type ServiceProfileInput,
} from "@plyco/contracts"
import { applyNoteToForm, noteBindingFor } from "./field-notes-draft"
import { FieldNotesContext } from "./field-notes-context"
import { CodeSetEditButton } from "./code-set-edit-button"
import { SelectField } from "./select-field"
import { FieldSettings } from "./field-settings"
import { DocumentMarkdown } from "@/features/documents/components/document-markdown"

const note = {
  customerFacing: "GitHub required reviewers",
  internal: "Verify settings",
}

describe("field notes drafts", () => {
  it("applies to the draft, submits alongside values, retains failed-save drafts, and resets on cancel", async () => {
    const defaults = { ...emptySecurityProfile, fieldNotes: {} }
    const form = createFormControl<SecurityProfile>({
      defaultValues: defaults,
      resolver: zodResolver(securityProfileSchema) as Resolver<SecurityProfile>,
    })
    const unsubscribe = form.subscribe({
      formState: { values: true },
      callback: () => undefined,
    })
    form.setValue("codeReviewRequired", true)
    applyNoteToForm(form, noteBindingFor("codeReviewRequired"), note)
    expect(form.getValues()).toMatchObject({
      codeReviewRequired: true,
      fieldNotes: { codeReviewRequired: note },
    })
    await expect(
      form.handleSubmit(async () => {
        throw new Error("Save failed")
      })()
    ).rejects.toThrow("Save failed")
    expect(form.getValues().fieldNotes).toEqual({ codeReviewRequired: note })
    let submitted: SecurityProfile | undefined
    await form.handleSubmit((value) => {
      submitted = value
    })()
    expect(submitted).toMatchObject({
      codeReviewRequired: true,
      fieldNotes: { codeReviewRequired: note },
    })
    form.reset(defaults)
    expect(form.getValues().fieldNotes).toEqual({})
    expect(form.getValues().codeReviewRequired).toBeNull()
    unsubscribe()
  })
  it("binds nested service notes and stable control keys without creating array-index metadata", () => {
    const form = createFormControl<ServiceProfileInput>({
      defaultValues: emptyServiceProfile,
    })
    const unsubscribe = form.subscribe({
      formState: { values: true },
      callback: () => undefined,
    })
    applyNoteToForm(form, noteBindingFor("privacy.primaryHostingRegion"), note)
    applyNoteToForm(
      form,
      {
        path: "privacy.fieldNotes",
        key: "cookieCategories.analytics.requiresConsent",
      },
      note
    )
    expect(form.getValues().privacy.fieldNotes).toEqual({
      primaryHostingRegion: note,
      "cookieCategories.analytics.requiresConsent": note,
    })
    applyNoteToForm(form, noteBindingFor("privacy.primaryHostingRegion"), {
      customerFacing: "",
      internal: "",
    })
    expect(form.getValues().privacy.fieldNotes).toEqual({
      "cookieCategories.analytics.requiresConsent": note,
    })
    unsubscribe()
  })
  it("keeps notes beside the label and code-set settings inline when both are available", () => {
    const form = createFormControl<{ reviewTool: string }>({
      defaultValues: { reviewTool: "github" },
    })
    const html = renderToStaticMarkup(
      <QueryClientProvider client={new QueryClient()}>
        <FieldNotesContext.Provider
          value={{ getNote: () => note, applyNote: () => undefined }}
        >
          <SelectField
            control={form.control}
            name="reviewTool"
            label="Review tool"
            options={[
              {
                value: "github",
                label: "GitHub",
                codeSetId: "review_tools",
                editable: true,
              },
            ]}
          />
        </FieldNotesContext.Provider>
      </QueryClientProvider>
    )
    expect(html).toContain('aria-label="Review tool notes, has notes"')
    expect(html).toContain('aria-label="Edit Review tool options"')
    expect(html).toContain("lucide-sticky-note")
    expect(html).toContain("lucide-settings")
    expect(html.indexOf("Review tool notes")).toBeLessThan(
      html.indexOf('role="combobox"')
    )
    expect(html.indexOf("Edit Review tool options")).toBeGreaterThan(
      html.indexOf('role="combobox"')
    )
    expect(html).not.toContain('aria-haspopup="menu"')
    expect(
      renderToStaticMarkup(
        <CodeSetEditButton label="Review tool" onEdit={() => undefined} />
      )
    ).toContain('aria-label="Edit Review tool options"')
    expect(html).not.toContain(note.internal)
    expect(
      renderToStaticMarkup(<FieldSettings name="name" label="Name" />)
    ).toBe("")
  })
  it("keeps generated line breaks and literal note syntax in previews", () => {
    const html = renderToStaticMarkup(
      <DocumentMarkdown
        content={"&#42;&#42;GitHub&#42;&#42;<br />&#60;b&#62;text&#60;/b&#62;"}
      />
    )
    expect(html).toContain("**GitHub**")
    expect(html).toContain("<br")
    expect(html).not.toContain("<strong>")
    expect(html).not.toContain("<b>")
  })
})
