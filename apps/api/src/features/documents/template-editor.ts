import {
  templateInputSchema,
  type EditTemplateWithPromptInput,
  type TemplateInput,
  type TemplateVariableCatalog,
} from "@plyco/shared";

import {
  loadTemplateVariableCatalog,
  templateLlmResponseSchema,
  validateTemplateReferences,
} from "./template-llm.js";
import { ApiError } from "../../infrastructure/errors.js";
import { type LlmJsonClient } from "../../infrastructure/llm-client.js";
import { type PromptClient } from "../../infrastructure/prompt-client.js";

const PROMPT_NAME = "template_editor";

export interface TemplateEditorService {
  edit(input: EditTemplateWithPromptInput): Promise<TemplateInput>;
}

export class LlmTemplateEditorService implements TemplateEditorService {
  constructor(
    private readonly promptClient: PromptClient,
    private readonly llmClient: LlmJsonClient,
    private readonly model: string,
    private readonly loadSchema: () => Promise<TemplateVariableCatalog> =
      loadTemplateVariableCatalog,
  ) {}

  async edit(input: EditTemplateWithPromptInput): Promise<TemplateInput> {
    const catalog = await this.loadSchema();
    const prompt = await this.promptClient.compilePrompt(PROMPT_NAME, {
      userInput: input.prompt,
      template: JSON.stringify(input.template),
      schema: JSON.stringify(catalog),
    });
    const generated = await this.llmClient.generateJson({
      model: this.model,
      prompt,
      responseSchema: templateLlmResponseSchema,
    });
    const parsed = templateInputSchema.safeParse(generated);

    if (!parsed.success) {
      throw new ApiError(
        "TEMPLATE_EDITOR_INVALID_RESPONSE",
        "Template editor returned an invalid response shape.",
        502,
        parsed.error.flatten(),
      );
    }

    validateTemplateReferences(parsed.data.content, catalog);
    return parsed.data;
  }
}
