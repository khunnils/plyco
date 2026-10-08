import { describe, expect, it } from "vitest"
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
  it("renders one settings trigger when notes and vocabulary editing coexist", () => {
    const html = renderToStaticMarkup(
      <FieldNotesContext.Provider
        value={{ getNote: () => note, applyNote: () => undefined }}
      >
        <FieldSettings
          name="codeReviewRequired"
          label="Code review required"
          onEditOptions={() => undefined}
        />
      </FieldNotesContext.Provider>
    )
    expect(html.match(/<button/g)).toHaveLength(1)
    expect(html).toContain("Code review required settings, has notes")
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
