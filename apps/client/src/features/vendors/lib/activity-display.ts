import { type Vocabulary } from "@plyco/shared"

import { codeLabel } from "@/features/vocabulary/lib/vocabulary"

export const codeValueList = (
  vocabulary: Vocabulary | undefined,
  codeSetId: string,
  values: string[],
) =>
  values.length > 0
    ? values.map((value) => codeLabel(vocabulary, codeSetId, value)).join(", ")
    : "Not set"
