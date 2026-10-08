import nunjucks from "nunjucks";
import { type FieldNotes } from "@plyco/contracts";

// Notes are literal prose even when interpolated into Markdown tables or HTML.
// Entity-encode Markdown syntax before the Markdown renderer sees it; only our
// line-break tags are markup. Nunjucks never evaluates interpolated strings.
export const literalNote = (value: string) =>
  value
    .replace(
      /[&<>"'\\`*_{}\[\]()#+.!|~=\-]/g,
      (character) => `&#${character.charCodeAt(0)};`,
    )
    .replace(/\r\n?|\n/g, "<br />");

export const withoutFieldNotes = <T extends { fieldNotes?: FieldNotes }>(
  value: T,
) => {
  const { fieldNotes: _notes, ...fields } = value;
  return fields;
};

export const customerNotesFor = (
  value: { fieldNotes?: FieldNotes },
  mapping?: Record<string, string>,
): Record<string, unknown> => {
  const result: Record<string, unknown> = {};
  for (const [source, note] of Object.entries(value.fieldNotes ?? {})) {
    const destination = mapping
      ? mapping[source]
      : source
          .replace(/^cookieCategories\./, "cookieCategoryControls.")
          .replace(/^organizationProviders\./, "providerSystems.");
    if (!destination || !note.customerFacing) continue;
    const keys = destination.split(".");
    let target = result;
    for (const key of keys.slice(0, -1)) {
      target[key] ??= {};
      target = target[key] as Record<string, unknown>;
    }
    target[keys[keys.length - 1]!] = literalNote(note.customerFacing);
  }
  return result;
};

export const prepareNoteRendering = (
  value: unknown,
  inNotes = false,
): unknown => {
  if (typeof value === "string" && inNotes)
    return new nunjucks.runtime.SafeString(value);
  if (Array.isArray(value))
    return value.map((item) => prepareNoteRendering(item, inNotes));
  if (value && typeof value === "object")
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [
        key,
        prepareNoteRendering(item, inNotes || key === "customerNotes"),
      ]),
    );
  return value;
};
