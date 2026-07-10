import { z } from "zod";

export const templateSlugSchema = z
  .string()
  .trim()
  .min(1)
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "Template slug must use lowercase letters, numbers, and hyphens",
  );

export const systemTemplateSchema = z.object({
  slug: templateSlugSchema,
  name: z.string().trim().min(1),
  description: z.string().trim().min(1),
  content: z.string(),
});

export const templateSchema = z.object({
  id: z.string().min(1),
  organizationId: z.string().min(1),
  name: z.string().trim().min(1),
  slug: templateSlugSchema,
  sourceSystemTemplateSlug: templateSlugSchema.nullable(),
  content: z.string(),
  versionMajor: z.number().int().default(1),
  versionMinor: z.number().int().default(0),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const templateInputSchema = z.object({
  name: z.string().trim().min(1, "Template name is required"),
  content: z.string(),
});

export const templatePreviewInputSchema = templateInputSchema;

export const templatePreviewSchema = z.object({
  renderedContent: z.string(),
});

type InternalTemplateVariableField = {
  key: string;
  label: string;
  type: string;
  category?: string;
  description?: string;
  example?: unknown;
  itemFields?: InternalTemplateVariableField[];
};

export const templateVariableFieldSchema: z.ZodType<InternalTemplateVariableField> =
  z.lazy(() =>
    z.object({
      key: z.string().min(1),
      label: z.string().min(1),
      type: z.string().min(1).default("unknown"),
      category: z.string().min(1).optional(),
      description: z.string().optional(),
      example: z.unknown().optional(),
      itemFields: z.array(templateVariableFieldSchema).optional(),
    }),
  );

export const templateVariableSchema = templateVariableFieldSchema.and(
  z.object({
    category: z.string().min(1),
  }),
);

export const templateVariableCatalogSchema = z.object({
  version: z.number().int().positive(),
  variables: z.array(templateVariableSchema),
});

export const createTemplateFromSystemSchema = z.object({
  sourceSystemTemplateSlug: templateSlugSchema,
});

export const templateCatalogSchema = z.object({
  systemTemplates: z.array(systemTemplateSchema),
  organizationTemplates: z.array(templateSchema),
});

export type SystemTemplate = z.infer<typeof systemTemplateSchema>;
export type Template = z.infer<typeof templateSchema>;
export type TemplateInput = z.infer<typeof templateInputSchema>;
export type TemplatePreviewInput = z.infer<typeof templatePreviewInputSchema>;
export type TemplatePreview = z.infer<typeof templatePreviewSchema>;
export type TemplateVariable = z.infer<typeof templateVariableSchema>;
export type TemplateVariableField = z.infer<typeof templateVariableFieldSchema>;
export type TemplateVariableCatalog = z.infer<
  typeof templateVariableCatalogSchema
>;
export type CreateTemplateFromSystem = z.infer<
  typeof createTemplateFromSystemSchema
>;
export type TemplateCatalog = z.infer<typeof templateCatalogSchema>;
