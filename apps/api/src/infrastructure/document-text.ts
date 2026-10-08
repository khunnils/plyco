// Decode generated literal-note syntax after Markdown table cells are split, so
// user-entered pipes remain text and cannot become extra table columns.
export const documentPlainText = (value: string) =>
  value
    .replace(/<br\s*\/?\s*>/gi, "\n")
    .replace(/&#(\d+);/g, (entity, digits: string) => {
      const code = Number(digits);
      return code <= 0x10ffff ? String.fromCodePoint(code) : entity;
    });
