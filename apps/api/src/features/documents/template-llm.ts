import { readFile } from "node:fs/promises";

import {
  templateVariableCatalogSchema,
  type TemplateVariableCatalog,
} from "@plyco/shared";
import { Type, type SchemaUnion } from "@google/genai";

import { referencedTemplatePaths } from "./document-generation.js";
import { ApiError } from "../../infrastructure/errors.js";

export const templateLlmResponseSchema = {
  type: Type.OBJECT,
  properties: {
    name: {
      type: Type.STRING,
      description: "A concise human-readable name for the template.",
    },
    content: {
      type: Type.STRING,
      description:
        "The complete template as Markdown with supported Nunjucks placeholders.",
    },
  },
  required: ["name", "content"],
} satisfies SchemaUnion;

export const loadTemplateVariableCatalog =
  async (): Promise<TemplateVariableCatalog> =>
    templateVariableCatalogSchema.parse(
      JSON.parse(
        await readFile(
          new URL("../../../data/templates/schema.json", import.meta.url),
          "utf8",
        ),
      ),
    );

const normalizedSchemaKey = (key: string) => key.replaceAll("[]", "");

const catalogFieldKeys = (
  key: string,
  itemFields: TemplateVariableCatalog["variables"][number]["itemFields"],
): string[] => [
  key,
  ...(itemFields ?? []).flatMap((field) =>
    catalogFieldKeys(`${key}.${field.key}`, field.itemFields),
  ),
];

export const validateTemplateReferences = (
  content: string,
  catalog: TemplateVariableCatalog,
) => {
  let referencedPaths: string[];

  try {
    referencedPaths = referencedTemplatePaths(content);
  } catch (error) {
    throw new ApiError(
      "TEMPLATE_LLM_INVALID_SYNTAX",
      "The generated template contains invalid template syntax.",
      502,
      error instanceof Error ? { message: error.message } : undefined,
    );
  }

  const availablePaths = new Set(
    catalog.variables
      .flatMap((variable) =>
        catalogFieldKeys(variable.key, variable.itemFields),
      )
      .map(normalizedSchemaKey),
  );
  const unknownPaths = referencedPaths.filter(
    (path) => !availablePaths.has(normalizedSchemaKey(path)),
  );

  if (unknownPaths.length > 0) {
    throw new ApiError(
      "TEMPLATE_LLM_UNKNOWN_VARIABLES",
      "The generated template contains variables outside the template schema.",
      502,
      { unknownPaths },
    );
  }
};
